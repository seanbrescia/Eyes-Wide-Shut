'use client'

import { Eye, Ticket, UserCheck, TrendingUp, Users } from 'lucide-react'
import type { VenueAnalytics } from '@/types/database'

interface StatsGridProps {
  analytics: VenueAnalytics
}

export function StatsGrid({ analytics }: StatsGridProps) {
  const stats = [
    {
      label: 'Total Views',
      value: analytics.total_views,
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'RSVPs / Tickets',
      value: analytics.total_rsvps,
      icon: Ticket,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/10',
    },
    {
      label: 'Check-ins',
      value: analytics.total_check_ins,
      icon: UserCheck,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Conversion Rate',
      value: `${analytics.conversion_rate}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Avg Crowd Level',
      value: analytics.avg_crowd_level?.toFixed(1) || '0',
      icon: Users,
      color: 'text-neon-pink',
      bg: 'bg-neon-pink/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-4">
          <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
