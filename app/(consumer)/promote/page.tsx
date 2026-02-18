'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  submitPromoterApplication,
  getMyPromoterApplication,
  getPromoterTierConfig,
} from '@/lib/actions/promoter'
import type { PromoterApplication, PromoterTierConfig, AudienceSize } from '@/types/database'
import { AUDIENCE_SIZE_LABELS } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import {
  ArrowLeft,
  Megaphone,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Users,
  DollarSign,
  TrendingUp,
  Share2,
} from 'lucide-react'

type PageState = 'loading' | 'form' | 'pending' | 'approved' | 'rejected'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

export default function PromotePage() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [application, setApplication] = useState<PromoterApplication | null>(null)
  const [tiers, setTiers] = useState<PromoterTierConfig[]>([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [app, tierConfig] = await Promise.all([
        getMyPromoterApplication(),
        getPromoterTierConfig(),
      ])
      setTiers(tierConfig)

      if (!app) {
        setPageState('form')
        return
      }
      setApplication(app)
      setPageState(app.status)
    }
    load()
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await submitPromoterApplication(formData)
      if (result.error) {
        setStatus('error')
        setErrorMessage(result.error)
      } else {
        setStatus('success')
        setPageState('pending')
      }
    })
  }

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a855f7' }} />
      </div>
    )
  }

  // Approved - Promoter Dashboard
  if (pageState === 'approved') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/profile" className="glass-card p-2 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Promoter Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                You&apos;re an approved promoter
              </p>
            </div>
          </div>

          {/* Status banner */}
          <div className="glass-card p-5 mb-6 neon-glow animate-fade-in" style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-400">Approved Promoter</p>
                <p className="text-sm text-muted-foreground">
                  Share referral links to earn cash commissions
                </p>
              </div>
            </div>
          </div>

          {/* Commission Tiers */}
          <div className="glass-card p-5 mb-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Commission Tiers
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {tiers.map((tier) => (
                <div key={tier.tier} className="glass-card p-4 text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold capitalize">
                    {tier.tier}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>
                    {tier.commission_rate}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {tier.min_points.toLocaleString()}+ pts
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <Link href="/referrals">
              <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Share2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">View Referrals & Links</p>
                  <p className="text-[11px] text-muted-foreground">
                    Share your code and track earnings
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Pending
  if (pageState === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md w-full animate-fade-in neon-glow">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Thanks for applying to become a promoter! We&apos;ll review your
            application and get back to you soon.
          </p>
          <Link
            href="/profile"
            className="btn-neon px-6 py-2.5 rounded-xl text-sm inline-block"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  // Form (new applicant or rejected re-applying)
  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profile" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Become a Promoter</h1>
            <p className="text-sm text-muted-foreground">
              Unlock cash commissions on referrals
            </p>
          </div>
        </div>

        {/* Rejection notice */}
        {pageState === 'rejected' && application && (
          <div className="glass-card p-4 mb-6 flex items-start gap-3" style={{ borderColor: 'rgba(225, 29, 72, 0.3)' }}>
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Previous Application Rejected
              </p>
              {application.rejection_reason && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {application.rejection_reason}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                You can update your info and re-apply below.
              </p>
            </div>
          </div>
        )}

        {/* Tier preview */}
        <div className="glass-card p-5 mb-6">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 mb-4">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Commission Tiers
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <div key={tier.tier} className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold capitalize">
                  {tier.tier}
                </p>
                <p className="text-lg font-bold" style={{ color: '#a855f7' }}>
                  {tier.commission_rate}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {tier.min_points.toLocaleString()}+ pts
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-primary" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  defaultValue={application?.full_name ?? ''}
                  placeholder="Your full name"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={application?.email ?? ''}
                  placeholder="you@email.com"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                Phone <span className="text-destructive">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={application?.phone ?? ''}
                placeholder="(555) 555-5555"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1.5">
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  defaultValue={application?.city ?? ''}
                  placeholder="City"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1.5">
                  State <span className="text-destructive">*</span>
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  defaultValue={application?.state ?? 'NJ'}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Select</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Social Media
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagram_handle" className="block text-sm font-medium mb-1.5">
                  Instagram
                </label>
                <input
                  id="instagram_handle"
                  name="instagram_handle"
                  type="text"
                  defaultValue={application?.instagram_handle ?? ''}
                  placeholder="@yourhandle"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="tiktok_handle" className="block text-sm font-medium mb-1.5">
                  TikTok
                </label>
                <input
                  id="tiktok_handle"
                  name="tiktok_handle"
                  type="text"
                  defaultValue={application?.tiktok_handle ?? ''}
                  placeholder="@yourhandle"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5 text-primary" />
              Experience
            </h2>

            <div>
              <label htmlFor="audience_size" className="block text-sm font-medium mb-1.5">
                Total Audience Size <span className="text-destructive">*</span>
              </label>
              <select
                id="audience_size"
                name="audience_size"
                required
                defaultValue={application?.audience_size ?? ''}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Select audience size</option>
                {(Object.entries(AUDIENCE_SIZE_LABELS) as [AudienceSize, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium mb-1.5">
                Promotion Experience
              </label>
              <textarea
                id="experience"
                name="experience"
                rows={3}
                defaultValue={application?.experience ?? ''}
                placeholder="Tell us about any previous promotion or marketing experience..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>

            <div>
              <label htmlFor="why_join" className="block text-sm font-medium mb-1.5">
                Why do you want to become a promoter? <span className="text-destructive">*</span>
              </label>
              <textarea
                id="why_join"
                name="why_join"
                rows={3}
                required
                defaultValue={application?.why_join ?? ''}
                placeholder="Tell us why you'd be a great promoter..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="glass-card p-4 border-destructive/30 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide btn-neon neon-glow flex items-center justify-center gap-2',
              isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : pageState === 'rejected' ? (
              'Re-Submit Application'
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
