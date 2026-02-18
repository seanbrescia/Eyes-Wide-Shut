'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  const userId = formData.get('userId') as string

  if (!file) return { error: 'No file provided' }
  if (userId !== user.id) return { error: 'Not authorized' }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { error: 'Invalid file type' }
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large (max 5MB)' }
  }

  // Get current avatar to delete later
  const { data: profile } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${user.id}/avatar-${Date.now()}.${ext}`

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('[User] Upload error:', uploadError)
    return { error: 'Failed to upload file' }
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename)

  // Update user record
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to update profile' }
  }

  // Delete old avatar if exists
  if (profile?.avatar_url) {
    const oldPath = profile.avatar_url.split('/avatars/')[1]
    if (oldPath) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  revalidatePath('/profile')
  return { success: true, url: publicUrl }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName || null,
      phone: phone || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[User] Update error:', error)
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/profile')
  return { success: true }
}
