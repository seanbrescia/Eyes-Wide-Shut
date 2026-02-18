import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyVenue } from '@/lib/actions/venue'
import { getVenueEvents } from '@/lib/actions/event'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import {
  Plus,
  Calendar,
  Clock,
  Ticket,
  Music,
  CalendarDays,
  Pencil,
} from 'lucide-react'

export default async function VenueEventsPage() {
  const venue = await getMyVenue()
  if (!venue) redirect('/venue-portal/apply')

  const events = await getVenueEvents(venue.id)

  const today = new Date().toISOString().split('T')[0]
  const upcoming = events.filter((e) => e.date >= today && !e.is_cancelled)
  const past = events.filter((e) => e.date < today || e.is_cancelled)

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your venue&apos;s events
          </p>
        </div>
        <Link
          href="/venue-portal/events/new"
          className="btn-neon px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No events yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first event to start selling tickets.
          </p>
          <Link
            href="/venue-portal/events/new"
            className="btn-neon px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <div key={event.id} className="glass-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                    {/* Date block */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-primary leading-none">
                        {new Date(event.date + 'T00:00:00').getDate()}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground font-semibold">
                        {new Date(
                          event.date + 'T00:00:00'
                        ).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>

                    {/* Event info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate">
                        {event.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.start_time)}
                        </span>
                        {event.artists && event.artists.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {event.artists.length} artist
                            {event.artists.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {event.ticket_price && (
                          <span className="text-primary font-semibold">
                            ${Number(event.ticket_price).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tickets sold */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-semibold">
                        <Ticket className="h-3.5 w-3.5 text-neon-cyan" />
                        {event.tickets_sold}
                        {event.ticket_count !== null && (
                          <span className="text-muted-foreground font-normal">
                            /{event.ticket_count}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        sold
                      </p>
                    </div>

                    {/* Edit button */}
                    <Link
                      href={`/venue-portal/events/${event.id}/edit`}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Past / Cancelled ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'glass-card p-4 flex items-center gap-4',
                      event.is_cancelled && 'opacity-50'
                    )}
                  >
                    <div className="w-14 h-14 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-muted-foreground leading-none">
                        {new Date(event.date + 'T00:00:00').getDate()}
                      </span>
                      <span className="text-[9px] uppercase text-muted-foreground font-semibold">
                        {new Date(
                          event.date + 'T00:00:00'
                        ).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate text-muted-foreground">
                        {event.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatEventDate(event.date)} &middot;{' '}
                        {event.tickets_sold} tickets sold
                      </p>
                    </div>

                    {event.is_cancelled && (
                      <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-2 py-0.5 rounded shrink-0">
                        Cancelled
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
