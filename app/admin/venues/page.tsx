import { getAllVenues } from '@/lib/actions/admin'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VenueStatus } from '@/types/database'

const statusConfig: Record<
  VenueStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  approved: {
    label: 'Approved',
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#22c55e',
    dot: '#22c55e',
  },
  pending: {
    label: 'Pending',
    bg: 'rgba(234, 179, 8, 0.1)',
    text: '#eab308',
    dot: '#eab308',
  },
  rejected: {
    label: 'Rejected',
    bg: 'rgba(225, 29, 72, 0.1)',
    text: '#e11d48',
    dot: '#e11d48',
  },
  suspended: {
    label: 'Suspended',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
    dot: '#ef4444',
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function VenuesPage() {
  const venues = await getAllVenues()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Venues</h1>
          <p className="mt-1 text-sm text-white/50">
            All registered venues ({venues.length})
          </p>
        </div>
      </div>

      {/* Empty state */}
      {venues.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl py-16">
          <Building2 className="h-12 w-12 text-white/20" />
          <p className="mt-4 text-lg font-medium text-white/50">
            No venues yet
          </p>
          <p className="mt-1 text-sm text-white/30">
            Venues will appear here once applications are approved.
          </p>
        </div>
      )}

      {/* Venues table */}
      {venues.length > 0 && (
        <div className="glass-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    Venue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {venues.map((venue: Awaited<ReturnType<typeof getAllVenues>>[number]) => {
                  const status = statusConfig[venue.status as VenueStatus] ?? statusConfig.pending

                  return (
                    <tr
                      key={venue.id}
                      className="transition-colors duration-150 hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: 'rgba(168, 85, 247, 0.1)',
                              border: '1px solid rgba(168, 85, 247, 0.2)',
                            }}
                          >
                            <Building2
                              className="h-4 w-4"
                              style={{ color: '#a855f7' }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {venue.name}
                            </p>
                            {venue.venue_type && (
                              <p className="text-xs text-white/30">
                                {venue.venue_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {venue.city}, {venue.state}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: status.bg,
                            color: status.text,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: status.dot }}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-white/60">
                            {venue.owner?.full_name ?? 'Unknown'}
                          </p>
                          <p className="text-xs text-white/30">
                            {venue.owner?.email ?? ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/40">
                        {formatDate(venue.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
