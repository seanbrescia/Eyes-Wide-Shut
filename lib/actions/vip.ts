'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { VIPPackage, VIPReservation, VIPReservationWithDetails, AvailableVIP } from '@/types/database'

// ============================================
// BROWSE VIP PACKAGES
// ============================================

export async function getVenueVIPPackages(venueId: string): Promise<VIPPackage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vip_packages')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
    .order('min_spend', { ascending: true })

  if (error) return []
  return data || []
}

export async function getAvailableVIP(venueId: string, date: string): Promise<AvailableVIP[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_available_vip', { p_venue_id: venueId, p_date: date })

  if (error) {
    console.error('[VIP] Error getting available:', error)
    return []
  }

  return (data || []) as AvailableVIP[]
}

export async function getVIPPackageById(packageId: string): Promise<VIPPackage | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vip_packages')
    .select('*')
    .eq('id', packageId)
    .single()

  if (error) return null
  return data
}

// ============================================
// CREATE RESERVATION
// ============================================

export async function createVIPReservation(reservation: {
  venueId: string
  packageId: string
  date: string
  partySize: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  specialRequests?: string
}): Promise<{ reservation?: VIPReservation; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get package details
  const { data: pkg } = await supabase
    .from('vip_packages')
    .select('*')
    .eq('id', reservation.packageId)
    .single()

  if (!pkg) return { error: 'Package not found' }

  // Check party size
  if (reservation.partySize > pkg.max_guests) {
    return { error: `Maximum ${pkg.max_guests} guests allowed for this package` }
  }

  // Find available inventory
  const { data: inventory } = await supabase
    .from('vip_inventory')
    .select('*')
    .eq('package_id', reservation.packageId)
    .eq('date', reservation.date)
    .lt('total_booked', supabase.rpc('total_available'))
    .limit(1)
    .single()

  // Create reservation
  const { data, error } = await supabase
    .from('vip_reservations')
    .insert({
      user_id: user.id,
      venue_id: reservation.venueId,
      package_id: reservation.packageId,
      inventory_id: inventory?.id || null,
      date: reservation.date,
      party_size: reservation.partySize,
      guest_name: reservation.guestName,
      guest_email: reservation.guestEmail,
      guest_phone: reservation.guestPhone || null,
      special_requests: reservation.specialRequests || null,
      min_spend: inventory?.price_override || pkg.min_spend,
      deposit_amount: pkg.deposit_amount,
      status: 'pending',
      confirmation_code: '', // Trigger will generate
    })
    .select()
    .single()

  if (error) {
    console.error('[VIP] Error creating reservation:', error)
    return { error: 'Failed to create reservation' }
  }

  revalidatePath('/vip')
  return { reservation: data }
}

// ============================================
// USER RESERVATIONS
// ============================================

