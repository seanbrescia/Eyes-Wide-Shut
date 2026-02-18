'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateCrowdLevel, getMyVenue } from '@/lib/actions/venue'
import { CROWD_LEVELS } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import { getRelativeTime } from '@/lib/utils/dates'
import {
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'

export default function CrowdMeterPage() {
  const [isPending, startTransition] = useTransition()
  const [currentLevel, setCurrentLevel] = useState<number>(0)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVenue() {
      const venue = await getMyVenue()
      if (venue) {
        setCurrentLevel(venue.current_crowd_level)
        setLastUpdated(venue.crowd_updated_at)
      }
      setLoading(false)
    }
    fetchVenue()
  }, [])

  function handleUpdate(level: number) {
    setFeedback(null)

    startTransition(async () => {
      const result = await updateCrowdLevel(level)

      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setCurrentLevel(level)
        setLastUpdated(new Date().toISOString())
        setFeedback({ type: 'success', message: 'Crowd level updated!' })
        setTimeout(() => setFeedback(null), 3000)
      }
    })
  }

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentConfig = CROWD_LEVELS.find((c) => c.value === currentLevel)

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Crowd Meter
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Let people know how busy your venue is right now
        </p>
      </div>

      {/* Current status */}
      <div className="glass-card p-6 mb-8 text-center neon-glow">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          Current Level
        </p>
        <p
          className="text-4xl font-bold mb-1"
          style={{ color: currentConfig?.color || '#6b7280' }}
        >
          {currentConfig?.label || 'Not Set'}
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated {getRelativeTime(lastUpdated)}
          </p>
        )}
      </div>

      {/* Level buttons */}
      <div className="space-y-3 mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Select Current Level
        </p>
        <div className="grid grid-cols-1 gap-3">
          {CROWD_LEVELS.map((level) => {
            const isActive = currentLevel === level.value
            return (
              <button
                key={level.value}
                onClick={() => handleUpdate(level.value)}
                disabled={isPending}
                className={cn(
                  'relative p-5 rounded-xl text-left transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed',
                  isActive
                    ? 'border-current glass-card'
                    : 'border-border/50 glass-card hover:border-border'
                )}
                style={{
                  borderColor: isActive ? level.color : undefined,
                  boxShadow: isActive
                    ? `0 0 20px ${level.color}30, 0 0 60px ${level.color}10`
                    : undefined,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Level number */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
                    style={{
                      backgroundColor: `${level.color}15`,
                      color: level.color,
                    }}
                  >
                    {level.value}
                  </div>

                  <div className="flex-1">
                    <p
                      className="text-lg font-bold"
                      style={{ color: isActive ? level.color : undefined }}
                    >
                      {level.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {level.value === 1 && 'Very few people, mostly empty'}
                      {level.value === 2 && 'Light crowd, plenty of space'}
                      {level.value === 3 && 'Decent turnout, filling up'}
                      {level.value === 4 && 'Getting crowded, limited space'}
                      {level.value === 5 && 'At capacity, wall to wall'}
                    </p>
                  </div>

                  {isActive && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${level.color}20` }}
                    >
                      <CheckCircle
                        className="h-4 w-4"
                        style={{ color: level.color }}
                      />
                    </div>
                  )}
                </div>

                {isPending && isActive && (
                  <div className="absolute inset-0 rounded-xl bg-background/50 flex items-center justify-center">
                    <Loader2
                      className="h-6 w-6 animate-spin"
                      style={{ color: level.color }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'glass-card p-4 flex items-center gap-3 animate-fade-in',
            feedback.type === 'success'
              ? 'border-green-500/30'
              : 'border-destructive/30'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          )}
          <p
            className={cn(
              'text-sm',
              feedback.type === 'success'
                ? 'text-green-400'
                : 'text-destructive'
            )}
          >
            {feedback.message}
          </p>
        </div>
      )}
    </div>
  )
}
