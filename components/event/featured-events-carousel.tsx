'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Sparkles } from 'lucide-react'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import type { Event, Venue } from '@/types/database'

interface FeaturedEventsCarouselProps {
  events: (Event & { venue: Venue })[]
}

export function FeaturedEventsCarousel({ events }: FeaturedEventsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = 340
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (events.length === 0) return null

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Featured Events</h2>
            <p className="text-xs text-white/50">Don&apos;t miss these hot picks</p>
          </div>
        </div>

        {/* Navigation arrows */}
        {events.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-4 pb-2"
      >
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/event/${event.id}`}
            className="shrink-0 w-[320px] group"
          >
            <div className="relative glass-card overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 animate-border-glow">
              {/* Featured badge */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                <Sparkles className="w-3 h-3" />
                Featured
              </div>

              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                {event.flyer_url || event.venue?.cover_photo_url ? (
                  <Image
                    src={event.flyer_url || event.venue.cover_photo_url!}
                    alt={event.name}
                    fill
                    sizes="320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-pink-600/40" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Date overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex flex-col items-center justify-center border border-white/20">
                    <span className="text-lg font-bold text-white leading-none">
                      {new Date(event.date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[9px] uppercase text-white/80 font-semibold">
                      {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm truncate max-w-[200px]">
                      {event.name}
                    </p>
                    <p className="text-white/70 text-xs">
                      {event.venue?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.venue?.city}, {event.venue?.state}
                  </span>
                </div>

                {/* Artists */}
                {event.artists && event.artists.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {event.artists.slice(0, 3).map((artist) => (
                      <span
                        key={artist}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium"
                      >
                        {artist}
                      </span>
                    ))}
                    {event.artists.length > 3 && (
                      <span className="text-[10px] text-white/40">
                        +{event.artists.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    {event.ticket_price ? (
                      <span className="text-lg font-bold text-white">
                        ${Number(event.ticket_price).toFixed(0)}
                      </span>
                    ) : event.cover_charge > 0 ? (
                      <span className="text-sm text-white/60">
                        ${event.cover_charge} cover
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-green-400">Free Entry</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                    Get Tickets →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
