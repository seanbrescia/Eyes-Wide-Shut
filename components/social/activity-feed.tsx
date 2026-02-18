'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'
import { formatEventDate } from '@/lib/utils/dates'

interface ActivityItem {
  id: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  event: {
    id: string
    name: string
    date: string
    venue: {
      id: string
      name: string
    }
  }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>No recent activity from friends</p>
        <p className="text-xs mt-1">Follow more people to see what they&apos;re up to</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const user = activity.user as { id: string; full_name: string | null; avatar_url: string | null }
        const event = activity.event as { id: string; name: string; date: string; venue: { id: string; name: string } }

        return (
          <div key={activity.id} className="glass-card p-4 flex items-start gap-3">
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                  {(user.full_name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{user.full_name || 'Someone'}</span>
                <span className="text-muted-foreground"> is going to </span>
                <Link href={`/event/${event.id}`} className="font-semibold text-primary hover:underline">
                  {event.name}
                </Link>
              </p>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatEventDate(event.date)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.venue.name}
                </span>
              </div>
            </div>

            {/* Time */}
            <span className="text-[10px] text-muted-foreground shrink-0">
              {getTimeAgo(new Date(activity.created_at))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString()
}
