'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PromoterTierConfig, PromoterApplication, User, PayoutRequest } from '@/types/database'

// ============================================
// PROMOTER TIER INFO
// ============================================

export async function getPromoterTierConfig(): Promise<PromoterTierConfig[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promoter_tier_config')
    .select('*')
    .order('min_points', { ascending: true })

  if (error) {
    // Return defaults if table doesn't exist yet
    return [
      { tier: 'bronze', min_points: 0, commission_rate: 5, perks: ['Basic referral tracking'] },
      { tier: 'silver', min_points: 500, commission_rate: 7.5, perks: ['Basic referral tracking', 'Priority support', 'Monthly stats email'] },
      { tier: 'gold', min_points: 2000, commission_rate: 10, perks: ['Basic referral tracking', 'Priority support', 'Monthly stats email', 'Exclusive events access', 'Custom referral page'] },
      { tier: 'platinum', min_points: 5000, commission_rate: 15, perks: ['Basic referral tracking', 'Priority support', 'Monthly stats email', 'Exclusive events access', 'Custom referral page', 'Direct venue connections', 'VIP at partner venues'] },
    ]
  }

  return (data || []) as PromoterTierConfig[]
}

export async function getMyPromoterStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('referral_points, promoter_tier, promoter_commission_rate, total_earnings, pending_payout')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Get tier configs
  const tiers = await getPromoterTierConfig()
  const currentTier = tiers.find(t => t.tier === profile.promoter_tier) || tiers[0]
  const nextTier = tiers.find(t => t.min_points > profile.referral_points)

  // Calculate progress to next tier
  let progressToNext = 100
  let pointsToNext = 0
  if (nextTier) {
    pointsToNext = nextTier.min_points - profile.referral_points
    const prevTierPoints = currentTier.min_points
    progressToNext = Math.round(
      ((profile.referral_points - prevTierPoints) / (nextTier.min_points - prevTierPoints)) * 100
    )
  }

  return {
    ...profile,
    current_tier_config: currentTier,
    next_tier: nextTier || null,
    points_to_next_tier: pointsToNext,
    progress_percent: progressToNext,
  }
}

// ============================================
// PROMOTER LEADERBOARD
// ============================================

export async function getGlobalPromoterLeaderboard(limit: number = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, referral_points, promoter_tier')
    .gt('referral_points', 0)
    .order('referral_points', { ascending: false })
    .limit(limit)

  if (error) return []
  return data || []
}

export async function getPromoterStats(userId: string) {
  const supabase = await createClient()

  // Get referral breakdown
  const { data: referrals } = await supabase
    .from('referrals')
    .select('action, points_awarded, created_at, event:events(name), venue:venues(name)')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (!referrals) return null

  // Calculate stats
  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  const thisMonth = referrals.filter(r => new Date(r.created_at) >= last30Days)
  const rsvpReferrals = referrals.filter(r => r.action === 'rsvp')
  const signupReferrals = referrals.filter(r => r.action === 'signup')

  // Group by month for chart
  const monthlyStats: Record<string, { rsvps: number; signups: number; points: number }> = {}
  for (const ref of referrals) {
    const month = new Date(ref.created_at).toISOString().slice(0, 7) // YYYY-MM
    if (!monthlyStats[month]) monthlyStats[month] = { rsvps: 0, signups: 0, points: 0 }
    if (ref.action === 'rsvp') monthlyStats[month].rsvps++
    else monthlyStats[month].signups++
    monthlyStats[month].points += ref.points_awarded
  }

  return {
    total_referrals: referrals.length,
    total_rsvps: rsvpReferrals.length,
    total_signups: signupReferrals.length,
    this_month_referrals: thisMonth.length,
    this_month_points: thisMonth.reduce((sum, r) => sum + r.points_awarded, 0),
    monthly_breakdown: Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12), // Last 12 months
    recent_referrals: referrals.slice(0, 10),
  }
}

// ============================================
// PROMOTER RANKINGS
// ============================================

