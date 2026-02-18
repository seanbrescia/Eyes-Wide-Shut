'use server'

import { createClient } from '@/lib/supabase/server'
import type { ReportType, ReportReason } from '@/types/database'

export async function submitReport(
  reportType: ReportType,
  targetId: string,
  reason: ReportReason,
  description?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check for duplicate report
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('target_id', targetId)
    .eq('status', 'pending')
    .single()

  if (existing) return { error: 'You already have a pending report for this item' }

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      report_type: reportType,
      target_id: targetId,
      reason,
      description: description || null,
    })

  if (error) return { error: error.message }
  return { success: true }
}
