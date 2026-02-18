'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PromoterApplicationWithUser, PayoutRequestWithUser, ReportWithReporter } from '@/types/database'
import { sendPromoterApprovedEmail, sendPromoterRejectedEmail } from '@/lib/email/promoter-emails'

export async function getApplications(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  const supabase = await createClient()

  // First try without join to rule out FK issues
  const { data, error } = await supabase
    .from('venue_applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Error fetching applications:', error)
    return []
  }

  // If we got data, fetch user info separately
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(app => app.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    return data.map(app => ({
      ...app,
      user: userMap.get(app.user_id) || null
    }))
  }

  return data || []
}

export async function approveApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get application
  const { data: app, error: appError } = await supabase
    .from('venue_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !app) return { error: 'Application not found' }

  // Create slug from venue name
  const slug = app.venue_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Geocode address (simplified - use a real geocoding API in production)
  // For now, default to Mahwah NJ area with slight offset
  const lat = 41.0887 + (Math.random() * 0.02 - 0.01)
  const lng = -74.1438 + (Math.random() * 0.02 - 0.01)

  // Create venue
  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .insert({
      owner_id: app.user_id,
      name: app.venue_name,
      slug: slug + '-' + Date.now().toString(36),
      address_line1: app.address,
      city: app.city,
      state: app.state,
      zip_code: app.zip_code,
      latitude: lat,
      longitude: lng,
      venue_type: app.venue_type,
      bio: app.description,
      website: app.website,
      instagram: app.instagram,
      phone: app.contact_phone,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .select()
    .single()

  if (venueError) {
    console.error('[Admin] Error creating venue:', venueError)
    return { error: 'Failed to create venue' }
  }

  // Update application
  await supabase
    .from('venue_applications')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      created_venue_id: venue.id,
    })
    .eq('id', applicationId)

  // Upgrade user role to venue_owner
  await supabase
    .from('users')
    .update({ role: 'venue_owner' })
    .eq('id', app.user_id)

  revalidatePath('/admin/applications')
  revalidatePath('/admin/venues')
  return { success: true, venue }
}

export async function rejectApplication(applicationId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('venue_applications')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', applicationId)

  if (error) return { error: 'Failed to reject application' }

  revalidatePath('/admin/applications')
  return { success: true }
}

export async function getAllVenues() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('venues')
    .select(`*, owner:users!venues_owner_id_fkey(full_name, email)`)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

export async function getAdminStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalVenues },
    { count: pendingApps },
    { count: totalEvents },
    { count: totalTickets },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('venue_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_cancelled', false),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ])

  return {
    totalUsers: totalUsers || 0,
    totalVenues: totalVenues || 0,
    pendingApps: pendingApps || 0,
    totalEvents: totalEvents || 0,
    totalTickets: totalTickets || 0,
  }
}

// ============================================
// PROMOTER APPLICATIONS
// ============================================

export async function getPromoterApplications(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('promoter_applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Error fetching promoter applications:', error)
    return []
  }

  // Fetch user info separately (same pattern as venue apps)
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(app => app.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    return data.map(app => ({
      ...app,
      user: userMap.get(app.user_id) || null,
    }))
  }

  return data || []
}

export async function approvePromoterApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get application
  const { data: app, error: appError } = await supabase
    .from('promoter_applications')
    .select('user_id, full_name, email')
    .eq('id', applicationId)
    .single()

  if (appError || !app) return { error: 'Application not found' }

  // Update application status
  const { error: updateError } = await supabase
    .from('promoter_applications')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (updateError) return { error: 'Failed to approve application' }

  // Set user as promoter
  await supabase
    .from('users')
    .update({ is_promoter: true })
    .eq('id', app.user_id)

  // Send approval email
  sendPromoterApprovedEmail(app.email, app.full_name)

  revalidatePath('/admin/promoters')
  return { success: true }
}

export async function rejectPromoterApplication(applicationId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get application for email
  const { data: app } = await supabase
    .from('promoter_applications')
    .select('full_name, email')
    .eq('id', applicationId)
    .single()

  const { error } = await supabase
    .from('promoter_applications')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', applicationId)

  if (error) return { error: 'Failed to reject application' }

  // Send rejection email
  if (app) {
    sendPromoterRejectedEmail(app.email, app.full_name, reason)
  }

  revalidatePath('/admin/promoters')
  return { success: true }
}

// ============================================
// PROMOTER PAYOUTS
// ============================================

export async function getPayoutRequests(status: 'pending' | 'approved' | 'paid' | 'rejected' = 'pending') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Error fetching payout requests:', error)
    return []
  }

  if (data && data.length > 0) {
    const userIds = [...new Set(data.map(p => p.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email, promoter_tier, total_earnings, pending_payout')
      .in('id', userIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    return data.map(p => ({
      ...p,
      user: userMap.get(p.user_id) || null,
    }))
  }

  return data || []
}

export async function approvePayoutRequest(payoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) return { error: 'Failed to approve payout' }

  revalidatePath('/admin/payouts')
  return { success: true }
}

export async function markPayoutPaid(payoutId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: payout } = await supabase
    .from('payout_requests')
    .select('user_id, amount')
    .eq('id', payoutId)
    .single()

  if (!payout) return { error: 'Payout request not found' }

  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payoutId)

  if (error) return { error: 'Failed to mark payout as paid' }

  // Deduct from user's pending_payout
  const { data: userData } = await supabase
    .from('users')
    .select('pending_payout')
    .eq('id', payout.user_id)
    .single()

  if (userData) {
    await supabase
      .from('users')
      .update({
        pending_payout: Math.max(0, (userData.pending_payout || 0) - payout.amount),
      })
      .eq('id', payout.user_id)
  }

  revalidatePath('/admin/payouts')
  return { success: true }
}

export async function rejectPayoutRequest(payoutId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('payout_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', payoutId)

  if (error) return { error: 'Failed to reject payout' }

  revalidatePath('/admin/payouts')
  return { success: true }
}

// ============================================
// REPORTS / ABUSE
// ============================================

export async function getReports(status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' = 'pending') {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Error fetching reports:', error)
    return []
  }

  if (data && data.length > 0) {
    const reporterIds = [...new Set(data.map(r => r.reporter_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', reporterIds)

    const userMap = new Map(users?.map(u => [u.id, u]) || [])
    return data.map(r => ({
      ...r,
      reporter: userMap.get(r.reporter_id) || null,
    }))
  }

  return data || []
}

export async function resolveReport(reportId: string, adminNotes: string, newStatus: 'resolved' | 'dismissed' = 'resolved') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('reports')
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes,
    })
    .eq('id', reportId)

  if (error) return { error: 'Failed to update report' }

  revalidatePath('/admin/reports')
  return { success: true }
}
