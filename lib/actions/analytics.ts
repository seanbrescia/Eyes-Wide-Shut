'use server'

import { createClient } from '@/lib/supabase/server'
import type { VenueAnalytics, CrowdPatternData, TrendingData } from '@/types/database'

// ============================================
// VIEW TRACKING
// ============================================

export async function trackVenueView(venueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('venue_views')
    .insert({ venue_id: venueId, user_id: user?.id || null })
}

export async function trackEventView(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .from('event_views')
    .insert({ event_id: eventId, user_id: user?.id || null })
}

// ============================================
// VENUE ANALYTICS
// ============================================

export async function getVenueAnalytics(venueId: string, days: number = 30): Promise<VenueAnalytics | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .rpc('get_venue_analytics', { p_venue_id: venueId, p_days: days })

  if (error || !data || data.length === 0) {
    // Return zeros if no data
    return {
      total_views: 0,
      total_rsvps: 0,
      total_check_ins: 0,
      conversion_rate: 0,
      avg_crowd_level: 0,
    }
  }

  return data[0] as VenueAnalytics
}

export async function getVenueViewsOverTime(venueId: string, days: number = 30) {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('venue_views')
    .select('viewed_at')
    .eq('venue_id', venueId)
    .gte('viewed_at', startDate.toISOString())
    .order('viewed_at', { ascending: true })

  if (error) return []

  // Group by date
  const grouped: Record<string, number> = {}
  for (const view of data || []) {
    const date = new Date(view.viewed_at).toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

export async function getVenueRSVPsOverTime(venueId: string, days: number = 30) {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('tickets')
    .select('created_at, event:events!inner(venue_id)')
    .eq('event.venue_id', venueId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) return []

  // Group by date
  const grouped: Record<string, number> = {}
  for (const ticket of data || []) {
    const date = new Date(ticket.created_at).toISOString().split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  }

  return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

export async function getCrowdPatterns(venueId: string, days: number = 90): Promise<CrowdPatternData[]> {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('crowd_meter_history')
    .select('level, recorded_at')
    .eq('venue_id', venueId)
    .gte('recorded_at', startDate.toISOString())

  if (error || !data) return []

  // Group by hour and day of week
  const patterns: Record<string, { total: number; count: number }> = {}

  for (const entry of data) {
    const date = new Date(entry.recorded_at)
    const hour = date.getHours()
    const dayOfWeek = date.getDay()
    const key = `${dayOfWeek}-${hour}`

    if (!patterns[key]) {
      patterns[key] = { total: 0, count: 0 }
    }
    patterns[key].total += entry.level
    patterns[key].count++
  }

  return Object.entries(patterns).map(([key, value]) => {
    const [dayOfWeek, hour] = key.split('-').map(Number)
    return {
      hour,
      day_of_week: dayOfWeek,
      avg_level: Math.round((value.total / value.count) * 10) / 10,
      count: value.count,
    }
  })
}

export async function getEventConversionFunnel(eventId: string) {
  const supabase = await createClient()

  const [views, rsvps, checkIns] = await Promise.all([
    supabase.from('event_views').select('id', { count: 'exact' }).eq('event_id', eventId),
    supabase.from('tickets').select('id', { count: 'exact' }).eq('event_id', eventId).eq('status', 'confirmed'),
    supabase.from('tickets').select('id', { count: 'exact' }).eq('event_id', eventId).eq('checked_in', true),
  ])

  return {
    views: views.count || 0,
    rsvps: rsvps.count || 0,
    check_ins: checkIns.count || 0,
    view_to_rsvp: views.count ? Math.round(((rsvps.count || 0) / views.count) * 100) : 0,
    rsvp_to_checkin: rsvps.count ? Math.round(((checkIns.count || 0) / (rsvps.count || 1)) * 100) : 0,
  }
}

// ============================================
// CITY-WIDE TRENDS
// ============================================

export async function getCityTrends(city: string, state: string, days: number = 30) {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get venues in city
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, venue_type, current_crowd_level')
    .eq('city', city)
    .eq('state', state)
    .eq('status', 'approved')

  if (!venues) return null

  const venueIds = venues.map(v => v.id)

  // Get aggregated stats
  const [events, tickets, views] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, date, tickets_sold, artists')
      .in('venue_id', venueIds)
      .gte('date', startDate.toISOString().split('T')[0])
      .eq('is_cancelled', false),
    supabase
      .from('tickets')
      .select('id, event:events!inner(venue_id)')
      .in('event.venue_id', venueIds)
      .gte('created_at', startDate.toISOString()),
    supabase
      .from('venue_views')
      .select('id')
      .in('venue_id', venueIds)
      .gte('viewed_at', startDate.toISOString()),
  ])

  // Trending venue types
  const typeStats: Record<string, { count: number; totalCrowd: number }> = {}
  for (const venue of venues) {
    const type = venue.venue_type || 'Other'
    if (!typeStats[type]) typeStats[type] = { count: 0, totalCrowd: 0 }
    typeStats[type].count++
    typeStats[type].totalCrowd += venue.current_crowd_level
  }

  const trendingTypes: TrendingData[] = Object.entries(typeStats)
    .map(([type, stats]) => ({
      venue_type: type,
      count: stats.count,
      avg_crowd: Math.round((stats.totalCrowd / stats.count) * 10) / 10,
    }))
    .sort((a, b) => b.avg_crowd - a.avg_crowd)

  // Hot venues (highest crowd levels)
  const hotVenues = [...venues]
    .sort((a, b) => b.current_crowd_level - a.current_crowd_level)
    .slice(0, 5)

  // Popular events
  const popularEvents = (events.data || [])
    .sort((a, b) => b.tickets_sold - a.tickets_sold)
    .slice(0, 5)

  return {
    total_venues: venues.length,
    total_events: events.data?.length || 0,
    total_tickets: tickets.data?.length || 0,
    total_views: views.data?.length || 0,
    trending_types: trendingTypes,
    hot_venues: hotVenues,
    popular_events: popularEvents,
  }
}

export async function getHottestNeighborhoods(city: string, state: string) {
  const supabase = await createClient()

  // Group venues by zip code and calculate average crowd
  const { data: venues } = await supabase
    .from('venues')
    .select('zip_code, current_crowd_level')
    .eq('city', city)
    .eq('state', state)
    .eq('status', 'approved')

  if (!venues) return []

  const neighborhoods: Record<string, { total: number; count: number }> = {}
  for (const venue of venues) {
    const zip = venue.zip_code
    if (!neighborhoods[zip]) neighborhoods[zip] = { total: 0, count: 0 }
    neighborhoods[zip].total += venue.current_crowd_level
    neighborhoods[zip].count++
  }

  return Object.entries(neighborhoods)
    .map(([zip, stats]) => ({
      zip_code: zip,
      venue_count: stats.count,
      avg_crowd: Math.round((stats.total / stats.count) * 10) / 10,
    }))
    .sort((a, b) => b.avg_crowd - a.avg_crowd)
}

export async function getBusiestNights(venueId: string, weeks: number = 8) {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - weeks * 7)

  const { data } = await supabase
    .from('crowd_meter_history')
    .select('level, recorded_at')
    .eq('venue_id', venueId)
    .gte('recorded_at', startDate.toISOString())

  if (!data) return []

  // Group by day of week
  const dayStats: Record<number, { total: number; count: number }> = {}
  for (const entry of data) {
    const day = new Date(entry.recorded_at).getDay()
    if (!dayStats[day]) dayStats[day] = { total: 0, count: 0 }
    dayStats[day].total += entry.level
    dayStats[day].count++
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day: dayNames[Number(day)],
      day_num: Number(day),
      avg_crowd: Math.round((stats.total / stats.count) * 10) / 10,
      data_points: stats.count,
    }))
    .sort((a, b) => b.avg_crowd - a.avg_crowd)
}
