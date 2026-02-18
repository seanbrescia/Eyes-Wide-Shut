'use client'

import { useState, useTransition } from 'react'
import { updateVenueHours } from '@/lib/actions/venue'
import { DAYS_OF_WEEK } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import { Clock, Loader2, Check } from 'lucide-react'

type DayHours = { open: string; close: string } | null
type HoursMap = Record<string, DayHours>

interface HoursEditorProps {
  venueId: string
  currentHours: HoursMap | null
}

const TIME_OPTIONS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM',
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM',
]

function formatDayName(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1)
}

export function HoursEditor({ venueId, currentHours }: HoursEditorProps) {
  const [hours, setHours] = useState<HoursMap>(() => {
    const initial: HoursMap = {}
    for (const day of DAYS_OF_WEEK) {
      initial[day] = currentHours?.[day] || null
    }
    return initial
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(day: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: '8:00 PM', close: '2:00 AM' },
    }))
    setSaved(false)
  }

  function updateTime(day: string, field: 'open' | 'close', value: string) {
    setHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : null,
    }))
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)

    startTransition(async () => {
      // Filter out null days and format for database
      const cleanHours: Record<string, { open: string; close: string }> = {}
      for (const [day, dayHours] of Object.entries(hours)) {
        if (dayHours) {
          cleanHours[day] = dayHours
        }
      }

      const result = await updateVenueHours(venueId, cleanHours)

      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className={cn(
              'glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-3',
              !hours[day] && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-3 sm:w-32">
              <button
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  hours[day]
                    ? 'bg-primary border-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {hours[day] && <Check className="h-3 w-3 text-white" />}
              </button>
              <span className="font-medium text-sm">{formatDayName(day)}</span>
            </div>

            {hours[day] ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={hours[day]!.open}
                  onChange={(e) => updateTime(day, 'open', e.target.value)}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <span className="text-muted-foreground text-sm">to</span>
                <select
                  value={hours[day]!.close}
                  onChange={(e) => updateTime(day, 'close', e.target.value)}
                  className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">Closed</span>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className={cn(
          'w-full py-3 px-6 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2',
          saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'btn-neon neon-glow'
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="h-5 w-5" />
            Saved!
          </>
        ) : (
          <>
            <Clock className="h-5 w-5" />
            Save Hours
          </>
        )}
      </button>
    </div>
  )
}
