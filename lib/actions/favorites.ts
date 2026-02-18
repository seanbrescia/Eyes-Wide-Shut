'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FavoriteVenueWithDetails } from '@/types/database'

export async function favoriteVenue(venueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('favorite_venues')
    .insert({ user_id: user.id, venue_id: venueId })

  if (error) {
    // Unique constraint violation means already favorited
    if (error.code === '23505') {
      return { success: true, alreadyFavorited: true }
    }
    console.error('[Favorites] Error favoriting venue:', error)
    return { error: 'Failed to favorite venue' }
  }

  revalidatePath(`/venue/${venueId}`)
  return { success: true }
}

export async function unfavoriteVenue(venueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('favorite_venues')
    .delete()
    .eq('user_id', user.id)
    .eq('venue_id', venueId)

  if (error) {
    console.error('[Favorites] Error unfavoriting venue:', error)
    return { error: 'Failed to unfavorite venue' }
  }

  revalidatePath(`/venue/${venueId}`)
  return { success: true }
}

export async function isVenueFavorited(venueId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('favorite_venues')
    .select('id')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .maybeSingle()

  if (error) {
    console.error('[Favorites] Error checking favorite status:', error)
    return false
  }

  return !!data
}

export async function getMyFavoriteVenues(): Promise<FavoriteVenueWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('favorite_venues')
    .select(`
      *,
      venue:venues(id, name, slug, cover_photo_url, city, state, venue_type)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Favorites] Error fetching favorites:', error)
    return []
  }

  return (data || []) as FavoriteVenueWithDetails[]
}
