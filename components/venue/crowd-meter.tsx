'use client'

import { cn } from '@/lib/utils/cn'
import { CROWD_LEVELS } from '@/lib/utils/constants'
import { getRelativeTime } from '@/lib/utils/dates'

interface CrowdMeterProps {
  level: number
  updatedAt?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function CrowdMeter({ level, updatedAt, size = 'md', showLabel = true }: CrowdMeterProps) {
  const crowdInfo = CROWD_LEVELS.find((c) => c.value === level) || CROWD_LEVELS[0]

  const barHeights = {
    sm: ['h-2', 'h-3', 'h-4', 'h-5', 'h-6'],
    md: ['h-3', 'h-5', 'h-7', 'h-9', 'h-11'],
    lg: ['h-4', 'h-7', 'h-10', 'h-13', 'h-16'],
  }

  const barWidth = {
    sm: 'w-1.5',
    md: 'w-2.5',
    lg: 'w-3',
  }

  const gap = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  }

  return (
    <div className="flex flex-col items-center">
      <div className={cn('flex items-end', gap[size])}>
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={cn(
              barWidth[size],
              barHeights[size][bar - 1],
              'rounded-full crowd-bar',
              bar <= level ? 'opacity-100' : 'opacity-20'
            )}
            style={{
              backgroundColor: bar <= level ? crowdInfo.color : '#2a2a3e',
              boxShadow: bar <= level ? `0 0 8px ${crowdInfo.color}60` : 'none',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <div className="mt-1.5 text-center">
          <p
            className={cn(
              'font-semibold',
              size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
            )}
            style={{ color: crowdInfo.color }}
          >
            {crowdInfo.label}
          </p>
          {updatedAt && (
            <p className="text-[10px] text-muted-foreground">
              {getRelativeTime(updatedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
