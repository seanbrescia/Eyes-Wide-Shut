'use client'

import { AlertCircle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full mb-4"
        style={{ backgroundColor: 'rgba(225, 29, 72, 0.1)' }}
      >
        <AlertCircle className="h-8 w-8" style={{ color: '#e11d48' }} />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-white/50 mb-6 max-w-md text-center">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all"
        style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
      >
        Try Again
      </button>
    </div>
  )
}
