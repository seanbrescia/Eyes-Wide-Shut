'use client'

import { useState, useEffect, useTransition } from 'react'
import { Wine, Plus, Loader2, Users, Calendar, CheckCircle, Clock, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { getMyVenuePackages, createVIPPackage, updateVIPPackage, getVenueReservations, updateReservationStatus } from '@/lib/actions/vip'
import type { VIPPackage, VIPReservationWithDetails } from '@/types/database'
import { cn } from '@/lib/utils/cn'

const STATUS_STYLES = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-green-400', label: 'Confirmed' },
  cancelled: { icon: XCircle, color: 'text-destructive', label: 'Cancelled' },
  completed: { icon: CheckCircle, color: 'text-muted-foreground', label: 'Completed' },
  no_show: { icon: XCircle, color: 'text-muted-foreground', label: 'No Show' },
}

export default function VenueVIPPage() {
  const [packages, setPackages] = useState<VIPPackage[]>([])
  const [reservations, setReservations] = useState<VIPReservationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'packages' | 'reservations'>('reservations')

  async function loadData() {
    const [pkgs, res] = await Promise.all([
      getMyVenuePackages(),
      getVenueReservations(),
    ])
    setPackages(pkgs)
    setReservations(res)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { loadData() }, [])

  async function handleCreatePackage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createVIPPackage({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        minSpend: parseFloat(formData.get('minSpend') as string),
        depositAmount: parseFloat(formData.get('depositAmount') as string),
        maxGuests: parseInt(formData.get('maxGuests') as string),
        includes: (formData.get('includes') as string)?.split(',').map(s => s.trim()).filter(Boolean),
      })

      if (result.package) {
        setShowForm(false)
        loadData()
      }
    })
  }

  async function togglePackage(pkg: VIPPackage) {
    startTransition(async () => {
      await updateVIPPackage(pkg.id, { is_active: !pkg.is_active })
      loadData()
    })
  }

  async function handleStatusChange(reservationId: string, status: 'confirmed' | 'cancelled' | 'completed' | 'no_show') {
    startTransition(async () => {
      await updateReservationStatus(reservationId, status)
      loadData()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const upcomingReservations = reservations.filter(r =>
    r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'no_show' &&
    new Date(r.date) >= new Date(new Date().toISOString().split('T')[0])
  )

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wine className="h-6 w-6 text-amber-400" />
            VIP / Bottle Service
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage packages and reservations
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-neon px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Package
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('reservations')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'reservations' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Reservations ({upcomingReservations.length})
        </button>
        <button
          onClick={() => setTab('packages')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            tab === 'packages' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
          )}
        >
          Packages ({packages.length})
        </button>
      </div>

      {/* Create Package Form */}
      {showForm && (
        <form onSubmit={handleCreatePackage} className="glass-card p-5 mb-8 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Create VIP Package
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Package Name <span className="text-destructive">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="VIP Table"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Max Guests <span className="text-destructive">*</span>
              </label>
              <input
                name="maxGuests"
                type="number"
                required
                min="1"
                defaultValue="6"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Minimum Spend ($) <span className="text-destructive">*</span>
              </label>
              <input
                name="minSpend"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="500"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Deposit Amount ($) <span className="text-destructive">*</span>
              </label>
              <input
                name="depositAmount"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="100"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Premium table with bottle service..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              What&apos;s Included
            </label>
            <input
              name="includes"
              type="text"
              placeholder="1 Premium Bottle, Mixers, Dedicated Server"
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Separate with commas</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="btn-neon px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Package
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reservations Tab */}
      {tab === 'reservations' && (
        <div>
          {upcomingReservations.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">No upcoming reservations</h2>
              <p className="text-sm text-muted-foreground">
                Reservations will appear here when customers book
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((res) => {
                const status = STATUS_STYLES[res.status]
                const StatusIcon = status.icon
                return (
                  <div key={res.id} className="glass-card p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xl font-bold text-amber-400 leading-none">
                          {new Date(res.date + 'T00:00:00').getDate()}
                        </span>
                        <span className="text-[9px] uppercase text-muted-foreground font-semibold">
                          {new Date(res.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">{res.guest_name}</h3>
                        <p className="text-xs text-muted-foreground">{res.guest_email}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {res.party_size}
                          </span>
                          <span>{res.package?.name || 'VIP'}</span>
                          <span className={cn('flex items-center gap-1', status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs text-primary">{res.confirmation_code}</p>
                        <p className="text-lg font-bold">${res.min_spend}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {res.deposit_paid ? 'Deposit paid' : 'No deposit'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {res.status === 'pending' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => handleStatusChange(res.id, 'confirmed')}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusChange(res.id, 'cancelled')}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-destructive/20 text-destructive hover:bg-destructive/30"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {res.status === 'confirmed' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => handleStatusChange(res.id, 'completed')}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleStatusChange(res.id, 'no_show')}
                          disabled={isPending}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          No Show
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Packages Tab */}
      {tab === 'packages' && (
        <div>
          {packages.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">No packages yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create VIP packages for customers to book
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-neon px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Package
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn('glass-card p-4 flex items-center gap-4', !pkg.is_active && 'opacity-50')}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center shrink-0">
                    <Wine className="h-6 w-6 text-amber-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{pkg.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Up to {pkg.max_guests}
                      </span>
                      <span>${pkg.deposit_amount} deposit</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">${pkg.min_spend}</p>
                    <p className="text-[10px] text-muted-foreground">min spend</p>
                  </div>

                  <button
                    onClick={() => togglePackage(pkg)}
                    disabled={isPending}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    {pkg.is_active ? (
                      <ToggleRight className="h-5 w-5 text-green-400" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
