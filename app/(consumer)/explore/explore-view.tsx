'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import Link from 'next/link'
import { EventCard } from '@/components/event/event-card'
import { FeaturedEventsCarousel } from '@/components/event/featured-events-carousel'
import { Flame, Calendar, PartyPopper, CalendarDays, Search, X, MapPin, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { searchEvents } from '@/lib/actions/event'
import { searchVenues } from '@/lib/actions/venue'
import { VENUE_TYPES } from '@/lib/utils/constants'
import type { Event, Venue } from '@/types/database'

const filters = [
  { key: 'tonight', label: 'Tonight', icon: Flame },
  { key: 'tomorrow', label: 'Tomorrow', icon: Calendar },
  { key: 'this-weekend', label: 'Weekend', icon: PartyPopper },
  { key: 'this-week', label: 'This Week', icon: CalendarDays },
] as const

interface ExploreViewProps {
  initialEvents: (Event & { venue: Venue })[]
  featuredEvents?: (Event & { venue: Venue })[]
}

export function ExploreView({ initialEvents, featuredEvents = [] }: ExploreViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>('this-week')
  const [events] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<(Event & { venue: Venue })[] | null>(null)
  const [venueResults, setVenueResults] = useState<Venue[] | null>(null)
  const [activeVenueType, setActiveVenueType] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current)
    }

    if (!query.trim()) {
      setSearchResults(null)
      setVenueResults(null)
      return
    }

    searchTimeout.current = setTimeout(() => {
      startTransition(async () => {
        const [eventResults, venueRes] = await Promise.all([
          searchEvents(query),
          searchVenues(query),
        ])
        setSearchResults(eventResults)
        setVenueResults(venueRes)
      })
    }, 300)
  }, [])

  // Venue type filter
  const handleVenueTypeFilter = useCallback((type: string | null) => {
    setActiveVenueType(type)
    if (type) {
      startTransition(async () => {
        const venues = await searchVenues('', type)
        setVenueResults(venues)
        setSearchResults([]) // clear event results when filtering by venue type
      })
    } else {
      setVenueResults(null)
      setSearchResults(null)
    }
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setVenueResults(null)
    setActiveVenueType(null)
    setIsSearching(false)
  }

  // Client-side filtering based on dates
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (activeFilter) {
      case 'tonight':
        return eventDate.getTime() === today.getTime()
      case 'tomorrow': {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return eventDate.getTime() === tomorrow.getTime()
      }
      case 'this-weekend': {
        const day = today.getDay()
        const fridayOffset = day <= 5 ? 5 - day : 0
        const friday = new Date(today)
        friday.setDate(friday.getDate() + fridayOffset)
        const sunday = new Date(friday)
        sunday.setDate(sunday.getDate() + 2)
        return eventDate >= friday && eventDate <= sunday
      }
      case 'this-week':
      default:
        return true
    }
  })

  const showingSearch = searchResults !== null || venueResults !== null
  const displayEvents = showingSearch ? (searchResults || []) : filteredEvents
  const displayVenues = showingSearch ? (venueResults || []) : []

  return (
    <div className="min-h-screen bg-background pt-4 pb-20">
      {/* Header */}
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">See what&apos;s happening near you</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events, venues, artists..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearching(true)}
            className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-10 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          {(searchQuery || isSearching) && (
            <button
              onClick={clearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Venue Type Filters */}
      {isSearching && (
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar px-4">
          <button
            onClick={() => handleVenueTypeFilter(null)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
              !activeVenueType
                ? 'bg-primary text-primary-foreground'
                : 'glass-card text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
          {VENUE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleVenueTypeFilter(activeVenueType === type ? null : type)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                activeVenueType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Featured Events (hidden when searching) */}
      {!showingSearch && featuredEvents.length > 0 && (
        <div className="mb-8">
          <FeaturedEventsCarousel events={featuredEvents} />
        </div>
      )}

      {/* Time Filter tabs (hidden when searching) */}
      {!showingSearch && (
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar px-4">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                activeFilter === filter.key
                  ? 'bg-primary text-primary-foreground neon-glow'
                  : 'glass-card text-muted-foreground hover:text-foreground'
              )}
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isPending && (
        <div className="px-4 py-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-3">Searching...</p>
        </div>
      )}

      {/* Search Results */}
      {!isPending && showingSearch && (
        <div className="px-4 space-y-6">
          {/* Venue Results */}
          {displayVenues.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Venues ({displayVenues.length})
              </h2>
              <div className="space-y-2">
                {displayVenues.map((venue) => (
                  <Link key={venue.id} href={`/venue/${venue.id}`}>
                    <div className="glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-all cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate">{venue.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{venue.city}, {venue.state}</span>
                          {venue.venue_type && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <span>{venue.venue_type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Event Results */}
          {displayEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Events ({displayEvents.length})
              </h2>
              <div className="space-y-3">
                {displayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {displayEvents.length === 0 && displayVenues.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No results for &ldquo;{searchQuery || activeVenueType}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try a different search or browse events below
              </p>
            </div>
          )}
        </div>
      )}

      {/* Default Events list (hidden when searching) */}
      {!isPending && !showingSearch && (
        <div className="space-y-3 px-4">
          {filteredEvents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <PartyPopper className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No events found for this filter
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Check back soon or try a different time
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
