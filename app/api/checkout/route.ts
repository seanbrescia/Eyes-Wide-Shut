import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { eventId, quantity = 1, referralCode } = await req.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*, venue:venues(id, name, owner_id)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.is_cancelled) {
      return NextResponse.json({ error: 'Event is cancelled' }, { status: 400 })
    }

    // Check ticket availability
    if (event.ticket_count !== null) {
      const available = event.ticket_count - event.tickets_sold
      if (quantity > available) {
        return NextResponse.json({ error: 'Not enough tickets available' }, { status: 400 })
      }
    }

    const ticketPrice = event.ticket_price || 0
    if (ticketPrice <= 0) {
      return NextResponse.json({ error: 'This is a free event, use RSVP instead' }, { status: 400 })
    }

    const unitAmount = Math.round(ticketPrice * 100) // Convert to cents
    const totalAmount = unitAmount * quantity

    // Calculate platform fee (10%)
    const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100))

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: event.name,
              description: `${event.venue?.name} - ${new Date(event.date).toLocaleDateString()}`,
            },
            unit_amount: unitAmount,
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/event/${eventId}`,
      metadata: {
        eventId,
        userId: user.id,
        quantity: quantity.toString(),
        referralCode: referralCode || '',
        platformFee: platformFee.toString(),
      },
      payment_intent_data: {
        metadata: {
          eventId,
          userId: user.id,
          quantity: quantity.toString(),
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('[Checkout] Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
