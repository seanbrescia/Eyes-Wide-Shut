'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Compass, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/tickets', icon: Ticket, label: 'Tickets' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/' || pathname === ''
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors min-w-[64px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]')}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
