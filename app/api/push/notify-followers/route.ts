import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBulkPushNotifications } from '@/lib/push/web-push'

// Create Supabase client lazily to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface NotifyFollowersRequest {
  venueId: string
  eventId: string
  eventName: string
  venueName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NotifyFollowersRequest = await request.json()
    const { venueId, eventId, eventName, venueName } = body

    if (!venueId || !eventId || !eventName || !venueName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Get all users who have favorited this venue
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorite_venues')
      .select('user_id')
      .eq('venue_id', venueId)

    if (favoritesError) {
      console.error('[Push API] Error fetching favorites:', favoritesError)
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No followers to notify' })
    }

    const userIds = favorites.map((f) => f.user_id)

    // Get push subscriptions for these users
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('user_id', userIds)

    if (subscriptionsError) {
      console.error('[Push API] Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No push subscriptions found' })
    }

    // Send push notifications
    const payload = {
      title: `${venueName} just posted an event!`,
      body: eventName,
      url: `/event/${eventId}`,
      eventId,
      venueId,
    }

    const result = await sendBulkPushNotifications(subscriptions, payload)

    // Clean up expired subscriptions
    if (result.expired.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', result.expired)
    }

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      expired: result.expired.length,
    })
  } catch (error) {
    console.error('[Push API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
