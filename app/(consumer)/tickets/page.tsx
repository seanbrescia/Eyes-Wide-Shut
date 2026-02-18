import Link from 'next/link'
import { getUserTickets } from '@/lib/actions/ticket'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  PartyPopper,
} from 'lucide-react'
import type { TicketStatus } from '@/types/database'

const statusConfig: Record<
  TicketStatus,
  { label: string; color: string; bg: string }
> = {
  confirmed: {
    label: 'Confirmed',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
}

export default async function TicketsPage() {
  const tickets = await getUserTickets()

  const today = new Date().toISOString().split('T')[0]
  const upcoming = tickets.filter(
    (t: { event: { date: string }; status: string }) =>
      t.event?.date >= today && t.status !== 'cancelled'
  )
  const past = tickets.filter(
    (t: { event: { date: string }; status: string }) =>
      t.event?.date < today || t.status === 'cancelled'
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">My Tickets</h1>
        </div>

        {tickets.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No tickets yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              RSVP to events to see your tickets here.
            </p>
            <Link
              href="/explore"
              className="btn-neon px-6 py-2.5 rounded-xl text-sm inline-block"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                  <PartyPopper className="h-3.5 w-3.5 text-primary" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((ticket: {
                    id: string
                    confirmation_code: string
                    status: TicketStatus
                    quantity: number
                    is_paid: boolean
                    event: {
                      id: string
                      name: string
                      date: string
                      start_time: string
                      end_time: string | null
                      venue: {
                        id: string
                        name: string
                        city: string
                        state: string
                      }
                    }
                  }) => {
                    const config = statusConfig[ticket.status]
                    return (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                      >
                        <div className="glass-card p-5 hover:border-primary/30 transition-colors animate-fade-in">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <h3 className="font-bold truncate">
                                {ticket.event.name}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {ticket.event.venue?.name} &middot;{' '}
                                {ticket.event.venue?.city},{' '}
                                {ticket.event.venue?.state}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded shrink-0',
                                config.bg,
                                config.color
                              )}
                            >
                              {config.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatEventDate(ticket.event.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(ticket.event.start_time)}
                            </span>
                            {ticket.quantity > 1 && (
                              <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                x{ticket.quantity}
                              </span>
                            )}
                          </div>

                          {/* Confirmation code */}
                          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                              Confirmation Code
                            </p>
                            <p className="text-xl font-mono font-bold tracking-widest text-primary">
                              {ticket.confirmation_code || '---'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Past ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((ticket: {
                    id: string
                    confirmation_code: string
                    status: TicketStatus
                    event: {
                      id: string
                      name: string
                      date: string
                      start_time: string
                      venue: {
                        name: string
                        city: string
                        state: string
                      }
                    }
                  }) => {
                    const config = statusConfig[ticket.status]
                    return (
                      <div
                        key={ticket.id}
                        className="glass-card p-4 opacity-60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {ticket.event.name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {ticket.event.venue?.name} &middot;{' '}
                              {formatEventDate(ticket.event.date)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded shrink-0',
                              config.bg,
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wider">
                          {ticket.confirmation_code || '---'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
