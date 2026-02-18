'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Venue } from '@/types/database'
import { PROMOTION_TIERS, type PromotionTier } from '@/lib/constants/promotion'

// ============================================
// GET PROMOTED VENUES
// ============================================

export async function getPromotedVenues(): Promise<Venue[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('is_promoted', true)
    .gt('promotion_expires_at', new Date().toISOString())
    .eq('status', 'approved')
    .order('promotion_priority', { ascending: false })

  if (error) return []
  return data || []
}

export async function getTonightsHotSpot(): Promise<Venue | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('is_promoted', true)
    .eq('promotion_tier', 'hot_spot')
    .gt('promotion_expires_at', new Date().toISOString())
    .eq('status', 'approved')
    .order('promotion_priority', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

// ============================================
// ADMIN: MANAGE PROMOTIONS
// ============================================

export async function setVenuePromotion(
  venueId: string,
  tier: PromotionTier | null
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Not authorized' }

  if (tier === null) {
    // Remove promotion
    const { error } = await supabase
      .from('venues')
      .update({
        is_promoted: false,
        promotion_tier: null,
        promotion_expires_at: null,
        promotion_priority: 0,
      })
      .eq('id', venueId)

    if (error) return { error: 'Failed to remove promotion' }
  } else {
    // Set promotion
    const tierConfig = PROMOTION_TIERS[tier]
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + tierConfig.duration_hours)

    const { error } = await supabase
      .from('venues')
      .update({
        is_promoted: true,
        promotion_tier: tier,
        promotion_expires_at: expiresAt.toISOString(),
        promotion_priority: tierConfig.priority,
      })
      .eq('id', venueId)

    if (error) return { error: 'Failed to set promotion' }

    // Log the promotion (for tracking/billing)
    await supabase
      .from('promotion_purchases')
      .insert({
        venue_id: venueId,
        tier,
        amount_paid: tierConfig.price,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
  }

  revalidatePath('/admin/venues')
  revalidatePath('/map')
  revalidatePath('/explore')
  return { success: true }
}

// ============================================
// VENUE OWNER: REQUEST PROMOTION
// ============================================

export async function requestPromotion(
  tier: PromotionTier
): Promise<{ success?: boolean; checkout_url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get user's venue
  const { data: venue } = await supabase
    .from('venues')
    .select('id, name')
    .eq('owner_id', user.id)
    .eq('status', 'approved')
    .single()

  if (!venue) return { error: 'No approved venue found' }

  const tierConfig = PROMOTION_TIERS[tier]

  // For now, just return the tier info
  // In production, this would create a Stripe checkout session
  return {
    success: true,
    // checkout_url would be returned from Stripe
  }
}

// ============================================
// CHECK PROMOTION STATUS
// ============================================

export async function getMyPromotionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: venue } = await supabase
    .from('venues')
    .select('id, is_promoted, promotion_tier, promotion_expires_at, promotion_priority')
    .eq('owner_id', user.id)
    .single()

  if (!venue) return null

  // Get promotion history
  const { data: history } = await supabase
    .from('promotion_purchases')
    .select('*')
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    current: venue.is_promoted
      ? {
          tier: venue.promotion_tier,
          expires_at: venue.promotion_expires_at,
          priority: venue.promotion_priority,
        }
      : null,
    history: history || [],
    available_tiers: PROMOTION_TIERS,
  }
}

// ============================================
// AUTO-EXPIRE PROMOTIONS (for cron job)
// ============================================

export async function expirePromotions() {
  const supabase = await createClient()

  const { error } = await supabase
    .from('venues')
    .update({
      is_promoted: false,
      promotion_tier: null,
      promotion_expires_at: null,
      promotion_priority: 0,
    })
    .eq('is_promoted', true)
    .lt('promotion_expires_at', new Date().toISOString())

  if (error) {
    console.error('[Promotion] Error expiring promotions:', error)
    return { error: 'Failed to expire promotions' }
  }

  return { success: true }
}
