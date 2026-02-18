export const VENUE_TYPES = [
  'Bar',
  'Club',
  'Lounge',
  'Rooftop',
  'Pub',
  'Brewery',
  'Wine Bar',
  'Sports Bar',
  'Dive Bar',
] as const

export const CROWD_LEVELS = [
  { value: 1, label: 'Dead', color: '#6b7280' },
  { value: 2, label: 'Chill', color: '#22c55e' },
  { value: 3, label: 'Moderate', color: '#eab308' },
  { value: 4, label: 'Busy', color: '#f97316' },
  { value: 5, label: 'Packed', color: '#ef4444' },
] as const

export const DEFAULT_CENTER = {
  lat: 41.0887,
  lng: -74.1438,
} // Mahwah, NJ

export const DEFAULT_ZOOM = 12

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export const APP_NAME = 'Eyes Wide Shut'
