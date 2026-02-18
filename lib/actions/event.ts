'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMyVenue } from './venue'

export async function getUpcomingEvents(filter?: 'tonight' | 'tomorrow' | 'this-week' | 'this-weekend') {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('events')
    .select(`*, venue:venues(id, name, slug, city, state, venue_type, cover_photo_url, current_crowd_level, is_eighteen_plus, is_twenty_one_plus)`)
    .eq('is_cancelled', false)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (filter === 'tonight' || filter === 'tomorrow') {
    const targetDate = filter === 'tonight' ? today : new Date(Date.now() + 86400000).toISOString().split('T')[0]
    query = query.eq('date', targetDate)
  } else if (filter === 'this-weekend') {
    const now = new Date()
    const day = now.getDay()
    const fridayOffset = day <= 5 ? 5 - day : 0
    const friday = new Date(now.getTime() + fridayOffset * 86400000)
    const sunday = new Date(friday.getTime() + 2 * 86400000)
    query = query
      .gte('date', friday.toISOString().split('T')[0])
      .lte('date', sunday.toISOString().split('T')[0])
  } else if (filter === 'this-week') {
    const endOfWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    query = query.lte('date', endOfWeek)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error('[Events] Error fetching events:', error)
    return []
  }

  return data || []
}

export async function getEventById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select(`*, venue:venues(id, name, slug, city, state, address_line1, venue_type, cover_photo_url, current_crowd_level, is_eighteen_plus, is_twenty_one_plus, latitude, longitude)`)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Events] Error fetching event:', error)
    return null
  }

  return data
}

export async function getVenueEvents(venueId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', venueId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[Events] Error fetching venue events:', error)
    return []
  }

  return data || []
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue) return { error: 'No venue found' }

  const artistsStr = formData.get('artists') as string
  const artists = artistsStr ? artistsStr.split(',').map((a) => a.trim()).filter(Boolean) : []

  const dealsStr = formData.get('drink_specials') as string
  const drinkSpecials = dealsStr ? dealsStr.split(',').map((d) => d.trim()).filter(Boolean) : []

  const eventName = formData.get('name') as string

  const event = {
    venue_id: venue.id,
    name: eventName,
    description: (formData.get('description') as string) || null,
    date: formData.get('date') as string,
    start_time: formData.get('start_time') as string,
    end_time: (formData.get('end_time') as string) || null,
    artists,
    cover_charge: parseFloat(formData.get('cover_charge') as string) || 0,
    ticket_price: formData.get('ticket_price') ? parseFloat(formData.get('ticket_price') as string) : null,
    ticket_count: formData.get('ticket_count') ? parseInt(formData.get('ticket_count') as string) : null,
    drink_specials: drinkSpecials,
    is_featured: formData.get('is_featured') === 'true',
  }

  const { data: insertedEvent, error } = await supabase
    .from('events')
    .insert(event)
    .select('id')
    .single()

  if (error) {
    console.error('[Events] Error creating event:', error)
    return { error: 'Failed to create event' }
  }

  // Notify followers of this venue (fire and forget)
  if (insertedEvent) {
    fetch('/api/push/notify-followers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venueId: venue.id,
        eventId: insertedEvent.id,
        eventName,
        venueName: venue.name,
      }),
    }).catch((err) => {
      console.error('[Events] Error notifying followers:', err)
    })
  }

  revalidatePath('/venue-portal/events')
  return { success: true }
}

export async function getFeaturedEvents() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select(`*, venue:venues(id, name, slug, city, state, venue_type, cover_photo_url, current_crowd_level, is_eighteen_plus, is_twenty_one_plus)`)
    .eq('is_featured', true)
    .eq('is_cancelled', false)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[Events] Error fetching featured events:', error)
    return []
  }

  return data || []
}

export async function getAllEventsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Verify admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') return []

  const { data, error } = await supabase
    .from('events')
    .select(`*, venue:venues(id, name, slug)`)
    .order('date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[Events] Error fetching all events:', error)
    return []
  }

  return data || []
}

export async function toggleEventFeatured(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') return { error: 'Unauthorized' }

  // Get current state
  const { data: event } = await supabase
    .from('events')
    .select('is_featured')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Event not found' }

  const { error } = await supabase
    .from('events')
    .update({ is_featured: !event.is_featured })
    .eq('id', eventId)

  if (error) return { error: 'Failed to update event' }

  revalidatePath('/admin/events')
  revalidatePath('/map')
  return { success: true, is_featured: !event.is_featured }
}

export async function searchEvents(query: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select(`*, venue:venues(id, name, slug, city, state, venue_type, cover_photo_url, current_crowd_level, is_eighteen_plus, is_twenty_one_plus)`)
    .eq('is_cancelled', false)
    .gte('date', today)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('date', { ascending: true })
    .limit(30)

  if (error) {
    console.error('[Events] Error searching events:', error)
    return []
  }

  return data || []
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue) return { error: 'No venue found' }

  const { error } = await supabase
    .from('events')
    .update({ is_cancelled: true })
    .eq('id', eventId)
    .eq('venue_id', venue.id)

  if (error) return { error: 'Failed to cancel event' }

  revalidatePath('/venue-portal/events')
  return { success: true }
}
