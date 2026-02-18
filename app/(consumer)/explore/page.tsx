import { getUpcomingEvents, getFeaturedEvents } from '@/lib/actions/event'
import { ExploreView } from './explore-view'

export const metadata = {
  title: 'Explore | Eyes Wide Shut',
}

export default async function ExplorePage() {
  const [events, featuredEvents] = await Promise.all([
    getUpcomingEvents('this-week'),
    getFeaturedEvents(),
  ])

  return <ExploreView initialEvents={events} featuredEvents={featuredEvents} />
}
