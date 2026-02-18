import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAvailableRewards, getMyRedemptions } from '@/lib/actions/rewards'
import { RewardCard } from '@/components/rewards/reward-card'
import { ArrowLeft, Gift, Ticket, QrCode } from 'lucide-react'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('referral_points')
    .eq('id', user.id)
    .single()

  const [rewards, redemptions] = await Promise.all([
    getAvailableRewards(),
    getMyRedemptions(),
  ])

  const userPoints = profile?.referral_points || 0
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Rewards</h1>
            <p className="text-sm text-muted-foreground">
              Redeem your points for perks
            </p>
          </div>
        </div>

        {/* Points Balance */}
        <div className="glass-card p-6 mb-6 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Your Balance
              </p>
              <p className="text-4xl font-bold text-primary mt-1">
                {userPoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">points</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Pending Redemptions */}
        {pendingRedemptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
              <QrCode className="h-3.5 w-3.5" />
              Your Codes ({pendingRedemptions.length})
            </h2>
            <div className="space-y-3">
              {pendingRedemptions.map((redemption) => (
                <div key={redemption.id} className="glass-card p-4 border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{redemption.reward.name}</h3>
                      {redemption.reward.venue && (
                        <p className="text-[10px] text-muted-foreground">
                          {redemption.reward.venue.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-primary">
                        {redemption.redemption_code}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Expires {new Date(redemption.expires_at!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Rewards */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5" />
            Available Rewards
          </h2>
          {rewards.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No rewards available yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Check back soon for new rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={userPoints}
                />
              ))}
            </div>
          )}
        </div>

        {/* Link to referrals */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need more points?
          </p>
          <Link
            href="/referrals"
            className="text-primary text-sm font-semibold hover:underline"
          >
            Share events and earn points →
          </Link>
        </div>
      </div>
    </div>
  )
}
