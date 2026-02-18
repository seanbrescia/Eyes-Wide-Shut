import webPush from 'web-push'

// Configure web-push with VAPID keys
webPush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:contact@eyeswideshut.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
  eventId?: string
  venueId?: string
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }

    // 410 Gone or 404 Not Found means subscription is no longer valid
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, error: 'subscription_expired' }
    }

    console.error('[Push] Error sending notification:', err.message)
    return { success: false, error: err.message }
  }
}

export async function sendBulkPushNotifications(
  subscriptions: PushSubscriptionData[],
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  )

  let sent = 0
  let failed = 0
  const expired: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.success) {
        sent++
      } else {
        failed++
        if (result.value.error === 'subscription_expired') {
          expired.push(subscriptions[index].endpoint)
        }
      }
    } else {
      failed++
    }
  })

  return { sent, failed, expired }
}
