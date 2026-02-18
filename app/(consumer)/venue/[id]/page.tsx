import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getVenueWithEvents } from '@/lib/actions/venue'
import { isVenueFavorited } from '@/lib/actions/favorites'
import { CrowdMeter } from '@/components/venue/crowd-meter'
import { EventCard } from '@/components/event/event-card'
import { ShareButton } from '@/components/referral/share-button'
import { FavoriteButton } from '@/components/venue/favorite-button'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  MapPin,
  Globe,
  Instagram,
  Phone,
  Clock,
  Users,
  ExternalLink,
} from 'lucide-react'
import { DAYS_OF_WEEK } from '@/lib/utils/constants'
import type { Event } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function VenueDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  await searchParams
  const venue = await getVenueWithEvents(id)

  if (!venue) notFound()

  // Fetch current user's referral code for sharing and favorite status
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userReferralCode: string | null = null
  let isFavorited = false
  if (user) {
    const [profileResult, favoritedResult] = await Promise.all([
      supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single(),
      isVenueFavorited(venue.id),
    ])
    userReferralCode = profileResult.data?.referral_code || null
    isFavorited = favoritedResult
  }

  const today = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
  const todayHours = venue.hours && typeof venue.hours === 'object' ? (venue.hours as Record<string, { open: string; close: string }>)[today] : null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 bg-secondary">
        {venue.cover_photo_url ? (
          <Image
            src={venue.cover_photo_url}
            alt={venue.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back button & Share/Favorite */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <Link
            href="/"
            className="glass-card p-2 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <FavoriteButton venueId={venue.id} initialFavorited={isFavorited} />
            )}
            {userReferralCode && (
              <ShareButton
                referralCode={userReferralCode}
                entityType="venue"
                entityId={venue.id}
                entityName={venue.name}
              />
            )}
          </div>
        </div>

        {/* Venue info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {venue.venue_type && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {venue.venue_type}
                  </span>
                )}
                {venue.is_twenty_one_plus && (
                  <span className="text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded">
                    21+
                  </span>
                )}
                {!venue.is_twenty_one_plus && venue.is_eighteen_plus && (
                  <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded">
                    18+
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold">{venue.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {venue.address_line1}, {venue.city}, {venue.state}
              </p>
            </div>
            <CrowdMeter
              level={venue.current_crowd_level}
              updatedAt={venue.crowd_updated_at}
              size="lg"
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 max-w-2xl mx-auto space-y-6 mt-6">
        {/* Quick info row */}
        <div className="flex flex-wrap gap-3">
          {todayHours && (
            <div className="glass-card px-3 py-2 flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Today: {todayHours.open} - {todayHours.close}</span>
            </div>
          )}
          {venue.capacity && (
            <div className="glass-card px-3 py-2 flex items-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Capacity: {venue.capacity}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {venue.bio && (
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">About</h2>
            <p className="text-sm leading-relaxed text-foreground/80">{venue.bio}</p>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          {venue.website && (
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-4 py-2.5 flex items-center gap-2 text-xs hover:border-primary/30 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              Website
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
          {venue.instagram && (
            <a
              href={`https://instagram.com/${venue.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card px-4 py-2.5 flex items-center gap-2 text-xs hover:border-primary/30 transition-colors"
            >
              <Instagram className="h-3.5 w-3.5 text-neon-pink" />
              {venue.instagram}
            </a>
          )}
          {venue.phone && (
            <a
              href={`tel:${venue.phone}`}
              className="glass-card px-4 py-2.5 flex items-center gap-2 text-xs hover:border-primary/30 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-neon-cyan" />
              {venue.phone}
            </a>
          )}
        </div>

        {/* Photo gallery */}
        {venue.photos && venue.photos.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Photos</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {venue.photos.map((photo: string, i: number) => (
                <div key={i} className="relative w-40 h-40 rounded-xl overflow-hidden shrink-0 bg-secondary">
                  <Image
                    src={photo}
                    alt={`${venue.name} photo ${i + 1}`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo video */}
        {venue.promo_video_url && (
          <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Promo Video</h2>
            <div className="glass-card overflow-hidden rounded-xl aspect-video">
              <iframe
                src={venue.promo_video_url}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
          </div>
        )}

        {/* Upcoming events */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Upcoming Events
          </h2>
          {venue.events && venue.events.length > 0 ? (
            <div className="space-y-3">
              {venue.events.map((event: Event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
