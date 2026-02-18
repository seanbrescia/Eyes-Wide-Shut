'use client'

import { Wine, Users, Check } from 'lucide-react'
import type { VIPPackage, AvailableVIP } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface VIPPackageCardProps {
  package: VIPPackage | AvailableVIP
  availableCount?: number
  selected?: boolean
  onSelect?: () => void
}

export function VIPPackageCard({ package: pkg, availableCount, selected, onSelect }: VIPPackageCardProps) {
  const isAvailable = availableCount === undefined || availableCount > 0
  const minSpend = pkg.min_spend
  const depositAmount = pkg.deposit_amount
  const maxGuests = pkg.max_guests
  const includes = pkg.includes
  // VIPPackage has 'name', AvailableVIP has 'package_name'
  const name = 'name' in pkg ? pkg.name : (pkg as AvailableVIP).package_name

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable || !onSelect}
      className={cn(
        'glass-card p-5 text-left transition-all w-full',
        isAvailable && onSelect && 'hover:border-primary/50 cursor-pointer',
        selected && 'border-primary bg-primary/5',
        !isAvailable && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
            <Wine className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Up to {maxGuests} guests
            </div>
          </div>
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {'description' in pkg && pkg.description && (
        <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
      )}

      {/* Includes */}
      {includes && includes.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Includes
          </p>
          <ul className="space-y-1">
            {includes.map((item, i) => (
              <li key={i} className="text-xs flex items-center gap-2">
                <Check className="h-3 w-3 text-green-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing */}
      <div className="flex items-end justify-between pt-3 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Minimum Spend</p>
          <p className="text-xl font-bold text-primary">${minSpend.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Deposit Required</p>
          <p className="text-sm font-semibold">${depositAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Availability */}
      {availableCount !== undefined && (
        <p className={cn(
          'text-xs mt-3 text-center py-1 rounded',
          isAvailable ? 'text-green-400 bg-green-400/10' : 'text-destructive bg-destructive/10'
        )}>
          {isAvailable ? `${availableCount} available` : 'Sold out'}
        </p>
      )}
    </button>
  )
}
