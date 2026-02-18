// User roles
export type UserRole = 'consumer' | 'venue_owner' | 'admin'
export type VenueStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'
export type TicketStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'
export type ReferralAction = 'signup' | 'rsvp'
export type AudienceSize = 'under_1k' | '1k_5k' | '5k_10k' | '10k_50k' | '50k_plus'
export type PromoterTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type RewardType = 'free_cover' | 'drink_ticket' | 'vip_upgrade' | 'merch' | 'custom'
export type RedemptionStatus = 'pending' | 'used' | 'expired'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

// Users
export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  date_of_birth: string | null
  phone: string | null
  referral_code: string | null
  referral_points: number
  referred_by: string | null
  promoter_tier: PromoterTier
  promoter_commission_rate: number
  total_earnings: number
  pending_payout: number
  is_promoter: boolean
  created_at: string
  updated_at: string
}

// Promoter Applications
export interface PromoterApplication {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  city: string
  state: string
  instagram_handle: string | null
  tiktok_handle: string | null
  experience: string | null
  why_join: string
  audience_size: AudienceSize
  status: ApplicationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface PromoterApplicationWithUser extends PromoterApplication {
  user: Pick<User, 'full_name' | 'email'> | null
}

export const AUDIENCE_SIZE_LABELS: Record<AudienceSize, string> = {
  under_1k: 'Under 1,000',
  '1k_5k': '1,000 - 5,000',
  '5k_10k': '5,000 - 10,000',
  '10k_50k': '10,000 - 50,000',
  '50k_plus': '50,000+',
}

// Venues
export interface Venue {
  id: string
  owner_id: string
  name: string
  slug: string
  bio: string | null
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  instagram: string | null
  cover_photo_url: string | null
  photos: string[]
  promo_video_url: string | null
  is_eighteen_plus: boolean
  is_twenty_one_plus: boolean
  capacity: number | null
  venue_type: string | null
  hours: Record<string, { open: string; close: string }> | null
  status: VenueStatus
  approved_at: string | null
  approved_by: string | null
  current_crowd_level: number
  crowd_updated_at: string
  subscription_tier: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  is_promoted: boolean
  promotion_tier: string | null
  promotion_expires_at: string | null
  promotion_priority: number
  city_id: string | null
  created_at: string
  updated_at: string
}

// Venue Applications
export interface VenueApplication {
  id: string
  user_id: string
  venue_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  address: string
  city: string
  state: string
  zip_code: string
  venue_type: string | null
  description: string | null
  website: string | null
  instagram: string | null
  status: ApplicationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_venue_id: string | null
  created_at: string
  updated_at: string
}

// Events
export interface Event {
  id: string
  venue_id: string
  name: string
  description: string | null
  date: string
  start_time: string
  end_time: string | null
  artists: string[]
  cover_charge: number
  ticket_price: number | null
  ticket_count: number | null
  tickets_sold: number
  drink_specials: string[]
  flyer_url: string | null
  is_featured: boolean
  is_cancelled: boolean
  created_at: string
  updated_at: string
}

// Tickets
export interface Ticket {
  id: string
  user_id: string
  event_id: string
  quantity: number
  is_paid: boolean
  amount_paid: number
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  status: TicketStatus
  confirmation_code: string
  checked_in: boolean
  checked_in_at: string | null
  referred_by_code: string | null
  created_at: string
  updated_at: string
}

// Referrals
export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  action: ReferralAction
  event_id: string | null
  venue_id: string | null
  ticket_id: string | null
  points_awarded: number
  created_at: string
}

export interface ReferralWithDetails extends Referral {
  referrer: Pick<User, 'id' | 'full_name' | 'email'>
  referred: Pick<User, 'id' | 'full_name' | 'email'>
  event: Pick<Event, 'id' | 'name' | 'date'> | null
  venue: Pick<Venue, 'id' | 'name'> | null
}

export interface ReferralStats {
  referral_code: string
  total_points: number
  total_referrals: number
  rsvp_referrals: number
  signup_referrals: number
  referrals: ReferralWithDetails[]
}

export interface VenueReferralLeaderboardEntry {
  referrer_id: string
  full_name: string | null
  email: string
  rsvp_count: number
  signup_count: number
  total_points: number
}

// Crowd Meter History
export interface CrowdMeterEntry {
  id: string
  venue_id: string
  level: number
  recorded_by: string | null
  recorded_at: string
}

// Join types
export interface VenueWithEvents extends Venue {
  events: Event[]
}

export interface EventWithVenue extends Event {
  venue: Venue
}

export interface TicketWithEvent extends Ticket {
  event: EventWithVenue
}

export interface VenueApplicationWithUser extends VenueApplication {
  user: Pick<User, 'full_name' | 'email'>
}

// ============================================
// SOCIAL FEATURES
// ============================================

export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface UserWithFollowStatus extends User {
  is_following?: boolean
  followers_count?: number
  following_count?: number
}

export interface Squad {
  id: string
  name: string
  creator_id: string
  avatar_url: string | null
  created_at: string
}

