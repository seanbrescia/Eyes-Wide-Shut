'use client'

import { useState, useEffect } from 'react'
import { getMyVenue } from '@/lib/actions/venue'
import {
  QrCode,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Users,
  Ticket,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TicketResult {
  id: string
  confirmation_code: string
  quantity: number
  checked_in: boolean
  checked_in_at: string | null
  user: {
    full_name: string | null
    email: string
  }
  event: {
    name: string
    date: string
  }
}

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    ticket?: TicketResult
  } | null>(null)
  const [todayStats, setTodayStats] = useState({ checkedIn: 0, total: 0 })
  const [venueId, setVenueId] = useState<string | null>(null)

  useEffect(() => {
    loadVenue()
  }, [])

  async function loadVenue() {
    const venue = await getMyVenue()
    if (venue) {
      setVenueId(venue.id)
      loadTodayStats(venue.id)
    }
  }

  async function loadTodayStats(vid: string) {
    const res = await fetch(`/api/venue/check-in/stats?venueId=${vid}`)
    if (res.ok) {
      const data = await res.json()
      setTodayStats(data)
    }
  }

  async function handleCheckIn() {
    if (!code.trim() || !venueId) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/venue/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), venueId }),
      })

      const data = await res.json()
      setResult(data)

      if (data.success) {
        setCode('')
        loadTodayStats(venueId)
      }
    } catch {
      setResult({ success: false, message: 'Failed to check in' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Check-In</h1>
        <p className="mt-1 text-sm text-white/50">
          Scan tickets or enter confirmation codes
        </p>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{todayStats.checkedIn}</p>
            <p className="text-xs text-white/50">Checked In</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{todayStats.total}</p>
            <p className="text-xs text-white/50">Total Tickets</p>
          </div>
        </div>
      </div>

      {/* Manual entry */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Enter Confirmation Code
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
            placeholder="XXXXXXXX"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xl font-mono tracking-[0.2em] text-center text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
            maxLength={8}
          />
          <button
            onClick={handleCheckIn}
            disabled={loading || !code.trim()}
            className={cn(
              'px-6 py-3 rounded-xl font-semibold text-sm btn-neon',
              (loading || !code.trim()) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Check In'
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={cn(
            'glass-card p-6 animate-fade-in',
            result.success
              ? 'border-green-500/30'
              : 'border-destructive/30'
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                result.success ? 'bg-green-500/20' : 'bg-destructive/20'
              )}
            >
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={cn(
                  'text-lg font-bold',
                  result.success ? 'text-green-500' : 'text-destructive'
                )}
              >
                {result.success ? 'Checked In!' : 'Check-In Failed'}
              </p>
              <p className="text-sm text-white/60 mt-1">{result.message}</p>

              {result.ticket && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <p className="text-sm">
                    <span className="text-white/50">Guest:</span>{' '}
                    <span className="font-semibold text-white">
                      {result.ticket.user?.full_name || result.ticket.user?.email}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-white/50">Event:</span>{' '}
                    <span className="text-white">{result.ticket.event?.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-white/50">Tickets:</span>{' '}
                    <span className="text-white">{result.ticket.quantity}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner placeholder */}
      <div className="glass-card p-8 text-center mt-6">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-8 h-8 text-white/30" />
        </div>
        <p className="text-sm text-white/50">
          QR code scanning coming soon
        </p>
        <p className="text-xs text-white/30 mt-1">
          For now, enter codes manually above
        </p>
      </div>
    </div>
  )
}
