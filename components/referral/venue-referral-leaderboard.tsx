'use client'

import { Trophy, Medal, Award, Users } from 'lucide-react'
import type { VenueReferralLeaderboardEntry } from '@/types/database'

interface VenueReferralLeaderboardProps {
  entries: VenueReferralLeaderboardEntry[]
}

export function VenueReferralLeaderboard({
  entries,
}: VenueReferralLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          No referrals yet. Share your venue to start building your leaderboard.
        </p>
      </div>
    )
  }

  const rankIcons = [Trophy, Medal, Award]
  const rankColors = ['text-yellow-400', 'text-gray-400', 'text-amber-600']

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const RankIcon = rankIcons[index] || null
        const rankColor = rankColors[index] || 'text-muted-foreground'

        return (
          <div
            key={entry.referrer_id}
            className="glass-card p-4 flex items-center gap-4"
          >
            {/* Rank */}
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              {RankIcon ? (
                <RankIcon className={`h-4 w-4 ${rankColor}`} />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
              )}
            </div>

            {/* Name & email */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {entry.full_name || 'Anonymous'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {entry.email}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-xs font-bold">{entry.rsvp_count}</p>
                <p className="text-[9px] text-muted-foreground uppercase">
                  RSVPs
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold">{entry.signup_count}</p>
                <p className="text-[9px] text-muted-foreground uppercase">
                  Signups
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-primary">
                  {entry.total_points}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase">
                  Points
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
