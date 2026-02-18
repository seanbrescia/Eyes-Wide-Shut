import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyReferralStats } from '@/lib/actions/referral'
import { ReferralStatsCard } from '@/components/referral/referral-stats-card'
import {
  ArrowLeft,
  UserPlus,
  Ticket,
  Calendar,
} from 'lucide-react'

export default async function ReferralsPage() {
  const stats = await getMyReferralStats()
  if (!stats) redirect('/login')

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profile" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">My Referrals</h1>
        </div>

        {/* Stats card */}
        <div className="mb-8">
          <ReferralStatsCard stats={stats} />
        </div>

        {/* How it works */}
        <div className="glass-card p-5 mb-8">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            How It Works
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Share your link</p>
                <p className="text-[11px] text-muted-foreground">
                  Use the Share button on any event or venue page
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                <Ticket className="h-4 w-4 text-neon-cyan" />
              </div>
              <div>
                <p className="text-sm font-semibold">Friends RSVP or sign up</p>
                <p className="text-[11px] text-muted-foreground">
                  Earn 25 pts per RSVP, 50 pts per signup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral history */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Referral History
          </h2>
          {stats.referrals.length > 0 ? (
            <div className="space-y-2">
              {stats.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="glass-card p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: referral.action === 'signup'
                        ? 'rgb(236 72 153 / 0.1)'
                        : 'rgb(6 182 212 / 0.1)',
                    }}
                  >
                    {referral.action === 'signup' ? (
                      <UserPlus className="h-4 w-4 text-neon-pink" />
                    ) : (
                      <Ticket className="h-4 w-4 text-neon-cyan" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {referral.referred?.full_name || 'Someone'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="capitalize">{referral.action}</span>
                      {referral.event && (
                        <>
                          <span>&middot;</span>
                          <span className="truncate">{referral.event.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">
                      +{referral.points_awarded}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(referral.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No referrals yet. Share an event or venue to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
