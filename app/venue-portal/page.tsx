import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyVenue } from '@/lib/actions/venue'
import { getVenueEvents } from '@/lib/actions/event'
import { getVenueReferralLeaderboard } from '@/lib/actions/referral'
import { CROWD_LEVELS } from '@/lib/utils/constants'
import { getRelativeTime } from '@/lib/utils/dates'
import {
  Users,
  CalendarDays,
  Ticket,
  TrendingUp,
  Plus,
  Radio,
  Gift,
} from 'lucide-react'

export default async function VenueDashboardPage() {
  const venue = await getMyVenue()
  if (!venue) redirect('/venue-portal/apply')

  const events = await getVenueEvents(venue.id)

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = events.filter(
    (e) => e.date >= today && !e.is_cancelled
  )
  const totalTicketsSold = events.reduce((sum, e) => sum + e.tickets_sold, 0)

  const crowdLevel = CROWD_LEVELS.find(
    (c) => c.value === venue.current_crowd_level
  )

  // Get referral stats
  const referralLeaderboard = await getVenueReferralLeaderboard(venue.id)
  const referralDrivenRSVPs = referralLeaderboard.reduce(
    (sum, entry) => sum + Number(entry.rsvp_count),
    0
  )

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {venue.name}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Crowd Level */}
        <Link href="/venue-portal/crowd">
          <div className="glass-card p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${crowdLevel?.color}20` }}>
                <Users className="h-4 w-4" style={{ color: crowdLevel?.color }} />
              </div>
              <Radio
                className="h-4 w-4 animate-pulse"
                style={{ color: crowdLevel?.color }}
              />
            </div>
            <p className="text-2xl font-bold" style={{ color: crowdLevel?.color }}>
              {crowdLevel?.label || 'Unknown'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Crowd Level &middot; Updated{' '}
              {getRelativeTime(venue.crowd_updated_at)}
            </p>
          </div>
        </Link>

        {/* Upcoming Events */}
        <Link href="/venue-portal/events">
          <div className="glass-card p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{upcomingEvents.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Upcoming Events
            </p>
          </div>
        </Link>

        {/* Total Tickets */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-neon-cyan" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totalTicketsSold}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total Tickets / RSVPs
          </p>
        </div>

        {/* Referral-driven RSVPs */}
        <Link href="/venue-portal/referrals">
          <div className="glass-card p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-neon-pink/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-neon-pink" />
              </div>
              <TrendingUp className="h-4 w-4 text-neon-pink" />
            </div>
            <p className="text-2xl font-bold">{referralDrivenRSVPs}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Referral RSVPs
            </p>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/venue-portal/crowd">
            <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Update Crowd Level</p>
                <p className="text-[11px] text-muted-foreground">
                  Let people know how busy you are
                </p>
              </div>
            </div>
          </Link>

          <Link href="/venue-portal/events/new">
            <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-neon-pink/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-neon-pink" />
              </div>
              <div>
                <p className="text-sm font-semibold">Create Event</p>
                <p className="text-[11px] text-muted-foreground">
                  Post a new event for your venue
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming events preview */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Next Up
            </h2>
            <Link
              href="/venue-portal/events"
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary leading-none">
                    {new Date(event.date + 'T00:00:00').getDate()}
                  </span>
                  <span className="text-[8px] uppercase text-muted-foreground font-semibold">
                    {new Date(event.date + 'T00:00:00').toLocaleDateString(
                      'en-US',
                      { month: 'short' }
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{event.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {event.tickets_sold} ticket{event.tickets_sold !== 1 ? 's' : ''} sold
                  </p>
                </div>
                {event.is_cancelled && (
                  <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                    Cancelled
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
