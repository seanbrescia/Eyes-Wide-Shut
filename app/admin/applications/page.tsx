'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getApplications,
  approveApplication,
  rejectApplication,
} from '@/lib/actions/admin'
import type { VenueApplicationWithUser } from '@/types/database'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Send,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type TabStatus = 'pending' | 'approved' | 'rejected'

const tabs: { status: TabStatus; label: string; icon: typeof Clock }[] = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'approved', label: 'Approved', icon: CheckCircle2 },
  { status: 'rejected', label: 'Rejected', icon: XCircle },
]

export default function ApplicationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabStatus>('pending')
  const [applications, setApplications] = useState<VenueApplicationWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Per-application action state
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setActionError(null)

    getApplications(activeTab).then((data) => {
      if (!cancelled) {
        setApplications(data as VenueApplicationWithUser[])
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [activeTab])

  async function handleApprove(applicationId: string) {
    setApprovingId(applicationId)
    setActionError(null)
    try {
      const result = await approveApplication(applicationId)
      if (result.error) {
        setActionError(result.error)
      } else {
        // Remove from list and refresh
        setApplications((prev) => prev.filter((a) => a.id !== applicationId))
        startTransition(() => router.refresh())
      }
    } catch {
      setActionError('Failed to approve application')
    } finally {
      setApprovingId(null)
    }
  }

  async function handleReject(applicationId: string) {
    if (!rejectReason.trim()) return
    setActionError(null)
    try {
      const result = await rejectApplication(applicationId, rejectReason.trim())
      if (result.error) {
        setActionError(result.error)
      } else {
        setApplications((prev) => prev.filter((a) => a.id !== applicationId))
        setRejectingId(null)
        setRejectReason('')
        startTransition(() => router.refresh())
      }
    } catch {
      setActionError('Failed to reject application')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Applications</h1>
        <p className="mt-1 text-sm text-white/50">
          Review and manage venue applications
        </p>
      </div>

      {/* Error banner */}
      {actionError && (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            borderColor: 'rgba(225, 29, 72, 0.3)',
            color: '#e11d48',
          }}
        >
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === tab.status
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            )}
            style={
              activeTab === tab.status
                ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }
                : undefined
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: '#a855f7' }}
          />
          <p className="mt-3 text-sm text-white/40">Loading applications...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl py-16">
          <FileText className="h-12 w-12 text-white/20" />
          <p className="mt-4 text-lg font-medium text-white/50">
            No {activeTab} applications
          </p>
          <p className="mt-1 text-sm text-white/30">
            {activeTab === 'pending'
              ? 'All caught up! No applications waiting for review.'
              : `No ${activeTab} applications to display.`}
          </p>
        </div>
      )}

      {/* Application cards */}
      {!loading && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="glass-card rounded-xl p-6 transition-all duration-200 hover:border-white/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {app.venue_name}
                    </h3>
                    {app.venue_type && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(168, 85, 247, 0.15)',
                          color: '#a855f7',
                        }}
                      >
                        {app.venue_type}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
                    <span>
                      <span className="text-white/30">Contact:</span>{' '}
                      {app.contact_name}
                    </span>
                    <span>
                      <span className="text-white/30">Email:</span>{' '}
                      {app.contact_email}
                    </span>
                    <span>
                      <span className="text-white/30">Location:</span>{' '}
                      {app.city}, {app.state}
                    </span>
                    <span>
                      <span className="text-white/30">Submitted:</span>{' '}
                      {formatDate(app.created_at)}
                    </span>
                  </div>

                  {app.description && (
                    <p className="text-sm text-white/40 line-clamp-2">
                      {app.description}
                    </p>
                  )}

                  {app.rejection_reason && (
                    <p className="text-sm" style={{ color: '#e11d48' }}>
                      <span className="font-medium">Rejection reason:</span>{' '}
                      {app.rejection_reason}
                    </p>
                  )}
                </div>

                {/* Actions (only for pending) */}
                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2">
                    {/* Reject input or button */}
                    {rejectingId === app.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="w-56 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleReject(app.id)
                            if (e.key === 'Escape') {
                              setRejectingId(null)
                              setRejectReason('')
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={!rejectReason.trim()}
                          className="btn-neon flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all disabled:opacity-40"
                          style={{ backgroundColor: 'rgba(225, 29, 72, 0.2)' }}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null)
                            setRejectReason('')
                          }}
                          className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={approvingId === app.id}
                          className="btn-neon flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-60"
                          style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                        >
                          {approvingId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" style={{ color: '#22c55e' }} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(app.id)}
                          className="btn-neon flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
                          style={{ backgroundColor: 'rgba(225, 29, 72, 0.2)' }}
                        >
                          <XCircle className="h-4 w-4" style={{ color: '#e11d48' }} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
