'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { savePushSubscription } from '@/lib/actions/push'

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    // Check if notifications are supported and not already granted/denied
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return
    }

    if (Notification.permission !== 'default') {
      return
    }

    // Check if user dismissed prompt before
    const dismissed = localStorage.getItem('ews-notifications-dismissed')
    if (dismissed) {
      return
    }

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  async function handleEnable() {
    setIsSubscribing(true)

    try {
      // Request permission
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setShowPrompt(false)
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Get push subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.error('[Notifications] VAPID public key not configured')
        setShowPrompt(false)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })

      const subscriptionJson = subscription.toJSON()

      // Save to server
      await savePushSubscription({
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
        userAgent: navigator.userAgent,
      })

      setShowPrompt(false)
    } catch (error) {
      console.error('[Notifications] Error enabling:', error)
    } finally {
      setIsSubscribing(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem('ews-notifications-dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card p-4 flex items-center gap-4 max-w-lg mx-auto border-primary/20">
        <div className="shrink-0 bg-primary/10 p-2.5 rounded-full">
          <Bell className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Get notified about new events</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            From your favorite venues
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={isSubscribing}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubscribing ? 'Enabling...' : 'Enable'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
