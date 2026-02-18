import { redirect } from 'next/navigation'
import { getMyVenue } from '@/lib/actions/venue'
import { getVenueReferralLeaderboard } from '@/lib/actions/referral'
import { VenueReferralLeaderboard } from '@/components/referral/venue-referral-leaderboard'
import { Users, Gift } from 'lucide-react'

export default async function VenueReferralsPage() {
  const venue = await getMyVenue()
  if (!venue) redirect('/venue-portal/apply')

  const leaderboard = await getVenueReferralLeaderboard(venue.id)

  const totalReferrals = leaderboard.reduce(
    (sum, entry) => sum + Number(entry.rsvp_count) + Number(entry.signup_count),
    0
  )
  const totalPoints = leaderboard.reduce(
    (sum, entry) => sum + Number(entry.total_points),
    0
  )

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See who is driving traffic to your venue
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totalReferrals}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total Referrals
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-neon-pink/10 flex items-center justify-center">
              <Gift className="h-4 w-4 text-neon-pink" />
            </div>
          </div>
          <p className="text-2xl font-bold">{totalPoints}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Points Awarded
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Top Promoters
        </h2>
        <VenueReferralLeaderboard entries={leaderboard} />
      </div>
    </div>
  )
}