export async function getMyPromoterRank(): Promise<number | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's points
  const { data: profile } = await supabase
    .from('users')
    .select('referral_points')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Count users with more points
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .gt('referral_points', profile.referral_points)

  return (count || 0) + 1
}

// ============================================
// TOP PROMOTERS BY VENUE
// ============================================

export async function getTopPromotersForVenue(venueId: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('referrals')
    .select(`
      referrer_id,
      points_awarded,
      referrer:users!referrals_referrer_id_fkey(id, full_name, avatar_url, promoter_tier)
    `)
    .eq('venue_id', venueId)

  if (error || !data) return []

  // Aggregate by referrer
  const aggregated: Record<string, {
    referrer_id: string
    full_name: string | null
    avatar_url: string | null
    promoter_tier: string
    total_points: number
    referral_count: number
  }> = {}

  for (const ref of data) {
    const referrer = ref.referrer as unknown as { id: string; full_name: string | null; avatar_url: string | null; promoter_tier: string }
    if (!aggregated[ref.referrer_id]) {
      aggregated[ref.referrer_id] = {
        referrer_id: ref.referrer_id,
        full_name: referrer?.full_name || null,
        avatar_url: referrer?.avatar_url || null,
        promoter_tier: referrer?.promoter_tier || 'bronze',
        total_points: 0,
        referral_count: 0,
      }
    }
    aggregated[ref.referrer_id].total_points += ref.points_awarded
    aggregated[ref.referrer_id].referral_count++
  }

  return Object.values(aggregated)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit)
}

// ============================================
// PROMOTER APPLICATIONS
// ============================================

export async function submitPromoterApplication(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to apply.' }

  const input = {
    user_id: user.id,
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    instagram_handle: (formData.get('instagram_handle') as string) || null,
    tiktok_handle: (formData.get('tiktok_handle') as string) || null,
    experience: (formData.get('experience') as string) || null,
    why_join: formData.get('why_join') as string,
    audience_size: formData.get('audience_size') as string,
  }

  // Check for existing application
  const { data: existing } = await supabase
    .from('promoter_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return { error: 'You already have a pending application.' }
    }
    if (existing.status === 'approved') {
      return { error: 'You are already an approved promoter.' }
    }

    // Re-applying after rejection - update existing record
    const { error } = await supabase
      .from('promoter_applications')
      .update({
        ...input,
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        rejection_reason: null,
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidatePath('/promote')
    return { success: true }
  }

  // New application
  const { error } = await supabase
    .from('promoter_applications')
    .insert(input)

  if (error) return { error: error.message }
  revalidatePath('/promote')
  return { success: true }
}

export async function getMyPromoterApplication(): Promise<PromoterApplication | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('promoter_applications')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data as PromoterApplication
}

// ============================================
// PROMOTER PAYOUTS
// ============================================

export async function requestPayout(amount: number, paymentEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify user is an approved promoter
  const { data: profile } = await supabase
    .from('users')
    .select('is_promoter, pending_payout')
    .eq('id', user.id)
    .single()

  if (!profile?.is_promoter) return { error: 'You must be an approved promoter' }
  if (amount <= 0) return { error: 'Invalid payout amount' }
  if (amount > (profile.pending_payout || 0)) return { error: 'Insufficient balance' }

  // Check for existing pending payout
  const { data: existing } = await supabase
    .from('payout_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()

  if (existing) return { error: 'You already have a pending payout request' }

  const { error } = await supabase
    .from('payout_requests')
    .insert({
      user_id: user.id,
      amount,
      payment_email: paymentEmail,
      payment_method: 'paypal',
    })

  if (error) return { error: error.message }

  // Update user's payment email
  await supabase
    .from('users')
    .update({ payment_email: paymentEmail })
    .eq('id', user.id)

  revalidatePath('/promote')
  return { success: true }
}

export async function getMyPayoutRequests(): Promise<PayoutRequest[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data || []) as PayoutRequest[]
}

export async function getMyPaymentEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('payment_email')
    .eq('id', user.id)
    .single()

  return data?.payment_email || null
}
