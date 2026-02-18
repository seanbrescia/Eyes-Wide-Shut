import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get event and verify ownership
    const { data: event, error } = await supabase
      .from('events')
      .select('*, venue:venues!inner(owner_id)')
      .eq('id', id)
      .single()

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const venueData = event.venue as unknown as { owner_id: string }
    if (venueData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Return event without venue data
    const { venue, ...eventData } = event
    return NextResponse.json(eventData)
  } catch (error) {
    console.error('[Event API] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get event and verify ownership
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*, venue:venues!inner(owner_id)')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const venueData = event.venue as unknown as { owner_id: string }
    if (venueData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await req.json()

    const updates = {
      name: body.name,
      description: body.description,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      artists: body.artists || [],
      cover_charge: body.cover_charge || 0,
      ticket_price: body.ticket_price,
      ticket_count: body.ticket_count,
      drink_specials: body.drink_specials || [],
    }

    const { error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      console.error('[Event API] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Event API] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
