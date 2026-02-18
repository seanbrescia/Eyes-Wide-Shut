import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { reservationId } = body

    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservation ID' }, { status: 400 })
    }

    // Get reservation details
    const { data: reservation, error: fetchError } = await supabase
      .from('vip_reservations')
      .select(`
        *,
        venue:venues(id, name, stripe_customer_id),
        package:vip_packages(name)
      `)
      .eq('id', reservationId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (reservation.deposit_paid) {
      return NextResponse.json({ error: 'Deposit already paid' }, { status: 400 })
    }

    const venue = reservation.venue as { id: string; name: string; stripe_customer_id: string | null }
    const pkg = reservation.package as { name: string } | null

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `VIP Reservation - ${pkg?.name || 'Table'}`,
              description: `${venue.name} - ${new Date(reservation.date).toLocaleDateString()} - Party of ${reservation.party_size}`,
            },
            unit_amount: Math.round(reservation.deposit_amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/vip/${reservation.id}?success=true`,
      cancel_url: `${req.headers.get('origin')}/vip/${reservation.id}?cancelled=true`,
      customer_email: user.email || undefined,
      metadata: {
        type: 'vip_reservation',
        reservation_id: reservation.id,
        venue_id: venue.id,
        user_id: user.id,
      },
    })

    // Update reservation with checkout session ID
    await supabase
      .from('vip_reservations')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', reservationId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[VIP Checkout] Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
