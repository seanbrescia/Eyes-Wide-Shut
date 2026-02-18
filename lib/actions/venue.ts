'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getApprovedVenues() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('status', 'approved')
    .order('name')

  if (error) {
    console.error('[Venues] Error fetching venues:', error)
    return []
  }

  return data || []
}

export async function getNearbyVenues(lat: number, lng: number, radiusMiles = 25) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_nearby_venues', {
    user_lat: lat,
    user_lng: lng,
    radius_miles: radiusMiles,
  })

  if (error) {
    console.error('[Venues] Error fetching nearby venues:', error)
    // Fallback to all approved venues
    return getApprovedVenues()
  }

  return data || []
}

export async function searchVenues(query: string, venueType?: string) {
  const supabase = await createClient()

  let q = supabase
    .from('venues')
    .select('*')
    .eq('status', 'approved')

  if (query) {
    q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%,bio.ilike.%${query}%`)
  }

  if (venueType) {
    q = q.eq('venue_type', venueType)
  }

  const { data, error } = await q.order('name').limit(30)

  if (error) {
    console.error('[Venues] Error searching venues:', error)
    return []
  }

  return data || []
}

export async function getVenueById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (error) {
    console.error('[Venues] Error fetching venue:', error)
    return null
  }

  return data
}

export async function getVenueWithEvents(id: string) {
  const supabase = await createClient()

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (venueError || !venue) return null

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('venue_id', id)
    .eq('is_cancelled', false)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  return { ...venue, events: events || [] }
}

export async function getMyVenue() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function updateVenueProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue) return { error: 'No venue found' }

  const updates: Record<string, unknown> = {}
  const fields = ['name', 'bio', 'phone', 'website', 'instagram', 'venue_type', 'promo_video_url']

  for (const field of fields) {
    const value = formData.get(field)
    if (value !== null) updates[field] = value || null
  }

  // Handle age restriction radio
  const ageRestriction = formData.get('age_restriction')
  if (ageRestriction !== null) {
    updates.is_eighteen_plus = ageRestriction === '18' || ageRestriction === '21'
    updates.is_twenty_one_plus = ageRestriction === '21'
  }

  const capacity = formData.get('capacity')
  if (capacity) updates.capacity = parseInt(capacity as string) || null

  const { error } = await supabase
    .from('venues')
    .update(updates)
    .eq('id', venue.id)

  if (error) {
    console.error('[Venues] Error updating venue:', error)
    return { error: 'Failed to update venue' }
  }

  revalidatePath('/venue-portal/profile')
  return { success: true }
}

export async function submitVenueApplication(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const application = {
    user_id: user.id,
    venue_name: formData.get('venue_name') as string,
    contact_name: formData.get('contact_name') as string,
    contact_email: formData.get('contact_email') as string,
    contact_phone: (formData.get('contact_phone') as string) || null,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip_code: formData.get('zip_code') as string,
    venue_type: (formData.get('venue_type') as string) || null,
    description: (formData.get('description') as string) || null,
    website: (formData.get('website') as string) || null,
    instagram: (formData.get('instagram') as string) || null,
  }

  const { error } = await supabase
    .from('venue_applications')
    .insert(application)

  if (error) {
    console.error('[Venues] Error submitting application:', error)
    return { error: 'Failed to submit application' }
  }

  revalidatePath('/venue-portal/apply')
  return { success: true }
}

export async function updateCrowdLevel(level: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue) return { error: 'No venue found' }

  if (level < 1 || level > 5) return { error: 'Invalid crowd level' }

  // Update venue
  const { error: updateError } = await supabase
    .from('venues')
    .update({
      current_crowd_level: level,
      crowd_updated_at: new Date().toISOString(),
    })
    .eq('id', venue.id)

  if (updateError) {
    console.error('[Venues] Error updating crowd level:', updateError)
    return { error: 'Failed to update crowd level' }
  }

  // Record history
  await supabase
    .from('crowd_meter_history')
    .insert({
      venue_id: venue.id,
      level,
      recorded_by: user.id,
    })

  revalidatePath('/venue-portal/crowd')
  revalidatePath(`/venue/${venue.id}`)
  return { success: true }
}

export async function uploadVenuePhoto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue) return { error: 'No venue found' }

  const file = formData.get('file') as File
  const type = formData.get('type') as 'cover' | 'gallery'

  if (!file) return { error: 'No file provided' }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'Invalid file type' }
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large (max 5MB)' }
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${venue.id}/${type}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('venue-photos')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('[Venues] Upload error:', uploadError)
    return { error: 'Failed to upload file' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('venue-photos')
    .getPublicUrl(filename)

  // Update venue record
  if (type === 'cover') {
    // Delete old cover photo if exists
    if (venue.cover_photo_url) {
      const oldPath = venue.cover_photo_url.split('/venue-photos/')[1]
      if (oldPath) {
        await supabase.storage.from('venue-photos').remove([oldPath])
      }
    }

    const { error: updateError } = await supabase
      .from('venues')
      .update({ cover_photo_url: publicUrl })
      .eq('id', venue.id)

    if (updateError) {
      return { error: 'Failed to update venue' }
    }
  } else {
    // Add to photos array
    const photos = [...(venue.photos || []), publicUrl]
    const { error: updateError } = await supabase
      .from('venues')
      .update({ photos })
      .eq('id', venue.id)

    if (updateError) {
      return { error: 'Failed to update venue' }
    }
  }

  revalidatePath('/venue-portal/profile')
  revalidatePath(`/venue/${venue.id}`)
  return { success: true, url: publicUrl }
}

export async function deleteVenuePhoto(
  venueId: string,
  photoUrl: string,
  type: 'cover' | 'gallery'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue || venue.id !== venueId) return { error: 'Not authorized' }

  // Extract path from URL
  const path = photoUrl.split('/venue-photos/')[1]
  if (path) {
    await supabase.storage.from('venue-photos').remove([path])
  }

  if (type === 'cover') {
    const { error } = await supabase
      .from('venues')
      .update({ cover_photo_url: null })
      .eq('id', venue.id)

    if (error) return { error: 'Failed to update venue' }
  } else {
    const photos = (venue.photos || []).filter((p: string) => p !== photoUrl)
    const { error } = await supabase
      .from('venues')
      .update({ photos })
      .eq('id', venue.id)

    if (error) return { error: 'Failed to update venue' }
  }

  revalidatePath('/venue-portal/profile')
  revalidatePath(`/venue/${venue.id}`)
  return { success: true }
}

export async function updateVenueHours(
  venueId: string,
  hours: Record<string, { open: string; close: string }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const venue = await getMyVenue()
  if (!venue || venue.id !== venueId) return { error: 'Not authorized' }

  const { error } = await supabase
    .from('venues')
    .update({ hours })
    .eq('id', venue.id)

  if (error) {
    console.error('[Venues] Error updating hours:', error)
    return { error: 'Failed to update hours' }
  }

  revalidatePath('/venue-portal/profile')
  revalidatePath(`/venue/${venue.id}`)
  return { success: true }
}
