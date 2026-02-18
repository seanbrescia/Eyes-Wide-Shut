'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Users, Loader2, Wine, CreditCard } from 'lucide-react'
import { getVenueVIPPackages, getAvailableVIP, createVIPReservation } from '@/lib/actions/vip'
import { VIPPackageCard } from '@/components/vip/vip-package-card'
import type { VIPPackage, AvailableVIP } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VIPBookingPage({ params }: PageProps) {
  const router = useRouter()
  const [venueId, setVenueId] = useState<string>('')
  const [packages, setPackages] = useState<VIPPackage[]>([])
  const [available, setAvailable] = useState<AvailableVIP[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [date, setDate] = useState<string>('')
  const [partySize, setPartySize] = useState<number>(2)
  const [guestName, setGuestName] = useState<string>('')
  const [guestEmail, setGuestEmail] = useState<string>('')
  const [guestPhone, setGuestPhone] = useState<string>('')
  const [specialRequests, setSpecialRequests] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select')

  useEffect(() => {
    async function load() {
      const { id } = await params
      setVenueId(id)
      const pkgs = await getVenueVIPPackages(id)
      setPackages(pkgs)
      setLoading(false)
    }
    load()
  }, [params])

  useEffect(() => {
    async function loadAvailability() {
      if (!date || !venueId) return
      const avail = await getAvailableVIP(venueId, date)
      setAvailable(avail)
    }
    loadAvailability()
  }, [date, venueId])

  const selectedPkg = packages.find(p => p.id === selectedPackage)
  const availableForSelected = available.find(a => a.package_id === selectedPackage)

  async function handleSubmit() {
    if (!selectedPackage || !date || !guestName || !guestEmail) {
      setError('Please fill in all required fields')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createVIPReservation({
        venueId,
        packageId: selectedPackage,
        date,
        partySize,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        specialRequests: specialRequests || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.reservation) {
        // Redirect to checkout
        const checkoutRes = await fetch('/api/vip/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId: result.reservation.id }),
        })

        const checkoutData = await checkoutRes.json()
        if (checkoutData.url) {
          window.location.href = checkoutData.url
        } else {
          router.push(`/vip/${result.reservation.id}`)
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
          <Link href={`/venue/${venueId}`} className="glass-card p-2 rounded-full inline-flex mb-6">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="glass-card p-12 text-center">
            <Wine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">No VIP Available</h2>
            <p className="text-sm text-muted-foreground">
              This venue doesn&apos;t have VIP packages yet.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/venue/${venueId}`} className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">VIP Reservation</h1>
            <p className="text-sm text-muted-foreground">
              Book bottle service or a VIP table
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['select', 'details', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                step === s ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
              )}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-secondary" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="glass-card p-4 mb-6 border-destructive/30 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Package & Date */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Date picker */}
            <div className="glass-card p-5">
              <label className="block text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Packages */}
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                Select Package
              </h2>
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const avail = date ? available.find(a => a.package_id === pkg.id) : undefined
                  return (
                    <VIPPackageCard
                      key={pkg.id}
                      package={pkg}
                      availableCount={date ? (avail?.available_count || 0) : undefined}
                      selected={selectedPackage === pkg.id}
                      onSelect={() => setSelectedPackage(pkg.id)}
                    />
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => setStep('details')}
              disabled={!selectedPackage || !date}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-semibold text-sm btn-neon',
                (!selectedPackage || !date) && 'opacity-50 cursor-not-allowed'
              )}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Guest Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Reservation Details
              </h2>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Party Size <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                    min={1}
                    max={selectedPkg?.max_guests || 10}
                    className="w-20 bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-xs text-muted-foreground">
                    Max {selectedPkg?.max_guests} guests
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Name on Reservation <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Special Requests
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  placeholder="Birthday celebration, specific location preference, etc."
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!guestName || !guestEmail}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-semibold text-sm btn-neon',
                  (!guestName || !guestEmail) && 'opacity-50 cursor-not-allowed'
                )}
              >
                Review Reservation
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedPkg && (
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
                Reservation Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{new Date(date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Party Size</span>
                  <span className="font-semibold">{partySize} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-semibold">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold">{guestEmail}</span>
                </div>
              </div>

              <div className="border-t border-border mt-4 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum Spend</span>
                  <span className="font-semibold">${selectedPkg.min_spend.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-semibold">Deposit Due Now</span>
                  <span className="text-xl font-bold text-primary">
                    ${selectedPkg.deposit_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Deposit is applied toward your minimum spend. Remaining balance due night of.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl font-semibold text-sm btn-neon flex items-center justify-center gap-2',
                  isPending && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Pay ${selectedPkg.deposit_amount} Deposit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
