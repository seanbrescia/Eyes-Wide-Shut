import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getVIPReservationById } from '@/lib/actions/vip'
import {
  ArrowLeft,
  Wine,
  Calendar,
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; cancelled?: string }>
}

const STATUS_STYLES = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending Payment' },
  confirmed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Confirmed' },
  cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Cancelled' },
  completed: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'Completed' },
  no_show: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-secondary', label: 'No Show' },
}

export default async function VIPReservationDetailPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { id } = await params
  const { success, cancelled } = await searchParams
  const reservation = await getVIPReservationById(id)

  if (!reservation) notFound()

  const status = STATUS_STYLES[reservation.status]
  const StatusIcon = status.icon
  const isPast = new Date(reservation.date) < new Date(new Date().toISOString().split('T')[0])
  const canCancel = !isPast && reservation.status !== 'cancelled' && reservation.status !== 'completed'

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/vip" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Reservation Details</h1>
            <p className="text-sm text-muted-foreground">
              {reservation.confirmation_code}
            </p>
          </div>
        </div>

        {/* Success/Cancelled banners */}
        {success && (
          <div className="glass-card p-4 mb-6 border-green-500/30 bg-green-500/10 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Your reservation is confirmed! See you there.
          </div>
        )}

        {cancelled && (
          <div className="glass-card p-4 mb-6 border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment was cancelled. Complete payment to confirm your reservation.
          </div>
        )}

        {/* Status Badge */}
        <div className={cn('glass-card p-4 mb-6 flex items-center justify-between', status.bg)}>
          <div className="flex items-center gap-3">
            <StatusIcon className={cn('h-6 w-6', status.color)} />
            <div>
              <p className={cn('font-bold', status.color)}>{status.label}</p>
              <p className="text-xs text-muted-foreground">
                {reservation.deposit_paid ? 'Deposit paid' : 'Deposit required'}
              </p>
            </div>
          </div>
          <p className="font-mono text-lg font-bold">{reservation.confirmation_code}</p>
        </div>

        {/* Pay Deposit Button */}
        {reservation.status === 'pending' && !reservation.deposit_paid && (
          <form action="/api/vip/checkout" method="POST" className="mb-6">
            <input type="hidden" name="reservationId" value={reservation.id} />
            <button
              type="submit"
              className="w-full btn-neon py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Pay ${reservation.deposit_amount} Deposit
            </button>
          </form>
        )}

        {/* Venue Info */}
        <Link href={`/venue/${reservation.venue.id}`}>
          <div className="glass-card p-5 mb-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                <Wine className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{reservation.venue.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {reservation.venue.address_line1}, {reservation.venue.city}, {reservation.venue.state}
                </p>
              </div>
            </div>
          </div>
        </Link>

        {/* Reservation Details */}
        <div className="glass-card p-5 mb-4 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Reservation Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Date</p>
                <p className="font-semibold">{new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Party Size</p>
                <p className="font-semibold">{reservation.party_size} guests</p>
              </div>
            </div>
          </div>

          {reservation.package && (
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Package</p>
              <p className="font-semibold">{reservation.package.name}</p>
              {reservation.package.includes && reservation.package.includes.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {reservation.package.includes.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Guest Info */}
        <div className="glass-card p-5 mb-4 space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Guest Information
          </h3>

          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{reservation.guest_name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{reservation.guest_email}</span>
          </div>

          {reservation.guest_phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{reservation.guest_phone}</span>
            </div>
          )}

          {reservation.special_requests && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Special Requests</p>
                  <p className="text-sm">{reservation.special_requests}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="glass-card p-5 mb-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Pricing
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum Spend</span>
              <span className="font-semibold">${reservation.min_spend.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className={reservation.deposit_paid ? 'text-green-400' : 'text-yellow-400'}>
                ${reservation.deposit_amount.toLocaleString()}
                {reservation.deposit_paid ? ' (paid)' : ' (due)'}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className="font-bold">
                ${(reservation.min_spend - (reservation.deposit_paid ? reservation.deposit_amount : 0)).toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            Remaining balance due at the venue. Gratuity not included.
          </p>
        </div>

        {/* Cancel Button */}
        {canCancel && (
          <div className="text-center">
            <Link
              href={`/vip/${reservation.id}/cancel`}
              className="text-sm text-destructive hover:underline"
            >
              Cancel Reservation
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
