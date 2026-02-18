import { getApprovedVenues } from '@/lib/actions/venue'
import { getFeaturedEvents } from '@/lib/actions/event'
import { MapView } from '../map-view'

export const metadata = {
  title: 'Explore | Eyes Wide Shut',
}

export default async function MapPage() {
  const [venues, featuredEvents] = await Promise.all([
    getApprovedVenues(),
    getFeaturedEvents(),
  ])

  return <MapView venues={venues} featuredEvents={featuredEvents} />
}
