'use client'

import { useState } from 'react'
import { Ticket, Loader2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BuyTicketButtonProps {
  eventId: string
  ticketPrice: number
  ticketsAvailable: number | null
  ticketsSold: number
  isLoggedIn: boolean
  referralCode?: string
  className?: string
}

export function BuyTicketButton({
  eventId,
  ticketPrice,
  ticketsAvailable,
  ticketsSold,
  isLoggedIn,
  referralCode,
  className,
}: BuyTicketButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = ticketsAvailable !== null ? ticketsAvailable - ticketsSold : null
  const isSoldOut = remaining !== null && remaining <= 0
  const maxQuantity = remaining !== null ? Math.min(remaining, 10) : 10

  const totalPrice = ticketPrice * quantity
  const platformFee = totalPrice * 0.10
  const totalWithFee = totalPrice // Fee is taken from venue, not customer

  async function handleBuyTickets() {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=/event/${eventId}`
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          quantity,
          referralCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (isSoldOut) {
    return (
      <div className={cn('glass-card p-4 text-center', className)}>
        <p className="text-destructive font-semibold">Sold Out</p>
        <p className="text-xs text-muted-foreground mt-1">
          All tickets have been claimed
        </p>
      </div>
    )
  }

  return (
    <div className={cn('glass-card p-4 space-y-4', className)}>
      {/* Price display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">
            ${ticketPrice.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">per ticket</p>
        </div>
        {remaining !== null && (
          <p className="text-sm text-muted-foreground">
            {remaining} left
          </p>
        )}
      </div>

      {/* Quantity selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Quantity</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-sm font-medium">Total</span>
        <span className="text-xl font-bold text-white">
          ${totalWithFee.toFixed(2)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Buy button */}
      <button
        onClick={handleBuyTickets}
        disabled={loading}
        className={cn(
          'w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 btn-neon',
          loading && 'opacity-60 cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Ticket className="w-4 h-4" />
            {isLoggedIn ? 'Buy Tickets' : 'Log in to Buy'}
          </>
        )}
      </button>

      {/* Security note */}
      <p className="text-[10px] text-center text-muted-foreground">
        Secure payment powered by Stripe
      </p>
    </div>
  )
}
