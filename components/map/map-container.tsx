'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGeolocation } from '@/lib/hooks/use-geolocation'
import { DEFAULT_CENTER, CROWD_LEVELS } from '@/lib/utils/constants'
import type { Venue } from '@/types/database'

interface MapContainerProps {
  venues: Venue[]
  onVenueClick?: (venue: Venue) => void
}

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Create custom marker icon based on crowd level
function createCrowdIcon(level: number) {
  const crowdInfo = CROWD_LEVELS.find((c) => c.value === level) || CROWD_LEVELS[0]

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${crowdInfo.color};
        border: 3px solid rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px ${crowdInfo.color}80;
        color: white;
        font-size: 12px;
        font-weight: 700;
      ">${level}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

// Component to handle map center updates
function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()

  useEffect(() => {
    if (lat !== DEFAULT_CENTER.lat || lng !== DEFAULT_CENTER.lng) {
      map.flyTo([lat, lng], 13)
    }
  }, [lat, lng, map])

  return null
}

const emptySubscribe = () => () => {}

export function MapContainerComponent({ venues, onVenueClick }: MapContainerProps) {
  const { lat, lng } = useGeolocation()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <div className="w-full h-full bg-secondary flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading map...</div>
      </div>
    )
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      className="w-full h-full"
      style={{ background: '#1a1a2e' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapCenterUpdater lat={lat} lng={lng} />

      {venues.map((venue) => {
        const crowdInfo = CROWD_LEVELS.find((c) => c.value === venue.current_crowd_level) || CROWD_LEVELS[0]

        return (
          <Marker
            key={venue.id}
            position={[venue.latitude, venue.longitude]}
            icon={createCrowdIcon(venue.current_crowd_level)}
            eventHandlers={{
              click: () => onVenueClick?.(venue),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px', padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: crowdInfo.color
                  }} />
                  <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {crowdInfo.label}
                  </span>
                  {venue.is_twenty_one_plus && (
                    <span style={{ fontSize: '10px', background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      21+
                    </span>
                  )}
                  {!venue.is_twenty_one_plus && venue.is_eighteen_plus && (
                    <span style={{ fontSize: '10px', background: '#f97316', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      18+
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {venue.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px 0' }}>
                  {venue.venue_type || 'Venue'} · {venue.city}, {venue.state}
                </p>
                <a
                  href={`/venue/${venue.id}`}
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  View Details
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

// Re-export with the same name for compatibility
export { MapContainerComponent as MapContainer }
