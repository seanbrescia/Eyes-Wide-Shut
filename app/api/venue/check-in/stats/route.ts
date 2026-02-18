import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ checkedIn: 0, total: 0 }, { status: 401 })
    }

    const venueId = req.nextUrl.searchParams.get('venueId')
    if (!venueId) {
      return NextResponse.json({ checkedIn: 0, total: 0 }, { status: 400 })
    }

    // Verify user owns the venue
    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('id', venueId)
      .eq('owner_id', user.id)
      .single()

    if (!venue) {
      return NextResponse.json({ checkedIn: 0, total: 0 }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get today's events for this venue
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('venue_id', venueId)
      .eq('date', today)

    if (!events || events.length === 0) {
      return NextResponse.json({ checkedIn: 0, total: 0 })
    }

    const eventIds = events.map((e) => e.id)

    // Get ticket counts
    const { count: total } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds)
      .eq('status', 'confirmed')

    const { count: checkedIn } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds)
      .eq('status', 'confirmed')
      .eq('checked_in', true)

    return NextResponse.json({
      checkedIn: checkedIn || 0,
      total: total || 0,
    })
  } catch (error) {
    console.error('[Check-in Stats] Error:', error)
    return NextResponse.json({ checkedIn: 0, total: 0 }, { status: 500 })
  }
}
