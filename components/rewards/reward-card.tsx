'use client'

import { useState, useTransition } from 'react'
import { Gift, Ticket, Wine, Crown, Star, Loader2 } from 'lucide-react'
import { redeemReward } from '@/lib/actions/rewards'
import type { RewardWithVenue } from '@/types/database'
import { cn } from '@/lib/utils/cn'

const REWARD_ICONS: Record<string, typeof Gift> = {
  free_cover: Ticket,
  drink_ticket: Wine,
  vip_upgrade: Crown,
  merch: Gift,
  custom: Star,
}

interface RewardCardProps {
  reward: RewardWithVenue
  userPoints: number
  onRedeem?: () => void
}

export function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const Icon = REWARD_ICONS[reward.reward_type] || Gift
  const canAfford = userPoints >= reward.points_cost
  const isAvailable = reward.quantity_available === null || reward.quantity_redeemed < reward.quantity_available

  async function handleRedeem() {
    if (!canAfford || !isAvailable) return

    setError(null)
    startTransition(async () => {
      const result = await redeemReward(reward.id)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        onRedeem?.()
      }
    })
  }

  if (success) {
    return (
      <div className="glass-card p-5 border-green-500/30 bg-green-500/5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <Gift className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="font-semibold text-green-400 mb-1">Redeemed!</h3>
          <p className="text-xs text-muted-foreground">Check your redemptions for the code</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'glass-card p-5 transition-colors',
      !canAfford && 'opacity-60',
      canAfford && isAvailable && 'hover:border-primary/30'
    )}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{reward.name}</h3>
          {reward.venue && (
            <p className="text-[10px] text-primary font-medium">{reward.venue.name}</p>
          )}
          {reward.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{reward.points_cost}</span>
              <span className="text-xs text-muted-foreground">points</span>
            </div>

            {!isAvailable ? (
              <span className="text-xs text-muted-foreground">Sold out</span>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={!canAfford || isPending}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  canAfford
                    ? 'btn-neon'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                )}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : canAfford ? (
                  'Redeem'
                ) : (
                  `Need ${reward.points_cost - userPoints} more`
                )}
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}

          {reward.quantity_available && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {reward.quantity_available - reward.quantity_redeemed} remaining
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
