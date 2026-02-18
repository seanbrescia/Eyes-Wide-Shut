import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  LogOut,
  Building2,
  Ticket,
  Gift,
  ChevronRight,
  Megaphone,
} from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const isVenueOwner = profile?.role === 'venue_owner'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 sm:px-6 pt-6 pb-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="glass-card p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Avatar & Name */}
        <div className="flex flex-col items-center gap-4 mb-8 animate-fade-in">
          <AvatarUpload
            userId={user.id}
            currentUrl={profile?.avatar_url || null}
            userName={profile?.full_name || null}
          />
          <div className="text-center">
            <h2 className="text-xl font-bold">
              {profile?.full_name || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Info cards */}
        <div className="space-y-3 mb-8">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Email
              </p>
              <p className="text-sm truncate">{user.email}</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Member Since
              </p>
              <p className="text-sm">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Role
              </p>
              <p className="text-sm capitalize">
                {profile?.role?.replace('_', ' ') || 'Consumer'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Quick Links
          </h3>

          <Link href="/tickets">
            <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <Ticket className="h-4 w-4 text-neon-cyan" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">My Tickets</p>
                <p className="text-[11px] text-muted-foreground">
                  View your RSVPs and tickets
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          <Link href="/referrals">
            <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">My Referrals</p>
                <p className="text-[11px] text-muted-foreground">
                  {profile?.referral_points || 0} points earned
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          {isVenueOwner && (
            <Link href="/venue-portal">
              <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Venue Portal</p>
                  <p className="text-[11px] text-muted-foreground">
                    Manage your venue and events
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin">
              <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Admin Dashboard</p>
                  <p className="text-[11px] text-muted-foreground">
                    Manage the platform
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}

          <Link href="/promote">
            <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-neon-pink/10 flex items-center justify-center">
                <Megaphone className="h-4 w-4 text-neon-pink" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {profile?.is_promoter ? 'Promoter Dashboard' : 'Become a Promoter'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {profile?.is_promoter
                    ? 'View your commissions and referral links'
                    : 'Earn cash commissions on referrals'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>

          {!isVenueOwner && (
            <Link href="/venue-portal/apply">
              <div className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-neon-pink/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-neon-pink" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">List Your Venue</p>
                  <p className="text-[11px] text-muted-foreground">
                    Apply to join Eyes Wide Shut
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          )}
        </div>

        {/* Sign out */}
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full glass-card p-4 flex items-center justify-center gap-2 text-destructive hover:border-destructive/30 transition-colors text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
