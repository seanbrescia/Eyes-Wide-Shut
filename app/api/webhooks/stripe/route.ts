import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendTicketConfirmationEmail, sendVIPConfirmationEmail } from '@/lib/email/transactional'

// Use service role for webhook (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    // For local development without webhook signing
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      // Parse without verification for development
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('[Webhook] Error verifying:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata || {}

    // Handle VIP Reservation payments
    if (metadata.type === 'vip_reservation') {
      const { reservation_id } = metadata

      if (!reservation_id) {
        console.error('[Webhook] Missing VIP reservation ID')
        return NextResponse.json({ error: 'Missing reservation ID' }, { status: 400 })
      }

      // Update reservation as paid and confirmed
      const { error: updateError } = await supabaseAdmin
        .from('vip_reservations')
        .update({
          deposit_paid: true,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('id', reservation_id)

      if (updateError) {
        console.error('[Webhook] Error updating VIP reservation:', updateError)
        return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
      }

      // Send VIP confirmation email
      const { data: reservation } = await supabaseAdmin
        .from('vip_reservations')
        .select('user_id, guest_name, guest_email, date, party_size, deposit_amount, confirmation_code, package_id, venue:venues(name)')
        .eq('id', reservation_id)
        .single()

      if (reservation?.guest_email) {
        const vipVenue = reservation.venue as unknown as { name: string } | null
        let packageName = 'VIP Table'
        if (reservation.package_id) {
          const { data: pkg } = await supabaseAdmin
            .from('vip_packages')
            .select('name')
            .eq('id', reservation.package_id)
            .single()
          if (pkg) packageName = pkg.name
        }

        sendVIPConfirmationEmail(
          reservation.guest_email,
          reservation.guest_name || '',
          vipVenue?.name || 'Venue',
          packageName,
          reservation.date,
          reservation.party_size,
          reservation.deposit_amount,
          reservation.confirmation_code
        )
      }

      console.log('[Webhook] VIP reservation confirmed:', reservation_id)
      return NextResponse.json({ received: true })
    }

    // Handle regular ticket payments
    const { eventId, userId, quantity, referralCode } = metadata

    if (!eventId || !userId) {
      console.error('[Webhook] Missing metadata')
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const qty = parseInt(quantity || '1')

    // Create ticket record
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        user_id: userId,
        event_id: eventId,
        quantity: qty,
        is_paid: true,
        amount_paid: (session.amount_total || 0) / 100,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        status: 'confirmed',
        confirmation_code: generateConfirmationCode(),
        referred_by_code: referralCode || null,
      })
      .select()
      .single()

    if (ticketError) {
      console.error('[Webhook] Error creating ticket:', ticketError)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Update tickets_sold count
    await supabaseAdmin.rpc('increment_tickets_sold', {
      p_event_id: eventId,
      p_quantity: qty,
    })

    // Record referral if applicable
    if (referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single()

      if (referrer && referrer.id !== userId) {
        await supabaseAdmin.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: userId,
          action: 'rsvp',
          event_id: eventId,
          ticket_id: ticket.id,
          points_awarded: 25,
        })

        // Increment referral points
        const { data: referrerUser } = await supabaseAdmin
          .from('users')
          .select('referral_points')
          .eq('id', referrer.id)
          .single()

        if (referrerUser) {
          await supabaseAdmin
            .from('users')
            .update({ referral_points: (referrerUser.referral_points || 0) + 25 })
            .eq('id', referrer.id)
        }
      }
    }

    // Send ticket confirmation email
    const { data: ticketUser } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    const { data: eventDetails } = await supabaseAdmin
      .from('events')
      .select('name, date, venue:venues(name)')
      .eq('id', eventId)
      .single()

    if (ticketUser?.email && eventDetails) {
      const venueInfo = eventDetails.venue as unknown as { name: string } | null
      sendTicketConfirmationEmail(
        ticketUser.email,
        ticketUser.full_name || '',
        eventDetails.name,
        venueInfo?.name || 'Venue',
        eventDetails.date,
        ticket.confirmation_code,
        qty,
        (session.amount_total || 0) / 100
      )
    }

    console.log('[Webhook] Ticket created:', ticket.id)
  }

  return NextResponse.json({ received: true })
}
