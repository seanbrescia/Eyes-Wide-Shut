import { redirect } from 'next/navigation'
import { getMyVenue } from '@/lib/actions/venue'
import { getVenueAnalytics, getCrowdPatterns, getBusiestNights } from '@/lib/actions/analytics'
import { StatsGrid } from '@/components/analytics/stats-grid'
import { CrowdHeatmap } from '@/components/analytics/crowd-heatmap'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'

export default async function VenueAnalyticsPage() {
  const venue = await getMyVenue()
  if (!venue) redirect('/venue-portal/apply')

  const [analytics, crowdPatterns, busiestNights] = await Promise.all([
    getVenueAnalytics(venue.id, 30),
    getCrowdPatterns(venue.id, 90),
    getBusiestNights(venue.id, 8),
  ])

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last 30 days performance for {venue.name}
        </p>
      </div>

      {/* Stats Grid */}
      {analytics && <StatsGrid analytics={analytics} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Crowd Heatmap */}
        <div className="lg:col-span-2">
          <CrowdHeatmap data={crowdPatterns} />
        </div>

        {/* Busiest Nights */}
        <div className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Busiest Nights
          </h3>
          <div className="space-y-3">
            {busiestNights.slice(0, 7).map((night, index) => (
              <div key={night.day} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">
                  #{index + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{night.day}</span>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${(night.avg_crowd / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {night.avg_crowd.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Conversion Funnel
          </h3>
          <div className="space-y-4">
            <FunnelStep
              label="Page Views"
              value={analytics?.total_views || 0}
              percent={100}
              color="bg-blue-500"
            />
            <FunnelStep
              label="RSVPs / Tickets"
              value={analytics?.total_rsvps || 0}
              percent={analytics?.conversion_rate || 0}
              color="bg-neon-cyan"
            />
            <FunnelStep
              label="Check-ins"
              value={analytics?.total_check_ins || 0}
              percent={
                analytics?.total_rsvps
                  ? Math.round((analytics.total_check_ins / analytics.total_rsvps) * 100)
                  : 0
              }
              color="bg-green-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function FunnelStep({
  label,
  value,
  percent,
  color,
}: {
  label: string
  value: number
  percent: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value.toLocaleString()}</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{percent}%</p>
    </div>
  )
}
