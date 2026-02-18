'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Event {
  id: string
  name: string
  description: string | null
  date: string
  start_time: string
  end_time: string | null
  artists: string[]
  cover_charge: number
  ticket_price: number | null
  ticket_count: number | null
  drink_specials: string[]
  is_featured: boolean
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function loadEvent() {
    const { id } = await params
    const res = await fetch(`/api/venue/events/${id}`)
    if (res.ok) {
      const data = await res.json()
      setEvent(data)
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { loadEvent() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!event) return

    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await fetch(`/api/venue/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description') || null,
          date: formData.get('date'),
          start_time: formData.get('start_time'),
          end_time: formData.get('end_time') || null,
          artists: (formData.get('artists') as string)?.split(',').map(a => a.trim()).filter(Boolean) || [],
          cover_charge: parseFloat(formData.get('cover_charge') as string) || 0,
          ticket_price: formData.get('ticket_price') ? parseFloat(formData.get('ticket_price') as string) : null,
          ticket_count: formData.get('ticket_count') ? parseInt(formData.get('ticket_count') as string) : null,
          drink_specials: (formData.get('drink_specials') as string)?.split(',').map(d => d.trim()).filter(Boolean) || [],
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/venue-portal/events'), 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update event')
      }
    })
  }

  async function handleCancel() {
    if (!event) return
    if (!confirm('Are you sure you want to cancel this event? This cannot be undone.')) return

    startTransition(async () => {
      const res = await fetch(`/api/venue/events/${event.id}/cancel`, {
        method: 'POST',
      })

      if (res.ok) {
        router.push('/venue-portal/events')
      } else {
        setError('Failed to cancel event')
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Link href="/venue-portal/events" className="text-primary text-sm mt-2 inline-block">
          Back to events
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/venue-portal/events" className="glass-card p-2 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Event</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      {success && (
        <div className="glass-card p-4 mb-6 border-green-500/30 bg-green-500/10 text-green-400 text-sm">
          Event updated successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="glass-card p-4 mb-6 border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Event Details
          </h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Event Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={event.name}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={event.description || ''}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1.5">
                Date <span className="text-destructive">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={event.date}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium mb-1.5">
                Start Time <span className="text-destructive">*</span>
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                required
                defaultValue={event.start_time}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium mb-1.5">
              End Time
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={event.end_time || ''}
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Pricing & Tickets
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cover_charge" className="block text-sm font-medium mb-1.5">
                Cover Charge ($)
              </label>
              <input
                id="cover_charge"
                name="cover_charge"
                type="number"
                step="0.01"
                min="0"
                defaultValue={event.cover_charge}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label htmlFor="ticket_price" className="block text-sm font-medium mb-1.5">
                Ticket Price ($)
              </label>
              <input
                id="ticket_price"
                name="ticket_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={event.ticket_price || ''}
                placeholder="Leave empty for free"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ticket_count" className="block text-sm font-medium mb-1.5">
              Total Tickets Available
            </label>
            <input
              id="ticket_count"
              name="ticket_count"
              type="number"
              min="1"
              defaultValue={event.ticket_count || ''}
              placeholder="Leave empty for unlimited"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Extras */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Additional Info
          </h2>

          <div>
            <label htmlFor="artists" className="block text-sm font-medium mb-1.5">
              Artists / DJs
            </label>
            <input
              id="artists"
              name="artists"
              type="text"
              defaultValue={event.artists?.join(', ') || ''}
              placeholder="DJ Snake, Marshmello"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Separate with commas</p>
          </div>

          <div>
            <label htmlFor="drink_specials" className="block text-sm font-medium mb-1.5">
              Drink Specials
            </label>
            <input
              id="drink_specials"
              name="drink_specials"
              type="text"
              defaultValue={event.drink_specials?.join(', ') || ''}
              placeholder="$5 Beers, 2-for-1 Shots"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Separate with commas</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-neon',
              isPending && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Cancel Event
          </button>
        </div>
      </form>
    </div>
  )
}
