import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyVIPReservations } from '@/lib/actions/vip'
import { ArrowLeft, Wine, Calendar, Users, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const STATUS_STYLES = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Confirmed' },
  cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
  completed: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Completed' },
  no_show: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'No Show' },
}

export default async function MyVIPReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const reservations = await getMyVIPReservations()

  const upcoming = reservations.filter(r =>
    r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'no_show' &&
    new Date(r.date) >= new Date(new Date().toISOString().split('T')[0])
  )
  const past = reservations.filter(r =>
    r.status === 'cancelled' || r.status === 'completed' || r.status === 'no_show' ||
    new Date(r.date) < new Date(new Date().toISOString().split('T')[0])
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">VIP Reservations</h1>
            <p className="text-sm text-muted-foreground">
              Your bottle service bookings
            </p>
          </div>
        </div>

        {reservations.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">No reservations yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Book VIP bottle service at your favorite venues
            </p>
            <Link
              href="/explore"
              className="btn-neon px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
            >
              Explore Venues
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
                  {upcoming.map((res) => {
                    const status = STATUS_STYLES[res.status]
                    const StatusIcon = status.icon
                    return (
                      <Link key={res.id} href={`/vip/${res.id}`}>
                        <div className="glass-card p-4 hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex flex-col items-center justify-center shrink-0">
                              <span className="text-xl font-bold text-amber-400 leading-none">
                                {new Date(res.date + 'T00:00:00').getDate()}
                              </span>
                              <span className="text-[9px] uppercase text-muted-foreground font-semibold">
                                {new Date(res.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm truncate">
                                {res.package?.name || 'VIP Table'}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {res.venue.name}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {res.party_size} guests
                                </span>
                                <span className={cn('text-xs flex items-center gap-1 px-2 py-0.5 rounded', status.bg, status.color)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-mono text-xs text-primary">{res.confirmation_code}</p>
                              <p className="text-lg font-bold mt-1">${res.min_spend}</p>
                              <p className="text-[10px] text-muted-foreground">min spend</p>
                            </div>
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
                <div className="space-y-2">
                  {past.map((res) => {
                    const status = STATUS_STYLES[res.status]
                    return (
                      <Link key={res.id} href={`/vip/${res.id}`}>
                        <div className="glass-card p-4 opacity-60 hover:opacity-80 transition-opacity">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center shrink-0">
                              <span className="text-lg font-bold text-muted-foreground leading-none">
                                {new Date(res.date + 'T00:00:00').getDate()}
                              </span>
                              <span className="text-[8px] uppercase text-muted-foreground">
                                {new Date(res.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate text-muted-foreground">
                                {res.venue.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {res.package?.name || 'VIP'} · {res.party_size} guests
                              </p>
                            </div>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', status.bg, status.color)}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </Link>
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
