'use client'

import type { CrowdPatternData } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface CrowdHeatmapProps {
  data: CrowdPatternData[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function CrowdHeatmap({ data }: CrowdHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = new Map<string, number>()
  let maxLevel = 0

  for (const entry of data) {
    const key = `${entry.day_of_week}-${entry.hour}`
    dataMap.set(key, entry.avg_level)
    if (entry.avg_level > maxLevel) maxLevel = entry.avg_level
  }

  const getColor = (level: number) => {
    if (level === 0) return 'bg-secondary'
    const intensity = level / Math.max(maxLevel, 5)
    if (intensity < 0.25) return 'bg-green-500/30'
    if (intensity < 0.5) return 'bg-yellow-500/40'
    if (intensity < 0.75) return 'bg-orange-500/50'
    return 'bg-red-500/60'
  }

  // Only show relevant hours (6pm to 4am)
  const relevantHours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4]

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
        Crowd Patterns
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-10 shrink-0" />
            {relevantHours.map((hour) => (
              <div key={hour} className="flex-1 text-center text-[9px] text-muted-foreground">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Grid */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-10 text-[10px] text-muted-foreground font-medium shrink-0">
                {day}
              </div>
              {relevantHours.map((hour) => {
                const level = dataMap.get(`${dayIndex}-${hour}`) || 0
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={cn(
                      'flex-1 h-6 rounded-sm mx-0.5 transition-colors cursor-default',
                      getColor(level)
                    )}
                    title={`${day} ${hour}:00 - Level ${level.toFixed(1)}`}
                  />
                )
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 text-[9px] text-muted-foreground">
            <span>Quiet</span>
            <div className="flex gap-0.5">
              <div className="w-4 h-3 rounded-sm bg-green-500/30" />
              <div className="w-4 h-3 rounded-sm bg-yellow-500/40" />
              <div className="w-4 h-3 rounded-sm bg-orange-500/50" />
              <div className="w-4 h-3 rounded-sm bg-red-500/60" />
            </div>
            <span>Packed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
