import { getApprovedVenues } from '@/lib/actions/venue'
import { getUpcomingEvents, getFeaturedEvents } from '@/lib/actions/event'
import { getTonightsHotSpot } from '@/lib/actions/promotion'
import { HomeView } from './home-view'

export default async function HomePage() {
  const [venues, events, featuredEvents, hotSpot] = await Promise.all([
    getApprovedVenues(),
    getUpcomingEvents('tonight'),
    getFeaturedEvents(),
    getTonightsHotSpot(),
  ])

  return (
    <HomeView
      venues={venues}
      tonightEvents={events}
      featuredEvents={featuredEvents}
      hotSpot={hotSpot}
    />
  )
}
