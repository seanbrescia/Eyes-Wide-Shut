'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const REFERRAL_STORAGE_KEY = 'ews_referral_code'

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFERRAL_STORAGE_KEY)
}

export function clearStoredReferral(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFERRAL_STORAGE_KEY)
}

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref.toUpperCase())
    }
  }, [searchParams])

  return null
}
