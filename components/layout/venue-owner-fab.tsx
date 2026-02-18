'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function VenueOwnerFab() {
  const [isVenueOwner, setIsVenueOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  async function checkRole() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsVenueOwner(data?.role === 'venue_owner')
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { checkRole() }, [])

  if (loading || !isVenueOwner) return null

  return (
    <Link
      href="/venue-portal"
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:scale-105 transition-transform animate-fade-in"
    >
      <Building2 className="w-4 h-4" />
      <span>Venue Portal</span>
    </Link>
  )
}
