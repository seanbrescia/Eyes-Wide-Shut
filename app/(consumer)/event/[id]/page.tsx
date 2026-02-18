import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getEventById } from '@/lib/actions/event'
import { RSVPButton } from '@/components/event/rsvp-button'
import { BuyTicketButton } from '@/components/event/buy-ticket-button'
import { ShareButton } from '@/components/referral/share-button'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Music,
  DollarSign,
  Wine,
  Ticket,
  Users,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ref?: string }>
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { ref } = await searchParams
  const event = await getEventById(id)

  if (!event) notFound()

  const venue = event.venue as {
    id: string
    name: string
    slug: string
    city: string
    state: string
    address_line1: string
    venue_type: string | null
    cover_photo_url: string | null
    current_crowd_level: number
    is_eighteen_plus: boolean
    is_twenty_one_plus: boolean
    latitude: number
    longitude: number
  }

  // Fetch current user's referral code for sharing
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userReferralCode: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', user.id)
      .single()
    userReferralCode = profile?.referral_code || null
  }

  const isFree = !event.ticket_price || Number(event.ticket_price) === 0
  const isSoldOut =
    event.ticket_count !== null && event.tickets_sold >= event.ticket_count
  const hasTicketPrice = event.ticket_price && Number(event.ticket_price) > 0

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero / Flyer */}
      <div className="relative h-72 sm:h-96 bg-secondary">
        {event.flyer_url ? (
          <Image
            src={event.flyer_url}
            alt={event.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-background to-accent/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button & Share */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <Link
            href="/"
            className="glass-card p-2 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {userReferralCode && (
            <ShareButton
              referralCode={userReferralCode}
              entityType="event"
              entityId={event.id}
              entityName={event.name}
            />
          )}
        </div>

        {/* Event title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {event.is_featured && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-primary mb-1 inline-block">
              Featured Event
            </span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold neon-text">
            {event.name}
          </h1>
          <Link
            href={`/venue/${venue.id}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors mt-1 inline-flex items-center gap-1"
          >
            <MapPin className="h-3.5 w-3.5" />
            {venue.name} &middot; {venue.city}, {venue.state}
          </Link>
        </div>
      </div>

      <div className="px-4 sm:px-6 max-w-2xl mx-auto space-y-6 mt-6">
        {/* Date & Time card */}
        <div className="glass-card p-5">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Date
                </p>
                <p className="font-semibold">{formatEventDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Time
                </p>
                <p className="font-semibold">
                  {formatTime(event.start_time)}
                  {event.end_time && ` - ${formatTime(event.end_time)}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Venue info card */}
        <Link href={`/venue/${venue.id}`} className="block">
          <div className="glass-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
              {venue.cover_photo_url ? (
                <Image
                  src={venue.cover_photo_url}
                  alt={venue.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{venue.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {venue.address_line1}, {venue.city}, {venue.state}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {venue.venue_type && (
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {venue.venue_type}
                  </span>
                )}
                {venue.is_twenty_one_plus && (
                  <span className="text-[9px] font-bold bg-accent text-white px-1.5 py-0.5 rounded">
                    21+
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Description */}
        {event.description && (
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              About This Event
            </h2>
            <p className="text-sm leading-relaxed text-foreground/80">
              {event.description}
            </p>
          </div>
        )}

        {/* Artists */}
        {event.artists && event.artists.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <Music className="h-3.5 w-3.5 text-primary" />
              Artists / DJs
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.artists.map((artist: string) => (
                <span
                  key={artist}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {artist}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cover charge & Pricing */}
        <div className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            Pricing
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/80">Cover Charge</span>
              <span className="font-semibold">
                {Number(event.cover_charge) > 0
                  ? `$${Number(event.cover_charge).toFixed(2)}`
                  : 'Free'}
              </span>
            </div>
            {hasTicketPrice && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/80">Ticket Price</span>
                <span className="font-semibold text-primary">
                  ${Number(event.ticket_price).toFixed(2)}
                </span>
              </div>
            )}
            {event.ticket_count !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/80 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Availability
                </span>
                <span className="font-semibold">
                  {isSoldOut ? (
                    <span className="text-destructive">Sold Out</span>
                  ) : (
                    <span className="text-green-400">
                      {event.ticket_count - event.tickets_sold} remaining
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Drink Specials */}
        {event.drink_specials && event.drink_specials.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <Wine className="h-3.5 w-3.5 text-neon-cyan" />
              Drink Specials
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.drink_specials.map((special: string) => (
                <span
                  key={special}
                  className="bg-neon-cyan/10 text-neon-cyan px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {special}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="pt-2">
          {hasTicketPrice ? (
            <BuyTicketButton
              eventId={event.id}
              ticketPrice={Number(event.ticket_price)}
              ticketsAvailable={event.ticket_count}
              ticketsSold={event.tickets_sold}
              isLoggedIn={!!user}
              referralCode={ref}
            />
          ) : (
            <RSVPButton eventId={event.id} referralCode={ref} />
          )}
        </div>
      </div>
    </div>
  )
}
