'use client'

import { useState, useEffect, useTransition } from 'react'
import { Gift, Plus, Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { getVenueRewards, createReward, updateReward } from '@/lib/actions/rewards'
import type { Reward } from '@/types/database'
import { cn } from '@/lib/utils/cn'

const REWARD_TYPES = [
  { value: 'free_cover', label: 'Free Cover' },
  { value: 'drink_ticket', label: 'Drink Ticket' },
  { value: 'vip_upgrade', label: 'VIP Upgrade' },
  { value: 'merch', label: 'Merchandise' },
  { value: 'custom', label: 'Custom' },
]

export default function VenueRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function loadRewards() {
    const data = await getVenueRewards()
    setRewards(data)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { loadRewards() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createReward({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        points_cost: parseInt(formData.get('points_cost') as string),
        reward_type: formData.get('reward_type') as string,
        quantity_available: formData.get('quantity')
          ? parseInt(formData.get('quantity') as string)
          : undefined,
      })

      if (result.reward) {
        setShowForm(false)
        loadRewards()
      }
    })
  }

  async function toggleActive(reward: Reward) {
    startTransition(async () => {
      await updateReward(reward.id, { is_active: !reward.is_active })
      loadRewards()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Rewards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create rewards for your loyal customers
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-neon px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Reward
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-5 mb-8 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Create Reward
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Free Cover"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                name="reward_type"
                required
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {REWARD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Points Cost <span className="text-destructive">*</span>
              </label>
              <input
                name="points_cost"
                type="number"
                required
                min="1"
                placeholder="100"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Quantity Available
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="Unlimited"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Details about this reward..."
              className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="btn-neon px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Reward
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rewards List */}
      {rewards.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">No rewards yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create rewards to incentivize your promoters and customers
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-neon px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create First Reward
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={cn(
                'glass-card p-4 flex items-center gap-4',
                !reward.is_active && 'opacity-50'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Gift className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{reward.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">
                  {reward.reward_type.replace('_', ' ')}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-primary">{reward.points_cost} pts</p>
                <p className="text-[10px] text-muted-foreground">
                  {reward.quantity_redeemed} redeemed
                  {reward.quantity_available && ` / ${reward.quantity_available}`}
                </p>
              </div>

              <button
                onClick={() => toggleActive(reward)}
                disabled={isPending}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title={reward.is_active ? 'Deactivate' : 'Activate'}
              >
                {reward.is_active ? (
                  <ToggleRight className="h-5 w-5 text-green-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
