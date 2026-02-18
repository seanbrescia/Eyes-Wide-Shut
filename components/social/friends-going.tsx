'use client'

import Image from 'next/image'
import type { FriendGoingToEvent } from '@/types/database'

interface FriendsGoingProps {
  friends: FriendGoingToEvent[]
  totalAttendees: number
}

export function FriendsGoing({ friends, totalAttendees }: FriendsGoingProps) {
  if (friends.length === 0 && totalAttendees === 0) return null

  const displayFriends = friends.slice(0, 3)
  const remainingFriends = friends.length - displayFriends.length
  const othersCount = totalAttendees - friends.length

  return (
    <div className="flex items-center gap-2">
      {/* Avatar stack */}
      {displayFriends.length > 0 && (
        <div className="flex -space-x-2">
          {displayFriends.map((friend, index) => (
            <div
              key={friend.user_id}
              className="relative w-7 h-7 rounded-full border-2 border-background overflow-hidden"
              style={{ zIndex: displayFriends.length - index }}
            >
              {friend.avatar_url ? (
                <Image
                  src={friend.avatar_url}
                  alt={friend.full_name || 'User'}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">
                  {(friend.full_name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {(remainingFriends > 0 || othersCount > 0) && (
            <div className="relative w-7 h-7 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
              +{remainingFriends + othersCount}
            </div>
          )}
        </div>
      )}

      {/* Text */}
      <p className="text-xs text-muted-foreground">
        {friends.length > 0 ? (
          <>
            <span className="text-foreground font-medium">
              {displayFriends.map(f => f.full_name?.split(' ')[0] || 'Someone').join(', ')}
            </span>
            {remainingFriends > 0 && ` + ${remainingFriends} more`}
            {othersCount > 0 && ` and ${othersCount} others`}
            {' going'}
          </>
        ) : (
          <>{totalAttendees} going</>
        )}
      </p>
    </div>
  )
}
