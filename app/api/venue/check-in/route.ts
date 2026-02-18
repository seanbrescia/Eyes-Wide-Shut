import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const { code, venueId } = await req.json()

    if (!code || !venueId) {
      return NextResponse.json({ success: false, message: 'Missing code or venue ID' }, { status: 400 })
    }

    // Verify user owns the venue
    const { data: venue } = await supabase
      .from('venues')
      .select('id, owner_id')
      .eq('id', venueId)
      .eq('owner_id', user.id)
      .single()

    if (!venue) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    // Find the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        confirmation_code,
        quantity,
        checked_in,
        checked_in_at,
        status,
        user:users(full_name, email),
        event:events(
          id,
          name,
          date,
          venue_id
        )
      `)
      .eq('confirmation_code', code.toUpperCase())
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({
        success: false,
        message: 'Ticket not found. Check the code and try again.',
      })
    }

    const eventData = ticket.event as unknown as { id: string; name: string; date: string; venue_id: string } | null

    // Verify ticket is for this venue
    if (eventData?.venue_id !== venueId) {
      return NextResponse.json({
        success: false,
        message: 'This ticket is for a different venue.',
      })
    }

    // Check if already checked in
    if (ticket.checked_in) {
      return NextResponse.json({
        success: false,
        message: `Already checked in at ${new Date(ticket.checked_in_at!).toLocaleTimeString()}`,
        ticket,
      })
    }

    // Check ticket status
    if (ticket.status !== 'confirmed') {
      return NextResponse.json({
        success: false,
        message: `Ticket is ${ticket.status}. Cannot check in.`,
        ticket,
      })
    }

    // Check event date (allow check-in on event day only)
    const today = new Date().toISOString().split('T')[0]
    if (eventData?.date !== today) {
      return NextResponse.json({
        success: false,
        message: `This ticket is for ${eventData?.date}, not today.`,
        ticket,
      })
    }

    // Update ticket as checked in
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to check in. Please try again.',
      })
    }

    return NextResponse.json({
      success: true,
      message: `Welcome! ${ticket.quantity} ticket${ticket.quantity > 1 ? 's' : ''} checked in.`,
      ticket: {
        ...ticket,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Check-in] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
