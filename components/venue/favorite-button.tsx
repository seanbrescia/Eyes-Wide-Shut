'use client'

import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { favoriteVenue, unfavoriteVenue } from '@/lib/actions/favorites'

interface FavoriteButtonProps {
  venueId: string
  initialFavorited: boolean
}

export function FavoriteButton({ venueId, initialFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      if (isFavorited) {
        const result = await unfavoriteVenue(venueId)
        if (result.success) {
          setIsFavorited(false)
        }
      } else {
        const result = await favoriteVenue(venueId)
        if (result.success) {
          setIsFavorited(true)
        }
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="glass-card p-2 rounded-full hover:border-primary/30 transition-all disabled:opacity-50"
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-foreground/70 hover:text-red-500'
        } ${isPending ? 'animate-pulse' : ''}`}
      />
    </button>
  )
}
