'use client'

import { Crown, Star, Award, Medal } from 'lucide-react'
import type { PromoterTier, PromoterTierConfig } from '@/types/database'
import { cn } from '@/lib/utils/cn'

const TIER_STYLES: Record<PromoterTier, { icon: typeof Crown; color: string; bg: string }> = {
  bronze: { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  silver: { icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  gold: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  platinum: { icon: Crown, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
}

interface TierCardProps {
  currentTier: PromoterTier
  tierConfig: PromoterTierConfig
  points: number
  nextTier: PromoterTierConfig | null
  pointsToNext: number
  progressPercent: number
}

export function TierCard({
  currentTier,
  tierConfig,
  points,
  nextTier,
  pointsToNext,
  progressPercent,
}: TierCardProps) {
  const style = TIER_STYLES[currentTier]
  const Icon = style.icon

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', style.bg)}>
            <Icon className={cn('h-6 w-6', style.color)} />
          </div>
          <div>
            <h3 className={cn('text-lg font-bold capitalize', style.color)}>{currentTier}</h3>
            <p className="text-xs text-muted-foreground">Promoter Tier</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{points.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
        </div>
      </div>

      {/* Commission Rate */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Commission Rate</span>
          <span className="text-lg font-bold text-primary">{tierConfig.commission_rate}%</span>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress to {nextTier.tier}</span>
            <span className="font-semibold">{pointsToNext} pts to go</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Perks */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Your Perks
        </h4>
        <ul className="space-y-1">
          {tierConfig.perks.map((perk, i) => (
            <li key={i} className="text-xs flex items-center gap-2">
              <span className={cn('w-1.5 h-1.5 rounded-full', style.bg, style.color.replace('text-', 'bg-'))} />
              {perk}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Mini version for display in other places
export function TierBadge({ tier }: { tier: PromoterTier }) {
  const style = TIER_STYLES[tier]
  const Icon = style.icon

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', style.bg, style.color)}>
      <Icon className="h-3 w-3" />
      {tier}
    </span>
  )
}
