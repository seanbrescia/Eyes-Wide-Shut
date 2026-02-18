'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent } from '@/lib/actions/event'
import { cn } from '@/lib/utils/cn'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CalendarDays,
  Clock,
  Music,
  DollarSign,
  Wine,
  Ticket,
  FileText,
} from 'lucide-react'

export default function CreateEventPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createEvent(formData)

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/venue-portal/events')
      }
    })
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/venue-portal/events"
          className="glass-card p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Event</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details for your new event
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Event Details
          </h2>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-1.5"
            >
              Event Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Friday Night Vibes"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
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
              placeholder="Tell people what to expect..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Date & Time
          </h2>

          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium mb-1.5"
            >
              Date <span className="text-destructive">*</span>
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary [color-scheme:dark]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_time"
                className="block text-sm font-medium mb-1.5"
              >
                Start Time <span className="text-destructive">*</span>
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                required
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary [color-scheme:dark]"
              />
            </div>
            <div>
              <label
                htmlFor="end_time"
                className="block text-sm font-medium mb-1.5"
              >
                End Time
              </label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Artists */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <Music className="h-3.5 w-3.5 text-primary" />
            Artists / DJs
          </h2>

          <div>
            <label
              htmlFor="artists"
              className="block text-sm font-medium mb-1.5"
            >
              Artists
            </label>
            <input
              id="artists"
              name="artists"
              type="text"
              placeholder="DJ Shadow, Kid Cudi, Disclosure (comma-separated)"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Separate multiple artists with commas
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Pricing
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cover_charge"
                className="block text-sm font-medium mb-1.5"
              >
                Cover Charge ($)
              </label>
              <input
                id="cover_charge"
                name="cover_charge"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="0"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="ticket_price"
                className="block text-sm font-medium mb-1.5"
              >
                Ticket Price ($)
              </label>
              <input
                id="ticket_price"
                name="ticket_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Leave blank for free"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="ticket_count"
              className="block text-sm font-medium mb-1.5 flex items-center gap-2"
            >
              <Ticket className="h-3.5 w-3.5 text-neon-cyan" />
              Ticket Limit
            </label>
            <input
              id="ticket_count"
              name="ticket_count"
              type="number"
              min="1"
              placeholder="Leave blank for unlimited"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Maximum number of tickets/RSVPs available
            </p>
          </div>
        </div>

        {/* Drink specials */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
            <Wine className="h-3.5 w-3.5 text-neon-cyan" />
            Drink Specials
          </h2>

          <div>
            <label
              htmlFor="drink_specials"
              className="block text-sm font-medium mb-1.5"
            >
              Specials
            </label>
            <input
              id="drink_specials"
              name="drink_specials"
              type="text"
              placeholder="$5 Margaritas, 2-for-1 Beers, $8 Espresso Martini (comma-separated)"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Separate multiple specials with commas
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-destructive/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link
            href="/venue-portal/events"
            className="glass-card px-6 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'flex-1 py-3 px-6 rounded-xl font-semibold text-sm tracking-wide btn-neon neon-glow flex items-center justify-center gap-2',
              isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
