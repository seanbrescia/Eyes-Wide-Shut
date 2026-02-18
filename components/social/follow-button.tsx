'use client'

import { useState, useTransition } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { followUser, unfollowUser } from '@/lib/actions/social'
import { cn } from '@/lib/utils/cn'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  className?: string
}

export function FollowButton({ userId, isFollowing: initialFollowing, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        const result = await unfollowUser(userId)
        if (result.success) setIsFollowing(false)
      } else {
        const result = await followUser(userId)
        if (result.success) setIsFollowing(true)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors',
        isFollowing
          ? 'bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive'
          : 'btn-neon',
        isPending && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </button>
  )
}
