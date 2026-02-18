'use client'

import { AlertCircle } from 'lucide-react'

export default function ConsumerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="glass-card p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="btn-neon px-6 py-2.5 rounded-xl text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
