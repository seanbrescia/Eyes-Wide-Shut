'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReferralStats, ReferralWithDetails, VenueReferralLeaderboardEntry } from '@/types/database'

export async function getMyReferralStats(): Promise<ReferralStats | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's referral code and points
  const { data: profile } = await supabase
    .from('users')
    .select('referral_code, referral_points')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Get referral history
  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer:users!referrals_referrer_id_fkey(id, full_name, email),
      referred:users!referrals_referred_id_fkey(id, full_name, email),
      event:events(id, name, date),
      venue:venues(id, name)
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const referralList = (referrals || []) as unknown as ReferralWithDetails[]

  return {
    referral_code: profile.referral_code || '',
    total_points: profile.referral_points || 0,
    total_referrals: referralList.length,
    rsvp_referrals: referralList.filter(r => r.action === 'rsvp').length,
    signup_referrals: referralList.filter(r => r.action === 'signup').length,
    referrals: referralList,
  }
}

export async function recordRSVPReferral(
  referralCode: string,
  eventId: string,
  ticketId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the referrer by code
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referralCode.toUpperCase())
    .single()

  if (!referrer) return { error: 'Invalid referral code' }

  // Prevent self-referral
  if (referrer.id === user.id) return { error: 'Cannot use your own referral code' }

  // Get the event's venue_id for context
  const { data: event } = await supabase
    .from('events')
    .select('venue_id')
    .eq('id', eventId)
    .single()

  // Insert referral record (unique constraint prevents duplicates)
  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      action: 'rsvp' as const,
      event_id: eventId,
      venue_id: event?.venue_id || null,
      ticket_id: ticketId,
      points_awarded: 25,
    })

  if (error) {
    // Unique constraint violation means already credited
    if (error.code === '23505') return { error: 'Referral already recorded' }
    console.error('[Referral] Error recording RSVP referral:', error)
    return { error: 'Failed to record referral' }
  }

  // Update the ticket with the referral code
  await supabase
    .from('tickets')
    .update({ referred_by_code: referralCode.toUpperCase() })
    .eq('id', ticketId)

  return { success: true }
}

export async function recordSignupReferral(
  referralCode: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the referrer by code
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referralCode.toUpperCase())
    .single()

  if (!referrer) return { error: 'Invalid referral code' }

  // Prevent self-referral
  if (referrer.id === user.id) return { error: 'Cannot use your own referral code' }

  // Insert referral record
  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      action: 'signup' as const,
      event_id: null,
      venue_id: null,
      ticket_id: null,
      points_awarded: 50,
    })

  if (error) {
    if (error.code === '23505') return { error: 'Signup referral already recorded' }
    console.error('[Referral] Error recording signup referral:', error)
    return { error: 'Failed to record referral' }
  }

  // Update the user's referred_by field
  await supabase
    .from('users')
    .update({ referred_by: referrer.id })
    .eq('id', user.id)

  return { success: true }
}

export async function getVenueReferralLeaderboard(
  venueId: string
): Promise<VenueReferralLeaderboardEntry[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_venue_referral_leaderboard', {
      p_venue_id: venueId,
      p_limit: 20,
    })

  if (error) {
    console.error('[Referral] Error fetching leaderboard:', error)
    return []
  }

  return (data || []) as VenueReferralLeaderboardEntry[]
}

export async function getEventReferralStats(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select(`
      *,
      referrer:users!referrals_referrer_id_fkey(id, full_name, email),
      referred:users!referrals_referred_id_fkey(id, full_name, email)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Referral] Error fetching event referral stats:', error)
    return null
  }

  return {
    total: referrals?.length || 0,
    total_points: referrals?.reduce((sum, r) => sum + r.points_awarded, 0) || 0,
    referrals: referrals || [],
  }
}
