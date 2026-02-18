'use server'

import { createClient } from '@/lib/supabase/server'

export interface PushSubscriptionInput {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string
}

export async function savePushSubscription(subscription: PushSubscriptionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        user_agent: subscription.userAgent || null,
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('[Push] Error saving subscription:', error)
    return { error: 'Failed to save subscription' }
  }

  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[Push] Error removing subscription:', error)
    return { error: 'Failed to remove subscription' }
  }

  return { success: true }
}
