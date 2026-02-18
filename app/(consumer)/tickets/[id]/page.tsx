import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate, formatTime } from '@/lib/utils/dates'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { TicketQRCode } from '@/components/ticket/ticket-qr-code'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(
        id,
        name,
        date,
        start_time,
        end_time,
        flyer_url,
        venue:venues(id, name, address_line1, city, state)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !ticket) notFound()

  const isCheckedIn = ticket.checked_in
  const isPaid = ticket.is_paid

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/tickets" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Ticket Details</h1>
        </div>

        <div className="glass-card overflow-hidden animate-fade-in">
          {/* Event header */}
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xl font-bold text-white mb-1">
              {ticket.event?.name}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {ticket.event?.venue?.name}
            </p>
          </div>

          {/* QR Code */}
          <div className="p-6 bg-white flex flex-col items-center">
            <TicketQRCode
              confirmationCode={ticket.confirmation_code}
              ticketId={ticket.id}
            />
            <p className="mt-4 text-3xl font-mono font-bold tracking-[0.3em] text-gray-900">
              {ticket.confirmation_code}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Show this at the door
            </p>
          </div>

          {/* Status */}
          <div className="p-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                {isCheckedIn ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-500">
                      Checked In
                    </span>
                  </>
                ) : ticket.status === 'confirmed' ? (
                  <>
                    <Ticket className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      Valid
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive capitalize">
                      {ticket.status}
                    </span>
                  </>
                )}
              </div>
            </div>

            {isPaid && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-semibold text-white">
                  ${ticket.amount_paid?.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="text-sm font-semibold text-white">
                {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Event details */}
          <div className="p-5 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {formatEventDate(ticket.event?.date)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {formatTime(ticket.event?.start_time)}
                {ticket.event?.end_time && ` - ${formatTime(ticket.event.end_time)}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {ticket.event?.venue?.address_line1}, {ticket.event?.venue?.city}, {ticket.event?.venue?.state}
              </span>
            </div>
          </div>
        </div>

        {/* View event button */}
        <Link
          href={`/event/${ticket.event?.id}`}
          className="mt-4 w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-ghost"
        >
          View Event Details
        </Link>
      </div>
    </div>
  )
}
