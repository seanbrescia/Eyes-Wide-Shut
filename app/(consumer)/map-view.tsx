'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(
  () => import('@/components/map/map-container').then((mod) => mod.MapContainerComponent),
  { ssr: false, loading: () => <div className="w-full h-full bg-secondary flex items-center justify-center"><div className="text-muted-foreground text-sm">Loading map...</div></div> }
)
import { VenueCard } from '@/components/venue/venue-card'
import { FeaturedEventsCarousel } from '@/components/event/featured-events-carousel'
import { Search, ChevronUp, ChevronDown, CalendarDays, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Venue, Event } from '@/types/database'

type ViewMode = 'map' | 'events'

interface MapViewProps {
  venues: Venue[]
  featuredEvents?: (Event & { venue: Venue })[]
}

export function MapView({ venues, featuredEvents = [] }: MapViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('map')

  const filteredVenues = search
    ? venues.filter(
        (v) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.city.toLowerCase().includes(search.toLowerCase())
      )
    : venues

  return (
    <div className="relative h-[calc(100vh-64px)]">
      {/* Map */}
      <div className="absolute inset-0">
        <MapContainer venues={venues} />
      </div>

      {/* Top bar with search and view toggle */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-3">
        {/* Search */}
        <div className="flex-1 glass-card flex items-center gap-2 px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search bars, clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* View toggle */}
        <div className="glass-card flex p-1 gap-1">
          <button
            onClick={() => setViewMode('map')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'map'
                ? 'bg-primary text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            Map
          </button>
          <button
            onClick={() => setViewMode('events')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
              viewMode === 'events'
                ? 'bg-primary text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Events
          </button>
        </div>
      </div>

      {/* Featured events overlay (shows above bottom sheet when on map view) */}
      {viewMode === 'map' && featuredEvents.length > 0 && !sheetOpen && (
        <div className="absolute left-0 right-0 z-[15]" style={{ bottom: '140px' }}>
          <FeaturedEventsCarousel events={featuredEvents} />
        </div>
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-xl border-t border-border/50 rounded-t-2xl transition-all duration-300',
          sheetOpen ? 'h-[60vh]' : 'h-auto'
        )}
      >
        {/* Handle */}
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          className="w-full flex flex-col items-center py-3"
        >
          <div className="w-10 h-1 bg-border rounded-full mb-2" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {sheetOpen ? (
              <>
                <ChevronDown className="h-3 w-3" /> Hide list
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" /> {filteredVenues.length} venues nearby
              </>
            )}
          </div>
        </button>

        {/* Venue list */}
        {sheetOpen && (
          <div className="overflow-y-auto px-4 pb-20 space-y-3" style={{ maxHeight: 'calc(60vh - 60px)' }}>
            {filteredVenues.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No venues found nearby
              </p>
            ) : (
              filteredVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))
            )}
          </div>
        )}

        {/* Quick scroll of venues when collapsed */}
        {!sheetOpen && filteredVenues.length > 0 && (
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {filteredVenues.slice(0, 10).map((venue) => (
              <VenueCard key={venue.id} venue={venue} className="min-w-[260px] shrink-0" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
