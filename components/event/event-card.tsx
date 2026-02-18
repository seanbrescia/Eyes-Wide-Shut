import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, Music, DollarSign, Ticket } from 'lucide-react'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { Event, Venue } from '@/types/database'

interface EventCardProps {
  event: Event & { venue?: Venue }
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const isFree = !event.ticket_price || Number(event.ticket_price) === 0
  const isSoldOut = event.ticket_count !== null && event.tickets_sold >= event.ticket_count

  return (
    <Link href={`/event/${event.id}`}>
      <div
        className={cn(
          'glass-card overflow-hidden group cursor-pointer transition-all hover:border-primary/30',
          event.is_featured && 'ring-1 ring-primary/30',
          className
        )}
      >
        <div className="flex gap-4 p-4">
          {/* Flyer / Date */}
          {event.flyer_url ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
              <Image
                src={event.flyer_url}
                alt={event.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">
                {new Date(event.date + 'T00:00:00').getDate()}
              </span>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </div>
          )}

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {event.is_featured && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-primary">
                    Featured
                  </span>
                )}
                <h3 className="font-bold text-foreground truncate">{event.name}</h3>
                {event.venue && (
                  <p className="text-xs text-muted-foreground truncate">{event.venue.name}</p>
                )}
              </div>

              {/* Price badge */}
              <div className="shrink-0">
                {isSoldOut ? (
                  <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                    SOLD OUT
                  </span>
                ) : isFree ? (
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    FREE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">
                    ${Number(event.ticket_price).toFixed(0)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatEventDate(event.date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(event.start_time)}
              </span>
              {Number(event.cover_charge) > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${Number(event.cover_charge)} cover
                </span>
              )}
            </div>

            {/* Artists */}
            {event.artists && event.artists.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Music className="h-3 w-3 text-primary shrink-0" />
                <p className="text-[11px] text-primary truncate">
                  {event.artists.join(' / ')}
                </p>
              </div>
            )}

            {/* Drink specials */}
            {event.drink_specials && event.drink_specials.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.drink_specials.slice(0, 2).map((deal) => (
                  <span
                    key={deal}
                    className="text-[9px] bg-neon-cyan/10 text-neon-cyan px-1.5 py-0.5 rounded font-medium"
                  >
                    {deal}
                  </span>
                ))}
                {event.drink_specials.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{event.drink_specials.length - 2} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
