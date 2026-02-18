'use client'

import { useState } from 'react'
import { Copy, Check, Gift, UserPlus, Ticket } from 'lucide-react'
import type { ReferralStats } from '@/types/database'

interface ReferralStatsCardProps {
  stats: ReferralStats
}

export function ReferralStatsCard({ stats }: ReferralStatsCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(stats.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="space-y-4">
      {/* Points banner */}
      <div className="glass-card p-5 bg-gradient-to-br from-primary/10 via-transparent to-accent/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Your Points
            </p>
            <p className="text-2xl font-bold text-primary">
              {stats.total_points.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Referral code */}
      <div className="glass-card p-5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Your Referral Code
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 glass-card px-4 py-3 text-center">
            <span className="font-mono font-bold text-primary tracking-[0.3em] text-xl">
              {stats.referral_code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="glass-card p-3 hover:border-primary/30 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Share this code or use the share button on any event/venue page.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold">{stats.total_referrals}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Total
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center mx-auto mb-2">
            <Ticket className="h-4 w-4 text-neon-cyan" />
          </div>
          <p className="text-xl font-bold">{stats.rsvp_referrals}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            RSVPs
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-neon-pink/10 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="h-4 w-4 text-neon-pink" />
          </div>
          <p className="text-xl font-bold">{stats.signup_referrals}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Signups
          </p>
        </div>
      </div>
    </div>
  )
}
