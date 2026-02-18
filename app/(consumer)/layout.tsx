import { Suspense } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReferralTracker } from '@/components/referral/referral-tracker'
import { VenueOwnerFab } from '@/components/layout/venue-owner-fab'
import { NotificationPrompt } from '@/components/notifications/notification-prompt'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <ReferralTracker />
      </Suspense>
      <main className="pb-16">{children}</main>
      <BottomNav />
      <VenueOwnerFab />
      <NotificationPrompt />
    </div>
  )
}
