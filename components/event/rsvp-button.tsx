'use client'

import { useState, useTransition } from 'react'
import { createRSVP } from '@/lib/actions/ticket'
import { getStoredReferralCode, clearStoredReferral } from '@/components/referral/referral-tracker'
import { cn } from '@/lib/utils/cn'
import { Loader2, Check, AlertCircle } from 'lucide-react'

interface RSVPButtonProps {
  eventId: string
  referralCode?: string
  className?: string
}

export function RSVPButton({ eventId, referralCode, className }: RSVPButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handleRSVP() {
    startTransition(async () => {
      const refCode = referralCode || getStoredReferralCode() || undefined
      const result = await createRSVP(eventId, refCode)

      if (result.error) {
        setStatus('error')
        setErrorMessage(result.error)
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('success')
        clearStoredReferral()
      }
    })
  }

  if (status === 'success') {
    return (
      <button
        disabled
        className={cn(
          'w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2',
          'bg-green-500/20 text-green-400 border border-green-500/30',
          className
        )}
      >
        <Check className="h-5 w-5" />
        You&apos;re in!
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={handleRSVP}
        className={cn(
          'w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2',
          'bg-destructive/20 text-destructive border border-destructive/30',
          className
        )}
      >
        <AlertCircle className="h-5 w-5" />
        {errorMessage}
      </button>
    )
  }

  return (
    <button
      onClick={handleRSVP}
      disabled={isPending}
      className={cn(
        'w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide btn-neon neon-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Reserving your spot...
        </>
      ) : (
        'RSVP - Free Entry'
      )}
    </button>
  )
}
