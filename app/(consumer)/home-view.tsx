'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  Users,
  Flame,
  Crown,
  Calendar,
  Music,
  Wine,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Venue, Event } from '@/types/database'

interface HomeViewProps {
  venues: Venue[]
  tonightEvents: (Event & { venue: Venue })[]
  featuredEvents: (Event & { venue: Venue })[]
  hotSpot: Venue | null
}

const emptySubscribe = () => () => {}

export function HomeView({ venues, tonightEvents, featuredEvents, hotSpot }: HomeViewProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })

  // Get top venues by crowd level
  const liveVenues = venues
    .filter(v => v.current_crowd_level > 0)
    .sort((a, b) => b.current_crowd_level - a.current_crowd_level)
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden"
      >
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient orb */}
          <div
            className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] transition-all duration-1000 ease-out"
            style={{
              background: 'radial-gradient(circle, rgba(168,85,247,0.8) 0%, rgba(236,72,153,0.4) 50%, transparent 70%)',
              left: `${20 + mousePosition.x * 20}%`,
              top: `${10 + mousePosition.y * 20}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
          {/* Secondary gradient orb */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] transition-all duration-1500 ease-out"
            style={{
              background: 'radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(168,85,247,0.3) 50%, transparent 70%)',
              right: `${10 + (1 - mousePosition.x) * 15}%`,
              bottom: `${20 + (1 - mousePosition.y) * 15}%`,
              transform: 'translate(50%, 50%)',
            }}
          />
          {/* Accent orb */}
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.6) 0%, transparent 60%)',
              left: '60%',
              top: '60%',
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-8 max-w-6xl mx-auto w-full">
          {/* Top badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8",
              "bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm",
              "opacity-0 transition-all duration-700",
              mounted && "opacity-100"
            )}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white/60">{dayOfWeek}</span>
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs font-medium text-white/60">
              {venues.length} venues live
            </span>
          </div>

          {/* Main heading */}
          <h1
            className={cn(
              "text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6",
              "opacity-0 translate-y-8 transition-all duration-700 delay-100",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            <span className="block text-white/90">{greeting}.</span>
            <span className="block mt-2 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Where tonight?
            </span>
          </h1>

          {/* Subheading */}
          <p
            className={cn(
              "text-lg sm:text-xl text-white/50 max-w-xl mb-10 leading-relaxed",
              "opacity-0 translate-y-8 transition-all duration-700 delay-200",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            Discover the city&apos;s most exclusive nightlife.
            VIP tables, bottle service, and unforgettable nights await.
          </p>

          {/* CTA Buttons */}
          <div
            className={cn(
              "flex flex-wrap gap-4",
              "opacity-0 translate-y-8 transition-all duration-700 delay-300",
              mounted && "opacity-100 translate-y-0"
            )}
          >
            <Link
              href="/explore"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl overflow-hidden"
            >
              {/* Button background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

              <span className="relative font-semibold text-white">Explore Tonight</span>
              <ArrowRight className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/map"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm transition-all duration-300"
            >
              <MapPin className="w-5 h-5 text-white/70 group-hover:text-primary transition-colors" />
              <span className="font-semibold text-white/90">View Map</span>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2",
            "opacity-0 transition-all duration-700 delay-700",
            mounted && "opacity-100"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Scroll</span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* Hot Spot Section */}
      {hotSpot && (
        <section className="relative px-6 sm:px-8 py-16 max-w-6xl mx-auto">
          <Link href={`/venue/${hotSpot.id}`} className="block group">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Glowing border effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl opacity-75 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />

              <div className="relative bg-background rounded-3xl overflow-hidden">
                {/* Image */}
                <div className="relative h-64 sm:h-80">
                  {hotSpot.cover_photo_url ? (
                    <Image
                      src={hotSpot.cover_photo_url}
                      alt={hotSpot.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20" />
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                  {/* Hot badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/25">
                    <Flame className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-sm font-bold text-white uppercase tracking-wide">Tonight&apos;s Hot Spot</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative p-6 sm:p-8 -mt-20">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:text-gradient transition-all">
                        {hotSpot.name}
                      </h2>
                      <div className="flex items-center gap-4 text-white/60">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {hotSpot.city}, {hotSpot.state}
                        </span>
                        {hotSpot.venue_type && (
                          <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium">
                            {hotSpot.venue_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Crowd indicator */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-amber-400" />
                        <span className="text-2xl font-bold text-white">{hotSpot.current_crowd_level}%</span>
                      </div>
                      <span className="text-xs text-white/40 uppercase tracking-wide">Crowd Level</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Tonight's Events */}
      {tonightEvents.length > 0 && (
        <section className="px-6 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Happening Tonight</h2>
              </div>
              <p className="text-white/50">{tonightEvents.length} events across the city</p>
            </div>
            <Link
              href="/explore?filter=tonight"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-primary transition-colors group"
            >
              View all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tonightEvents.slice(0, 6).map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="px-6 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Events</h2>
              </div>
              <p className="text-white/50">Curated experiences you don&apos;t want to miss</p>
            </div>
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-primary transition-colors group"
            >
              View all
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredEvents.slice(0, 4).map((event, i) => (
              <FeaturedEventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Live Venues */}
      {liveVenues.length > 0 && (
        <section className="px-6 sm:px-8 py-16 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Live Right Now</h2>
              </div>
              <p className="text-white/50">See what&apos;s happening across the city</p>
            </div>
            <Link
              href="/map"
              className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-primary transition-colors group"
            >
              View map
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {liveVenues.map((venue, i) => (
              <LiveVenueCard key={venue.id} venue={venue} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="px-6 sm:px-8 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickAction
            href="/explore?filter=tonight"
            icon={Calendar}
            label="Tonight"
            color="from-primary to-purple-600"
          />
          <QuickAction
            href="/explore?filter=this-weekend"
            icon={Music}
            label="This Weekend"
            color="from-pink-500 to-rose-500"
          />
          <QuickAction
            href="/vip"
            icon={Wine}
            label="VIP Tables"
            color="from-amber-500 to-orange-500"
          />
          <QuickAction
            href="/leaderboard"
            icon={Star}
            label="Top Promoters"
            color="from-cyan-500 to-blue-500"
          />
        </div>
      </section>

      {/* Bottom spacer for nav */}
      <div className="h-20" />
    </div>
  )
}

// Event Card Component
function EventCard({ event, index }: { event: Event & { venue: Venue }, index: number }) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="group relative rounded-2xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-primary/30 transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="p-5">
        {/* Time badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              {event.start_time?.slice(0, 5) || 'TBA'}
            </span>
          </div>
          {event.cover_charge > 0 && (
            <span className="text-xs text-white/40">${event.cover_charge} cover</span>
          )}
        </div>

        {/* Event name */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {event.name}
        </h3>

        {/* Venue */}
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{event.venue.name}</span>
        </div>

        {/* Artists */}
        {event.artists && event.artists.length > 0 && (
          <div className="flex items-center gap-2 mt-3 text-white/40 text-xs">
            <Music className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{event.artists.slice(0, 2).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}

// Featured Event Card
function FeaturedEventCard({ event, index }: { event: Event & { venue: Venue }, index: number }) {
  const eventDate = new Date(event.date + 'T00:00:00')

  return (
    <Link
      href={`/event/${event.id}`}
      className="group relative rounded-2xl overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500" />

      <div className="relative flex bg-white/[0.02] border border-white/[0.05] group-hover:border-transparent rounded-2xl overflow-hidden">
        {/* Image */}
        <div className="relative w-32 sm:w-48 shrink-0">
          {event.venue.cover_photo_url ? (
            <Image
              src={event.venue.cover_photo_url}
              alt={event.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6">
          {/* Date badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <span className="text-lg font-bold text-white leading-none">{eventDate.getDate()}</span>
              <span className="text-[10px] uppercase text-white/50 font-medium">
                {eventDate.toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-primary">{event.start_time?.slice(0, 5) || 'TBA'}</span>
              {event.cover_charge > 0 && (
                <span className="text-xs text-white/40 ml-2">${event.cover_charge}</span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient transition-all line-clamp-1">
            {event.name}
          </h3>

          {/* Venue */}
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{event.venue.name}</span>
            <span className="text-white/30">•</span>
            <span>{event.venue.city}</span>
          </div>

          {/* Artists */}
          {event.artists && event.artists.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {event.artists.slice(0, 3).map((artist, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60">
                  {artist}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// Live Venue Card
function LiveVenueCard({ venue, index }: { venue: Venue, index: number }) {
  const crowdColor = venue.current_crowd_level >= 80
    ? 'from-red-500 to-orange-500'
    : venue.current_crowd_level >= 50
    ? 'from-amber-500 to-yellow-500'
    : 'from-green-500 to-emerald-500'

  return (
    <Link
      href={`/venue/${venue.id}`}
      className="group relative rounded-2xl overflow-hidden aspect-square"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image */}
      {venue.cover_photo_url ? (
        <Image
          src={venue.cover_photo_url}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Live indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold text-white">{venue.current_crowd_level}%</span>
      </div>

      {/* Crowd bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div
          className={cn("h-full bg-gradient-to-r", crowdColor)}
          style={{ width: `${venue.current_crowd_level}%` }}
        />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
          {venue.name}
        </h3>
        <p className="text-[10px] text-white/50 line-clamp-1">{venue.venue_type || venue.city}</p>
      </div>
    </Link>
  )
}

// Quick Action Card
function QuickAction({ href, icon: Icon, label, color }: { href: string, icon: React.ComponentType<{ className?: string }>, label: string, color: string }) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl overflow-hidden aspect-square sm:aspect-[2/1]"
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity",
        color
      )} />

      {/* Border */}
      <div className="absolute inset-0 border border-white/[0.05] group-hover:border-white/10 rounded-2xl transition-colors" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110",
          color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
    </Link>
  )
}
