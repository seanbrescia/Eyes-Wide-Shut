'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FriendGoingToEvent, Squad, SquadWithMembers } from '@/types/database'

// ============================================
// FOLLOW SYSTEM
// ============================================

export async function followUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === userId) return { error: 'Cannot follow yourself' }

  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: user.id, following_id: userId })

  if (error) {
    if (error.code === '23505') return { error: 'Already following' }
    return { error: 'Failed to follow user' }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function unfollowUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId)

  if (error) return { error: 'Failed to unfollow user' }

  revalidatePath('/profile')
  return { success: true }
}

export async function getFollowers(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      id,
      created_at,
      follower:users!user_follows_follower_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getFollowing(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      id,
      created_at,
      following:users!user_follows_following_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function isFollowing(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single()

  return !!data
}

export async function getFollowCounts(userId: string) {
  const supabase = await createClient()

  const [followers, following] = await Promise.all([
    supabase.from('user_follows').select('id', { count: 'exact' }).eq('following_id', userId),
    supabase.from('user_follows').select('id', { count: 'exact' }).eq('follower_id', userId),
  ])

  return {
    followers: followers.count || 0,
    following: following.count || 0,
  }
}

// ============================================
// FRIENDS GOING TO EVENT
// ============================================

export async function getFriendsGoingToEvent(eventId: string): Promise<FriendGoingToEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_friends_going', { p_event_id: eventId, p_user_id: user.id })

  if (error) {
    console.error('[Social] Error getting friends going:', error)
    return []
  }

  return (data || []) as FriendGoingToEvent[]
}

export async function getAttendeesForEvent(eventId: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      user_id,
      user:users(id, full_name, avatar_url)
    `)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .limit(limit)

  if (error) return { attendees: [], total: 0 }

  // Get total count
  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .eq('event_id', eventId)
    .eq('status', 'confirmed')

  return {
    attendees: data || [],
    total: count || 0,
  }
}

// ============================================
// SQUADS (Group Planning)
// ============================================

export async function createSquad(name: string): Promise<{ squad?: Squad; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: squad, error } = await supabase
    .from('squads')
    .insert({ name, creator_id: user.id })
    .select()
    .single()

  if (error) return { error: 'Failed to create squad' }

  // Add creator as admin member
  await supabase
    .from('squad_members')
    .insert({ squad_id: squad.id, user_id: user.id, role: 'admin' })

  revalidatePath('/squads')
  return { squad }
}

export async function getMySquads(): Promise<SquadWithMembers[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('squad_members')
    .select(`
      squad:squads(
        id, name, creator_id, avatar_url, created_at,
        members:squad_members(
          id, user_id, role, joined_at,
          user:users(id, full_name, avatar_url)
        )
      )
    `)
    .eq('user_id', user.id)

  if (error) return []

  return (data || [])
    .map(d => d.squad)
    .filter(Boolean) as unknown as SquadWithMembers[]
}

export async function addSquadMember(squadId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify current user is squad admin
  const { data: membership } = await supabase
    .from('squad_members')
    .select('role')
    .eq('squad_id', squadId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    // Check if creator
    const { data: squad } = await supabase
      .from('squads')
      .select('creator_id')
      .eq('id', squadId)
      .single()

    if (!squad || squad.creator_id !== user.id) {
      return { error: 'Not authorized' }
    }
  }

  const { error } = await supabase
    .from('squad_members')
    .insert({ squad_id: squadId, user_id: userId, role: 'member' })

  if (error) {
    if (error.code === '23505') return { error: 'Already a member' }
    return { error: 'Failed to add member' }
  }

  revalidatePath('/squads')
  return { success: true }
}

export async function leaveSquad(squadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('squad_members')
    .delete()
    .eq('squad_id', squadId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to leave squad' }

  revalidatePath('/squads')
  return { success: true }
}

// ============================================
// ACTIVITY FEED
// ============================================

export async function getFriendActivity(limit: number = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get list of people I follow
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id)

  if (!following || following.length === 0) return []

  const followingIds = following.map(f => f.following_id)

  // Get their recent RSVPs/tickets
  const { data: activity, error } = await supabase
    .from('tickets')
    .select(`
      id,
      created_at,
      user:users(id, full_name, avatar_url),
      event:events(id, name, date, venue:venues(id, name))
    `)
    .in('user_id', followingIds)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return activity || []
}
