import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getFriendActivity, getFollowing, getFollowCounts } from '@/lib/actions/social'
import { ActivityFeed } from '@/components/social/activity-feed'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [activity, following, counts] = await Promise.all([
    getFriendActivity(30),
    getFollowing(user.id),
    getFollowCounts(user.id),
  ])

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-sm text-muted-foreground">
              See what your friends are up to
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{counts.following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold">{counts.followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Friend Activity
          </h2>

          {following.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Find your friends</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Follow people to see where they&apos;re going
              </p>
              <Link
                href="/explore"
                className="btn-neon px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
              >
                Explore Events
              </Link>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ActivityFeed activities={activity as any} />
          )}
        </div>
      </div>
    </div>
  )
}