export interface SquadMember {
  id: string
  squad_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface SquadWithMembers extends Squad {
  members: (SquadMember & { user: Pick<User, 'id' | 'full_name' | 'avatar_url'> })[]
}

export interface FriendGoingToEvent {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

// ============================================
// PROMOTER TIERS
// ============================================

export interface PromoterTierConfig {
  tier: PromoterTier
  min_points: number
  commission_rate: number
  perks: string[]
}

// ============================================
// LOYALTY / REWARDS
// ============================================

export interface Reward {
  id: string
  venue_id: string | null
  name: string
  description: string | null
  points_cost: number
  reward_type: RewardType
  quantity_available: number | null
  quantity_redeemed: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface RewardRedemption {
  id: string
  user_id: string
  reward_id: string
  points_spent: number
  redemption_code: string
  status: RedemptionStatus
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface RewardWithVenue extends Reward {
  venue: Pick<Venue, 'id' | 'name'> | null
}

export interface RedemptionWithReward extends RewardRedemption {
  reward: RewardWithVenue
}

// ============================================
// MULTI-CITY
// ============================================

export interface City {
  id: string
  name: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  timezone: string
  is_active: boolean
  ambassador_id: string | null
  created_at: string
}

export interface CityWithStats extends City {
  venue_count: number
  event_count: number
}

// ============================================
// ANALYTICS
// ============================================

export interface VenueView {
  id: string
  venue_id: string
  user_id: string | null
  viewed_at: string
}

export interface EventView {
  id: string
  event_id: string
  user_id: string | null
  viewed_at: string
}

export interface CheckIn {
  id: string
  venue_id: string
  user_id: string | null
  event_id: string | null
  checked_in_at: string
}

export interface VenueAnalytics {
  total_views: number
  total_rsvps: number
  total_check_ins: number
  conversion_rate: number
  avg_crowd_level: number
}

export interface CrowdPatternData {
  hour: number
  day_of_week: number
  avg_level: number
  count: number
}

export interface TrendingData {
  venue_type: string
  count: number
  avg_crowd: number
}

// ============================================
// PROMOTED LISTINGS
// ============================================

export interface PromotionPurchase {
  id: string
  venue_id: string
  tier: string
  amount_paid: number
  started_at: string
  expires_at: string
  created_at: string
}

// ============================================
// VIP / BOTTLE SERVICE
// ============================================

export interface VIPPackage {
  id: string
  venue_id: string
  name: string
  description: string | null
  min_spend: number
  deposit_amount: number
  max_guests: number
  includes: string[]
  photos: string[]
  is_active: boolean
  created_at: string
}

export interface VIPInventory {
  id: string
  package_id: string
  event_id: string | null
  date: string
  table_number: string | null
  total_available: number
  total_booked: number
  price_override: number | null
  created_at: string
}

export interface VIPReservation {
  id: string
  user_id: string
  venue_id: string
  package_id: string | null
  inventory_id: string | null
  event_id: string | null
  date: string
  party_size: number
  guest_name: string
  guest_email: string
  guest_phone: string | null
  special_requests: string | null
  min_spend: number
  deposit_amount: number
  deposit_paid: boolean
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  status: ReservationStatus
  confirmation_code: string
  confirmed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface VIPPackageWithVenue extends VIPPackage {
  venue: Pick<Venue, 'id' | 'name' | 'city' | 'state'>
}

export interface VIPReservationWithDetails extends VIPReservation {
  venue: Pick<Venue, 'id' | 'name' | 'address_line1' | 'city' | 'state'>
  package: VIPPackage | null
  event: Pick<Event, 'id' | 'name' | 'date'> | null
}

export interface AvailableVIP {
  package_id: string
  package_name: string
  description: string | null
  min_spend: number
  deposit_amount: number
  max_guests: number
  includes: string[]
  available_count: number
}

// ============================================
// PUSH NOTIFICATIONS & FAVORITES
// ============================================

export interface FavoriteVenue {
  id: string
  user_id: string
  venue_id: string
  created_at: string
}

export interface FavoriteVenueWithDetails extends FavoriteVenue {
  venue: Pick<Venue, 'id' | 'name' | 'slug' | 'cover_photo_url' | 'city' | 'state' | 'venue_type'>
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  created_at: string
  updated_at: string
}

// ============================================
// PROMOTER PAYOUTS
// ============================================

export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface PayoutRequest {
  id: string
  user_id: string
  amount: number
  status: PayoutStatus
  payment_method: string
  payment_email: string | null
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  paid_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface PayoutRequestWithUser extends PayoutRequest {
  user: Pick<User, 'full_name' | 'email' | 'promoter_tier' | 'total_earnings' | 'pending_payout'>
}

// ============================================
// REPORTING / ABUSE
// ============================================

export type ReportType = 'venue' | 'event' | 'user'
export type ReportReason = 'inappropriate' | 'spam' | 'harassment' | 'fraud' | 'safety' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  report_type: ReportType
  target_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface ReportWithReporter extends Report {
  reporter: Pick<User, 'full_name' | 'email'> | null
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate Content',
  spam: 'Spam',
  harassment: 'Harassment',
  fraud: 'Fraud / Scam',
  safety: 'Safety Concern',
  other: 'Other',
}
