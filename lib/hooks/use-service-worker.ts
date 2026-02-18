'use client'

import { useEffect, useState } from 'react'

const swSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSupported] = useState(swSupported)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        setRegistration(reg)
      })
      .catch((err) => {
        console.error('[ServiceWorker] Registration failed:', err)
        setError(err.message)
      })
  }, [])

  return { registration, isSupported, error }
}

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { registration, isSupported } = useServiceWorker()

  useEffect(() => {
    if (!registration) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoading(false))
      return
    }

    registration.pushManager
      .getSubscription()
      .then((sub) => {
        setSubscription(sub)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [registration])

  async function subscribe(): Promise<PushSubscription | null> {
    if (!registration || !isSupported) return null

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.error('[Push] VAPID public key not configured')
      return null
    }

    try {
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })
      setSubscription(sub)
      return sub
    } catch (error) {
      console.error('[Push] Subscribe failed:', error)
      return null
    }
  }

  async function unsubscribe(): Promise<boolean> {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      setSubscription(null)
      return true
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error)
      return false
    }
  }

  return {
    subscription,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
  }
}

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
