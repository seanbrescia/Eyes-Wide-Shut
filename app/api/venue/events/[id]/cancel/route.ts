import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { sendEventCancelledEmail } from '@/lib/email/transactional'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
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
      .select('*, venue:venues!inner(owner_id, name)')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const venueData = event.venue as unknown as { owner_id: string; name: string }
    if (venueData.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Cancel the event
    const { error: updateError } = await supabase
      .from('events')
      .update({ is_cancelled: true })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to cancel event' }, { status: 500 })
    }

    // Get all confirmed tickets for this event
    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('id, user_id, is_paid, amount_paid, stripe_payment_intent_id, status')
      .eq('event_id', id)
      .eq('status', 'confirmed')

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ success: true, refunds: 0 })
    }

    let refundCount = 0
    let refundErrors = 0

    for (const ticket of tickets) {
      // Process Stripe refund for paid tickets
      let amountRefunded = 0
      if (ticket.is_paid && ticket.stripe_payment_intent_id && ticket.amount_paid > 0) {
        try {
          await stripe.refunds.create({
            payment_intent: ticket.stripe_payment_intent_id,
          })
          amountRefunded = ticket.amount_paid
          refundCount++
        } catch (refundErr) {
          console.error(`[Event Cancel] Refund failed for ticket ${ticket.id}:`, refundErr)
          refundErrors++
        }
      }

      // Update ticket status
      await supabaseAdmin
        .from('tickets')
        .update({ status: ticket.is_paid ? 'refunded' : 'cancelled' })
        .eq('id', ticket.id)

      // Get user details and send cancellation email
      const { data: ticketUser } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('id', ticket.user_id)
        .single()

      if (ticketUser?.email) {
        sendEventCancelledEmail(
          ticketUser.email,
          ticketUser.full_name || '',
          event.name,
          venueData.name,
          event.date,
          ticket.is_paid,
          amountRefunded
        )
      }
    }

    return NextResponse.json({
      success: true,
      tickets_affected: tickets.length,
      refunds_processed: refundCount,
      refund_errors: refundErrors,
    })
  } catch (error) {
    console.error('[Event Cancel API] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
