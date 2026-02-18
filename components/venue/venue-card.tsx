import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Users } from 'lucide-react'
import { CrowdMeter } from './crowd-meter'
import { cn } from '@/lib/utils/cn'
import type { Venue } from '@/types/database'

interface VenueCardProps {
  venue: Venue
  className?: string
}

export function VenueCard({ venue, className }: VenueCardProps) {
  return (
    <Link href={`/venue/${venue.id}`}>
      <div
        className={cn(
          'glass-card overflow-hidden group cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
          className
        )}
      >
        {/* Cover Photo */}
        <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
          {venue.cover_photo_url ? (
            <Image
              src={venue.cover_photo_url}
              alt={venue.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Users className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Age badge */}
          {venue.is_twenty_one_plus && (
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded">
              21+
            </span>
          )}
          {!venue.is_twenty_one_plus && venue.is_eighteen_plus && (
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded">
              18+
            </span>
          )}

          {/* Venue type */}
          {venue.venue_type && (
            <span className="absolute top-3 left-3 text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded">
              {venue.venue_type}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground truncate">{venue.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {venue.city}, {venue.state}
                </span>
              </p>
            </div>
            <CrowdMeter level={venue.current_crowd_level} size="sm" showLabel={false} />
          </div>

          {venue.bio && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{venue.bio}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
