import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getGlobalPromoterLeaderboard, getMyPromoterRank } from '@/lib/actions/promoter'
import { TierBadge } from '@/components/promoter/tier-card'
import { ArrowLeft, Trophy, Medal, Award, Crown } from 'lucide-react'
import type { PromoterTier } from '@/types/database'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [leaderboard, myRank] = await Promise.all([
    getGlobalPromoterLeaderboard(50),
    user ? getMyPromoterRank() : null,
  ])

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Top promoters this month
            </p>
          </div>
        </div>

        {/* My Rank */}
        {user && myRank && (
          <div className="glass-card p-4 mb-6 border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Rank</span>
              <span className="text-2xl font-bold text-primary">#{myRank}</span>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          {leaderboard.map((promoter, index) => (
            <div
              key={promoter.id}
              className="glass-card p-4 flex items-center gap-4"
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {index === 0 ? (
                  <Crown className="h-6 w-6 text-yellow-400 mx-auto" />
                ) : index === 1 ? (
                  <Medal className="h-6 w-6 text-slate-400 mx-auto" />
                ) : index === 2 ? (
                  <Award className="h-6 w-6 text-amber-600 mx-auto" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                {promoter.avatar_url ? (
                  <Image
                    src={promoter.avatar_url}
                    alt={promoter.full_name || 'Promoter'}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                    {(promoter.full_name || 'P')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {promoter.full_name || 'Anonymous'}
                </p>
                <TierBadge tier={promoter.promoter_tier as PromoterTier} />
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">
                  {promoter.referral_points.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">points</p>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No promoters yet</p>
            <Link
              href="/referrals"
              className="text-primary text-sm font-semibold hover:underline mt-2 inline-block"
            >
              Start earning points →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
