'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0a14] to-black" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
            }}
          />
        </div>

        <div className="w-full max-w-sm relative z-10 text-center">
          {/* Success animation */}
          <div className="mb-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto relative"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 0 30px rgba(34, 197, 94, 0.1), inset 0 0 30px rgba(34, 197, 94, 0.05)',
                }}
              >
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-light tracking-wide text-white mb-3">Check Your Inbox</h2>
          <p className="text-sm text-white/40 mb-6 leading-relaxed">
            We sent a password reset link to
          </p>
          <div className="inline-block px-5 py-2.5 rounded-full border border-white/10 bg-white/5 mb-8">
            <p className="text-sm text-white/80 font-medium">{email}</p>
          </div>
          <p className="text-xs text-white/30 mb-10 leading-relaxed max-w-xs mx-auto">
            Click the link in the email to create a new password. If you don&apos;t see it, check your spam folder.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setSent(false)}
              className="w-full py-3.5 px-8 text-center text-sm tracking-[0.1em] uppercase border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="block text-sm text-white/40 hover:text-white transition-colors mt-4"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative overflow-hidden">
      {/* Atmospheric background - matches landing page style */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0a14] to-black" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 30% 40%, rgba(120, 50, 180, 0.25) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {/* Icon */}
        <div className="mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center relative"
            style={{
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.1), inset 0 0 40px rgba(168, 85, 247, 0.05)',
              background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
            }}
          >
            <Lock className="w-6 h-6 text-purple-400/80" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-light tracking-wide text-white mb-2">
          Forgot password?
        </h1>
        <p className="text-sm text-white/35 mb-10 leading-relaxed max-w-xs">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs text-white/40 uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border-b border-white/15 pb-3 text-white text-sm placeholder:text-white/20 focus:border-purple-500/50 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-8 text-center text-sm tracking-[0.15em] uppercase border border-white/40 rounded-full hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Steps indicator */}
        <div className="mt-12 flex items-center gap-3 text-[11px] text-white/20">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-purple-500/40 flex items-center justify-center bg-purple-500/10">
              <span className="text-purple-400 text-[10px]">1</span>
            </div>
            <span>Enter email</span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center">
              <span className="text-[10px]">2</span>
            </div>
            <span>Check inbox</span>
          </div>
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center">
              <span className="text-[10px]">3</span>
            </div>
            <span>New password</span>
          </div>
        </div>
      </div>
    </div>
  )
}
