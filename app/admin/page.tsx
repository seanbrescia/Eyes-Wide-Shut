import { getAdminStats } from '@/lib/actions/admin'
import {
  Users,
  Building2,
  FileText,
  CalendarDays,
  Ticket,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default async function AdminOverviewPage() {
  const stats = await getAdminStats()

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: '#a855f7',
      highlight: false,
    },
    {
      label: 'Active Venues',
      value: stats.totalVenues,
      icon: Building2,
      color: '#a855f7',
      highlight: false,
    },
    {
      label: 'Pending Applications',
      value: stats.pendingApps,
      icon: FileText,
      color: stats.pendingApps > 0 ? '#e11d48' : '#a855f7',
      highlight: stats.pendingApps > 0,
    },
    {
      label: 'Total Events',
      value: stats.totalEvents,
      icon: CalendarDays,
      color: '#a855f7',
      highlight: false,
    },
    {
      label: 'Tickets Sold',
      value: stats.totalTickets,
      icon: Ticket,
      color: '#a855f7',
      highlight: false,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-white/50">
          System-wide stats at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              'glass-card relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-[1.02]',
              card.highlight && 'ring-1'
            )}
            style={
              card.highlight
                ? { '--tw-ring-color': '#e11d48', boxShadow: '0 0 24px rgba(225, 29, 72, 0.15)' } as React.CSSProperties
                : undefined
            }
          >
            {/* Accent glow */}
            <div
              className="absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: card.color }}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/50">
                  {card.label}
                </p>
                <p
                  className="mt-2 text-4xl font-bold tracking-tight"
                  style={{ color: card.highlight ? '#e11d48' : 'white' }}
                >
                  {card.value.toLocaleString()}
                </p>
              </div>

              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${card.color}20`,
                  border: `1px solid ${card.color}40`,
                }}
              >
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
            </div>

            {card.highlight && card.value > 0 && (
              <p className="mt-3 text-xs font-medium" style={{ color: '#e11d48' }}>
                Requires attention
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
