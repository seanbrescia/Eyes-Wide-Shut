'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { submitVenueApplication } from '@/lib/actions/venue'
import { VENUE_TYPES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import {
  ArrowLeft,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function VenueApplicationPage() {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await submitVenueApplication(formData)

      if (result.error) {
        setStatus('error')
        setErrorMessage(result.error)
      } else {
        setStatus('success')
      }
    })
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="glass-card p-10 text-center max-w-md w-full animate-fade-in neon-glow">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ll review it shortly. You&apos;ll receive an email once
            your venue is approved.
          </p>
          <Link
            href="/"
            className="btn-neon px-6 py-2.5 rounded-xl text-sm inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">List Your Venue</h1>
            <p className="text-sm text-muted-foreground">
              Apply to join Eyes Wide Shut
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Venue info */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Venue Information
            </h2>

            <div>
              <label
                htmlFor="venue_name"
                className="block text-sm font-medium mb-1.5"
              >
                Venue Name <span className="text-destructive">*</span>
              </label>
              <input
                id="venue_name"
                name="venue_name"
                type="text"
                required
                placeholder="e.g. The Blue Lounge"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="venue_type"
                className="block text-sm font-medium mb-1.5"
              >
                Venue Type
              </label>
              <select
                id="venue_type"
                name="venue_type"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Select a type...</option>
                {VENUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1.5"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Tell us about your venue..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Contact info */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contact_name"
                  className="block text-sm font-medium mb-1.5"
                >
                  Contact Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="contact_name"
                  name="contact_name"
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="contact_email"
                  className="block text-sm font-medium mb-1.5"
                >
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  required
                  placeholder="you@venue.com"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact_phone"
                className="block text-sm font-medium mb-1.5"
              >
                Phone
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                placeholder="(555) 555-5555"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Address */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Address
            </h2>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium mb-1.5"
              >
                Street Address <span className="text-destructive">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                placeholder="123 Main St"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="city"
                  className="block text-sm font-medium mb-1.5"
                >
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="City"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium mb-1.5"
                >
                  State <span className="text-destructive">*</span>
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  defaultValue="NJ"
                  maxLength={2}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary uppercase"
                />
              </div>

              <div>
                <label
                  htmlFor="zip_code"
                  className="block text-sm font-medium mb-1.5"
                >
                  ZIP <span className="text-destructive">*</span>
                </label>
                <input
                  id="zip_code"
                  name="zip_code"
                  type="text"
                  required
                  placeholder="07430"
                  maxLength={10}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Online Presence
            </h2>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium mb-1.5"
              >
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                placeholder="https://yourvenue.com"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="instagram"
                className="block text-sm font-medium mb-1.5"
              >
                Instagram
              </label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                placeholder="@yourvenue"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
