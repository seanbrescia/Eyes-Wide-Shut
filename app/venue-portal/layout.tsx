import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyVenue } from '@/lib/actions/venue'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  Gift,
  Settings,
  QrCode,
  BarChart3,
  Award,
  Wine,
} from 'lucide-react'

const sidebarLinks = [
  { href: '/venue-portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/venue-portal/events', label: 'Events', icon: CalendarDays },
  { href: '/venue-portal/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/venue-portal/check-in', label: 'Check-In', icon: QrCode },
  { href: '/venue-portal/crowd', label: 'Crowd Meter', icon: Users },
  { href: '/venue-portal/referrals', label: 'Referrals', icon: Gift },
  { href: '/venue-portal/rewards', label: 'Rewards', icon: Award },
  { href: '/venue-portal/vip', label: 'VIP', icon: Wine },
  { href: '/venue-portal/profile', label: 'Settings', icon: Settings },
]

export default async function VenuePortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const venue = await getMyVenue()

  // If no venue, allow access only to the apply page
  // The layout still renders children so /venue-portal/apply works
  if (!venue) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - hidden on mobile, shown on md+ */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-1 border-r border-border bg-card/50">
          {/* Venue header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm truncate">{venue.name}</h2>
                <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                  Venue Portal
                </p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Back to app */}
          <div className="p-4 border-t border-border">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to app
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm truncate max-w-[150px]">
              {venue.name}
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            &larr; App
          </Link>
        </div>
        <div className="flex px-2 pb-2 gap-1 overflow-x-auto">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary whitespace-nowrap"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <div className="pt-24 md:pt-0">{children}</div>
      </main>
    </div>
  )
}
