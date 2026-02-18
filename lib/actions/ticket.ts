'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { recordRSVPReferral } from './referral'
import { sendRSVPConfirmationEmail } from '@/lib/email/transactional'

export async function createRSVP(eventId: string, referralCode?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already RSVP'd
  const { data: existing } = await supabase
    .from('tickets')
    .select('id')
    .eq('user_id', user.id)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .single()

  if (existing) return { error: 'Already RSVP\'d to this event' }

  // Check event exists and isn't sold out
  const { data: event } = await supabase
    .from('events')
    .select('id, name, date, ticket_count, tickets_sold, venue:venues(name)')
    .eq('id', eventId)
    .single()

  if (!event) return { error: 'Event not found' }
  if (event.ticket_count !== null && event.tickets_sold >= event.ticket_count) {
    return { error: 'Event is sold out' }
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      event_id: eventId,
      quantity: 1,
      is_paid: false,
      amount_paid: 0,
      status: 'confirmed',
      confirmation_code: '', // trigger will generate this
    })
    .select()
    .single()

  if (error) {
    console.error('[Tickets] Error creating RSVP:', error)
    return { error: 'Failed to RSVP' }
  }

  // Record referral if a code was provided
  if (referralCode && ticket) {
    await recordRSVPReferral(referralCode, eventId, ticket.id)
  }

  // Send RSVP confirmation email
  const venueData = event.venue as unknown as { name: string } | null
  sendRSVPConfirmationEmail(
    user.email!,
    user.user_metadata?.full_name || '',
    event.name,
    venueData?.name || 'Venue',
    event.date
  )

  revalidatePath('/tickets')
  return { success: true, ticket }
}

export async function getUserTickets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(
        id, name, date, start_time, end_time, artists, cover_charge,
        venue:venues(id, name, city, state, address_line1, cover_photo_url)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Tickets] Error fetching tickets:', error)
    return []
  }

  return data || []
}

export async function cancelTicket(ticketId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticketId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to cancel ticket' }

  revalidatePath('/tickets')
  return { success: true }
}
