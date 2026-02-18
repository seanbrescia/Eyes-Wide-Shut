'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Flame, MapPin, Users } from 'lucide-react'
import type { Venue } from '@/types/database'
import { CROWD_LEVELS } from '@/lib/utils/constants'

interface HotSpotBannerProps {
  venue: Venue
}

export function HotSpotBanner({ venue }: HotSpotBannerProps) {
  const crowdLevel = CROWD_LEVELS.find(c => c.value === venue.current_crowd_level)

  return (
    <Link href={`/venue/${venue.id}`}>
      <div className="glass-card p-4 border-neon-pink/50 bg-gradient-to-r from-neon-pink/10 to-primary/10 hover:border-neon-pink transition-colors">
        <div className="flex items-center gap-1 text-neon-pink text-[10px] font-bold uppercase tracking-wider mb-2">
          <Flame className="h-3 w-3" />
          Tonight&apos;s Hot Spot
        </div>

        <div className="flex items-center gap-4">
          {/* Venue Image */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
            {venue.cover_photo_url ? (
              <Image
                src={venue.cover_photo_url}
                alt={venue.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-pink/30 to-primary/30" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{venue.name}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {venue.city}
              </span>
              {crowdLevel && (
                <span className="flex items-center gap-1" style={{ color: crowdLevel.color }}>
                  <Users className="h-3 w-3" />
                  {crowdLevel.label}
                </span>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-neon-pink">→</div>
        </div>
      </div>
    </Link>
  )
}
