'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Building2, Shield, CalendarDays, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/venues', label: 'Venues', icon: Building2 },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/promoters', label: 'Promoters', icon: Megaphone },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl">
        {/* Admin label */}
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)' }}
          >
            <Shield className="h-5 w-5" style={{ color: '#a855f7' }} />
          </div>
          <div>
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: '#a855f7' }}
            >
              Admin
            </span>
            <p className="text-xs text-white/40">Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        borderLeft: '2px solid #a855f7',
                      }
                    : undefined
                }
              >
                <item.icon
                  className="h-4 w-4"
                  style={isActive ? { color: '#a855f7' } : undefined}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Back to Site
          </Link>
          <p className="text-xs text-white/30">Eyes Wide Shut Admin</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
