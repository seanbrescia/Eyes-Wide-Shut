// Promotion tiers and pricing
export const PROMOTION_TIERS = {
  hot_spot: {
    name: "Tonight's Hot Spot",
    price: 50,
    duration_hours: 12,
    priority: 100,
    description: 'Top placement on map and explore page for tonight',
  },
  featured: {
    name: 'Featured Venue',
    price: 150,
    duration_hours: 72,
    priority: 50,
    description: 'Highlighted for 3 days with special badge',
  },
  premium: {
    name: 'Premium Listing',
    price: 400,
    duration_hours: 168,
    priority: 25,
    description: 'Week-long premium placement and push notification',
  },
} as const

export type PromotionTier = keyof typeof PROMOTION_TIERS
