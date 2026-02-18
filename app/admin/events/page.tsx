'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import {
  CalendarDays,
  Search,
  Star,
  StarOff,
  MapPin,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getAllEventsAdmin, toggleEventFeatured } from '@/lib/actions/event'
import { formatEventDate, formatTime } from '@/lib/utils/dates'

type FilterType = 'all' | 'featured' | 'upcoming' | 'past'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Awaited<ReturnType<typeof getAllEventsAdmin>>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [isPending, startTransition] = useTransition()

  async function loadEvents() {
    const data = await getAllEventsAdmin()
    setEvents(data)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { loadEvents() }, [])

  async function handleToggleFeatured(eventId: string) {
    startTransition(async () => {
      const result = await toggleEventFeatured(eventId)
      if (result.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, is_featured: result.is_featured } : e
          )
        )
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  const filteredEvents = events.filter((event) => {
    // Search filter
    const matchesSearch =
      !search ||
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.venue?.name?.toLowerCase().includes(search.toLowerCase())

    // Type filter
    let matchesFilter = true
    if (filter === 'featured') {
      matchesFilter = event.is_featured
    } else if (filter === 'upcoming') {
      matchesFilter = event.date >= today
    } else if (filter === 'past') {
      matchesFilter = event.date < today
    }

    return matchesSearch && matchesFilter
  })

  const featuredCount = events.filter((e) => e.is_featured).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage events and featured promotions
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{events.length}</p>
            <p className="text-xs text-white/50">Total Events</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{featuredCount}</p>
            <p className="text-xs text-white/50">Featured</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {events.filter((e) => e.date >= today).length}
            </p>
            <p className="text-xs text-white/50">Upcoming</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {events.filter((e) => e.date < today).length}
            </p>
            <p className="text-xs text-white/50">Past</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 min-w-[200px] glass-card flex items-center gap-2 px-4 py-2">
          <Search className="h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search events or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-white/40 outline-none w-full"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {(['all', 'featured', 'upcoming', 'past'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-primary text-white'
                  : 'glass-card text-white/60 hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Featured
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 text-white/20" />
                    <p className="text-sm text-white/40">No events found</p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const isPast = event.date < today
                  return (
                    <tr
                      key={event.id}
                      className={cn(
                        'hover:bg-white/5 transition-colors',
                        isPast && 'opacity-50'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            {event.flyer_url ? (
                              <Image
                                src={event.flyer_url}
                                alt={event.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                <CalendarDays className="w-5 h-5 text-white/40" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {event.name}
                            </p>
                            {event.artists && event.artists.length > 0 && (
                              <p className="text-xs text-primary">
                                {event.artists.slice(0, 2).join(', ')}
                                {event.artists.length > 2 && ` +${event.artists.length - 2}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-white/80">
                          {event.venue?.name || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-white">
                            {formatEventDate(event.date)}
                          </p>
                          <p className="text-xs text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.start_time)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {event.is_cancelled ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-red-500/20 text-red-400">
                            Cancelled
                          </span>
                        ) : isPast ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white/50">
                            Past
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(event.id)}
                          disabled={isPending || isPast}
                          className={cn(
                            'p-2 rounded-lg transition-all',
                            event.is_featured
                              ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                              : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60',
                            (isPending || isPast) && 'opacity-50 cursor-not-allowed'
                          )}
                          title={event.is_featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {event.is_featured ? (
                            <Star className="w-5 h-5 fill-current" />
                          ) : (
                            <StarOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
