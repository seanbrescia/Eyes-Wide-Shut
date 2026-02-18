'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { recordSignupReferral } from '@/lib/actions/referral'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types/database'

type Role = Extract<UserRole, 'consumer' | 'venue_owner'>

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [role, setRole] = useState<Role>('consumer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Age verification: must be at least 18
    const dob = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    if (age < 18) {
      setError('You must be at least 18 years old to sign up.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
          date_of_birth: dateOfBirth,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Check for stored referral code and record signup referral
    try {
      const storedCode = localStorage.getItem('ews_referral_code')
      if (storedCode) {
        await recordSignupReferral(storedCode)
        localStorage.removeItem('ews_referral_code')
      }
    } catch {
      // Non-critical: referral recording failure shouldn't block signup
    }

    if (role === 'venue_owner') {
      router.push('/venue-portal/apply')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 gradient-dark">
      {/* Background ambiance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-widest neon-text text-white">
            EYES WIDE SHUT
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('consumer')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200',
                    role === 'consumer'
                      ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-secondary/50'
                  )}
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium">Nightlife Fan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('venue_owner')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200',
                    role === 'venue_owner'
                      ? 'border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-secondary/50'
                  )}
                >
                  <Building2 className="w-6 h-6" />
                  <span className="text-sm font-medium">Venue Owner</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="text-muted-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
              <p className="text-xs text-muted-foreground">You must be 18 or older to sign up.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
