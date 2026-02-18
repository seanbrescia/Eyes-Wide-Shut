import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from './landing-page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged in users go to the app
  if (user) {
    redirect('/home')
  }

  // Show landing page for visitors
  return <LandingPage />
}
