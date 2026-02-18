'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { City, CityWithStats } from '@/types/database'

// ============================================
// GET CITIES
// ============================================

export async function getActiveCities(): Promise<City[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

export async function getCitiesWithStats(): Promise<CityWithStats[]> {
  const supabase = await createClient()

  const { data: cities, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error || !cities) return []

  // Get venue and event counts for each city
  const citiesWithStats = await Promise.all(
    cities.map(async (city) => {
      const [venues, events] = await Promise.all([
        supabase
          .from('venues')
          .select('id', { count: 'exact' })
          .eq('city', city.name)
          .eq('state', city.state)
          .eq('status', 'approved'),
        supabase
          .from('events')
          .select('id, venue:venues!inner(city, state)', { count: 'exact' })
          .eq('venue.city', city.name)
          .eq('venue.state', city.state)
          .eq('is_cancelled', false)
          .gte('date', new Date().toISOString().split('T')[0]),
      ])

      return {
        ...city,
        venue_count: venues.count || 0,
        event_count: events.count || 0,
      }
    })
  )

  return citiesWithStats
}

export async function getCityBySlug(cityName: string, state: string): Promise<City | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', cityName)
    .eq('state', state.toUpperCase())
    .single()

  if (error) return null
  return data
}

// ============================================
// CITY DETECTION
// ============================================

export async function detectUserCity(latitude: number, longitude: number): Promise<City | null> {
  const supabase = await createClient()

  // Get all active cities and find the closest one
  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)

  if (!cities || cities.length === 0) return null

  // Calculate distance to each city
  let closest: City | null = null
  let closestDistance = Infinity

  for (const city of cities) {
    if (!city.latitude || !city.longitude) continue

    const distance = getDistanceKm(latitude, longitude, city.latitude, city.longitude)
    if (distance < closestDistance) {
      closestDistance = distance
      closest = city
    }
  }

  // Only return if within 100km
  if (closestDistance > 100) return null

  return closest
}

// ============================================
// ADMIN: MANAGE CITIES
// ============================================

export async function createCity(city: {
  name: string
  state: string
  latitude?: number
  longitude?: number
  timezone?: string
}): Promise<{ city?: City; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Not authorized' }

  const { data, error } = await supabase
    .from('cities')
    .insert({
      name: city.name,
      state: city.state.toUpperCase(),
      latitude: city.latitude || null,
      longitude: city.longitude || null,
      timezone: city.timezone || 'America/New_York',
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'City already exists' }
    return { error: 'Failed to create city' }
  }

  revalidatePath('/admin/cities')
  return { city: data }
}

export async function updateCity(
  cityId: string,
  updates: Partial<Pick<City, 'name' | 'state' | 'latitude' | 'longitude' | 'timezone' | 'is_active' | 'ambassador_id'>>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Not authorized' }

  const { error } = await supabase
    .from('cities')
    .update(updates)
    .eq('id', cityId)

  if (error) return { error: 'Failed to update city' }

  revalidatePath('/admin/cities')
  return { success: true }
}

export async function getAllCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return []

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .order('name', { ascending: true })

  if (error) return []
  return data || []
}

// ============================================
// TRENDING IN CITY
// ============================================

export async function getTrendingInCity(cityName: string, state: string) {
  const supabase = await createClient()

  // Get venues in city
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, current_crowd_level, cover_photo_url, venue_type')
    .eq('city', cityName)
    .eq('state', state)
    .eq('status', 'approved')
    .order('current_crowd_level', { ascending: false })
    .limit(10)

  // Get upcoming events in city
  const today = new Date().toISOString().split('T')[0]
  const { data: events } = await supabase
    .from('events')
    .select(`
      id, name, date, start_time, tickets_sold, flyer_url,
      venue:venues!inner(id, name, city, state)
    `)
    .eq('venue.city', cityName)
    .eq('venue.state', state)
    .gte('date', today)
    .eq('is_cancelled', false)
    .order('tickets_sold', { ascending: false })
    .limit(10)

  return {
    hot_venues: venues || [],
    popular_events: events || [],
  }
}

// ============================================
// HELPERS
// ============================================

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
