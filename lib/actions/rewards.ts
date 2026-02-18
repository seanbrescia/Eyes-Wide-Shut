'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Reward, RewardWithVenue, RedemptionWithReward } from '@/types/database'

// ============================================
// BROWSE REWARDS
// ============================================

export async function getAvailableRewards(venueId?: string): Promise<RewardWithVenue[]> {
  const supabase = await createClient()

  let query = supabase
    .from('rewards')
    .select(`
      *,
      venue:venues(id, name)
    `)
    .eq('is_active', true)
    .or('expires_at.is.null,expires_at.gt.now()')

  if (venueId) {
    query = query.or(`venue_id.eq.${venueId},venue_id.is.null`)
  }

  const { data, error } = await query.order('points_cost', { ascending: true })

  if (error) return []
  return (data || []) as RewardWithVenue[]
}

export async function getRewardById(rewardId: string): Promise<RewardWithVenue | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      venue:venues(id, name)
    `)
    .eq('id', rewardId)
    .single()

  if (error) return null
  return data as RewardWithVenue
}

// ============================================
// REDEEM REWARDS
// ============================================

export async function redeemReward(rewardId: string): Promise<{ redemption?: RedemptionWithReward; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get user's points
  const { data: profile } = await supabase
    .from('users')
    .select('referral_points')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'User not found' }

  // Get reward details
  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('is_active', true)
    .single()

  if (!reward) return { error: 'Reward not found or inactive' }

  // Check points
  if (profile.referral_points < reward.points_cost) {
    return { error: `Not enough points. Need ${reward.points_cost}, have ${profile.referral_points}` }
  }

  // Check availability
  if (reward.quantity_available !== null && reward.quantity_redeemed >= reward.quantity_available) {
    return { error: 'Reward is sold out' }
  }

  // Check expiry
  if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
    return { error: 'Reward has expired' }
  }

  // Generate redemption code
  const redemptionCode = generateCode()

  // Calculate expiry (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Create redemption
  const { data: redemption, error: insertError } = await supabase
    .from('reward_redemptions')
    .insert({
      user_id: user.id,
      reward_id: rewardId,
      points_spent: reward.points_cost,
      redemption_code: redemptionCode,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select(`
      *,
      reward:rewards(*, venue:venues(id, name))
    `)
    .single()

  if (insertError) {
    console.error('[Rewards] Redemption error:', insertError)
    return { error: 'Failed to redeem reward' }
  }

  // Deduct points
  await supabase
    .from('users')
    .update({ referral_points: profile.referral_points - reward.points_cost })
    .eq('id', user.id)

  // Increment redeemed count
  await supabase
    .from('rewards')
    .update({ quantity_redeemed: reward.quantity_redeemed + 1 })
    .eq('id', rewardId)

  revalidatePath('/referrals')
  revalidatePath('/rewards')

  return { redemption: redemption as RedemptionWithReward }
}

// ============================================
// USER REDEMPTIONS
// ============================================

export async function getMyRedemptions(): Promise<RedemptionWithReward[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reward_redemptions')
    .select(`
      *,
      reward:rewards(*, venue:venues(id, name))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as RedemptionWithReward[]
}

export async function getRedemptionByCode(code: string): Promise<RedemptionWithReward | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reward_redemptions')
    .select(`
      *,
      reward:rewards(*, venue:venues(id, name))
    `)
    .eq('redemption_code', code.toUpperCase())
    .single()

  if (error) return null
  return data as RedemptionWithReward
}

// ============================================
// VENUE: MANAGE REWARDS
// ============================================

export async function createReward(reward: {
  name: string
  description?: string
  points_cost: number
  reward_type: string
  quantity_available?: number
  expires_at?: string
}): Promise<{ reward?: Reward; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get user's venue
  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!venue) return { error: 'No venue found' }

  const { data, error } = await supabase
    .from('rewards')
    .insert({
      venue_id: venue.id,
      name: reward.name,
      description: reward.description || null,
      points_cost: reward.points_cost,
      reward_type: reward.reward_type,
      quantity_available: reward.quantity_available || null,
      expires_at: reward.expires_at || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create reward' }

  revalidatePath('/venue-portal/rewards')
  return { reward: data }
}

export async function updateReward(
  rewardId: string,
  updates: Partial<Pick<Reward, 'name' | 'description' | 'points_cost' | 'quantity_available' | 'is_active' | 'expires_at'>>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: reward } = await supabase
    .from('rewards')
    .select('venue_id')
    .eq('id', rewardId)
    .single()

  if (!reward) return { error: 'Reward not found' }

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('id', reward.venue_id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) return { error: 'Not authorized' }

  const { error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('id', rewardId)

  if (error) return { error: 'Failed to update reward' }

  revalidatePath('/venue-portal/rewards')
  return { success: true }
}

export async function getVenueRewards(): Promise<Reward[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!venue) return []

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// ============================================
// VENUE: VERIFY REDEMPTION
// ============================================

export async function verifyRedemption(code: string): Promise<{ redemption?: RedemptionWithReward; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get redemption
  const { data: redemption } = await supabase
    .from('reward_redemptions')
    .select(`
      *,
      reward:rewards(*, venue:venues(id, name, owner_id))
    `)
    .eq('redemption_code', code.toUpperCase())
    .single()

  if (!redemption) return { error: 'Invalid code' }

  const rewardData = redemption.reward as unknown as Reward & { venue: { id: string; name: string; owner_id: string } }

  // Check ownership (platform-wide rewards can be verified by any venue owner)
  if (rewardData.venue_id && rewardData.venue?.owner_id !== user.id) {
    return { error: 'Not authorized to verify this reward' }
  }

  if (redemption.status === 'used') {
    return { error: 'Code already used' }
  }

  if (redemption.status === 'expired' || (redemption.expires_at && new Date(redemption.expires_at) < new Date())) {
    return { error: 'Code has expired' }
  }

  return { redemption: redemption as RedemptionWithReward }
}

export async function markRedemptionUsed(code: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // First verify
  const verifyResult = await verifyRedemption(code)
  if (verifyResult.error) return { error: verifyResult.error }

  // Mark as used
  const { error } = await supabase
    .from('reward_redemptions')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('redemption_code', code.toUpperCase())

  if (error) return { error: 'Failed to mark as used' }

  return { success: true }
}

// ============================================
// HELPERS
// ============================================

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