export async function getMyVIPReservations(): Promise<VIPReservationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('vip_reservations')
    .select(`
      *,
      venue:venues(id, name, address_line1, city, state),
      package:vip_packages(id, name, description, min_spend, deposit_amount, max_guests, includes),
      event:events(id, name, date)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) return []
  return (data || []) as VIPReservationWithDetails[]
}

export async function getVIPReservationById(reservationId: string): Promise<VIPReservationWithDetails | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('vip_reservations')
    .select(`
      *,
      venue:venues(id, name, address_line1, city, state),
      package:vip_packages(id, name, description, min_spend, deposit_amount, max_guests, includes),
      event:events(id, name, date)
    `)
    .eq('id', reservationId)
    .single()

  if (error) return null

  // Check ownership or venue owner
  const res = data as VIPReservationWithDetails
  if (res.user_id !== user.id) {
    // Check if venue owner
    const { data: venue } = await supabase
      .from('venues')
      .select('owner_id')
      .eq('id', res.venue_id)
      .single()

    if (venue?.owner_id !== user.id) return null
  }

  return res
}

export async function cancelVIPReservation(
  reservationId: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: reservation } = await supabase
    .from('vip_reservations')
    .select('user_id, status')
    .eq('id', reservationId)
    .single()

  if (!reservation || reservation.user_id !== user.id) {
    return { error: 'Reservation not found' }
  }

  if (reservation.status === 'cancelled') {
    return { error: 'Already cancelled' }
  }

  const { error } = await supabase
    .from('vip_reservations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
    })
    .eq('id', reservationId)

  if (error) return { error: 'Failed to cancel' }

  revalidatePath('/vip')
  return { success: true }
}

// ============================================
// VENUE OWNER: MANAGE PACKAGES
// ============================================

export async function createVIPPackage(pkg: {
  name: string
  description?: string
  minSpend: number
  depositAmount: number
  maxGuests: number
  includes?: string[]
}): Promise<{ package?: VIPPackage; error?: string }> {
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
    .from('vip_packages')
    .insert({
      venue_id: venue.id,
      name: pkg.name,
      description: pkg.description || null,
      min_spend: pkg.minSpend,
      deposit_amount: pkg.depositAmount,
      max_guests: pkg.maxGuests,
      includes: pkg.includes || [],
      is_active: true,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create package' }

  revalidatePath('/venue-portal/vip')
  return { package: data }
}

export async function updateVIPPackage(
  packageId: string,
  updates: Partial<Pick<VIPPackage, 'name' | 'description' | 'min_spend' | 'deposit_amount' | 'max_guests' | 'includes' | 'is_active'>>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: pkg } = await supabase
    .from('vip_packages')
    .select('venue_id')
    .eq('id', packageId)
    .single()

  if (!pkg) return { error: 'Package not found' }

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('id', pkg.venue_id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) return { error: 'Not authorized' }

  const { error } = await supabase
    .from('vip_packages')
    .update(updates)
    .eq('id', packageId)

  if (error) return { error: 'Failed to update' }

  revalidatePath('/venue-portal/vip')
  return { success: true }
}

export async function getMyVenuePackages(): Promise<VIPPackage[]> {
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
    .from('vip_packages')
    .select('*')
    .eq('venue_id', venue.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// ============================================
// VENUE OWNER: MANAGE INVENTORY
// ============================================

export async function addVIPInventory(inventory: {
  packageId: string
  date: string
  tableNumber?: string
  totalAvailable: number
  priceOverride?: number
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vip_inventory')
    .insert({
      package_id: inventory.packageId,
      date: inventory.date,
      table_number: inventory.tableNumber || null,
      total_available: inventory.totalAvailable,
      price_override: inventory.priceOverride || null,
    })

  if (error) {
    if (error.code === '23505') return { error: 'Inventory already exists for this date' }
    return { error: 'Failed to add inventory' }
  }

  revalidatePath('/venue-portal/vip')
  return { success: true }
}

// ============================================
// VENUE OWNER: VIEW RESERVATIONS
// ============================================

export async function getVenueReservations(status?: string): Promise<VIPReservationWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!venue) return []

  let query = supabase
    .from('vip_reservations')
    .select(`
      *,
      venue:venues(id, name, address_line1, city, state),
      package:vip_packages(id, name, description, min_spend, deposit_amount, max_guests, includes),
      event:events(id, name, date)
    `)
    .eq('venue_id', venue.id)
    .order('date', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return []
  return (data || []) as VIPReservationWithDetails[]
}

export async function updateReservationStatus(
  reservationId: string,
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show',
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify venue ownership
  const { data: reservation } = await supabase
    .from('vip_reservations')
    .select('venue_id')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reservation not found' }

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('id', reservation.venue_id)
    .eq('owner_id', user.id)
    .single()

  if (!venue) return { error: 'Not authorized' }

  const updates: Record<string, unknown> = { status }

  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  } else if (status === 'cancelled') {
    updates.cancelled_at = new Date().toISOString()
    updates.cancellation_reason = reason || null
  }

  const { error } = await supabase
    .from('vip_reservations')
    .update(updates)
    .eq('id', reservationId)

  if (error) return { error: 'Failed to update status' }

  revalidatePath('/venue-portal/vip')
  return { success: true }
}
