import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Ticket, Calendar, MapPin, ArrowRight } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function TicketSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect('/tickets')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the ticket by checkout session ID
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      event:events(
        id,
        name,
        date,
        start_time,
        venue:venues(name, address_line1, city, state)
      )
    `)
    .eq('stripe_checkout_session_id', session_id)
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="glass-card p-8 text-center animate-fade-in">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            You&apos;re In!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your tickets have been confirmed
          </p>

          {ticket && (
            <div className="glass-card p-4 text-left mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <Ticket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">{ticket.event?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">
                    {new Date(ticket.event?.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.event?.start_time?.slice(0, 5)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white">{ticket.event?.venue?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.event?.venue?.city}, {ticket.event?.venue?.state}
                  </p>
                </div>
              </div>

              {/* Confirmation code */}
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Confirmation Code</p>
                <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                  {ticket.confirmation_code}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/tickets"
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-neon"
            >
              View My Tickets
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/map"
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-ghost"
            >
              Explore More Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
