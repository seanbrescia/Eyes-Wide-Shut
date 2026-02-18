'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plus, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { getAllCities, createCity, updateCity } from '@/lib/actions/city'
import type { City } from '@/types/database'
import { cn } from '@/lib/utils/cn'

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function loadCities() {
    const data = await getAllCities()
    setCities(data)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch
  useEffect(() => { loadCities() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createCity({
        name: formData.get('name') as string,
        state: formData.get('state') as string,
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
      })

      if (result.city) {
        setShowForm(false)
        loadCities()
      }
    })
  }

  async function toggleActive(city: City) {
    startTransition(async () => {
      await updateCity(city.id, { is_active: !city.is_active })
      loadCities()
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
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="glass-card p-2 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Cities</h1>
          <p className="text-sm text-muted-foreground">
            Manage active cities for the platform
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-neon px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add City
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card p-5 mb-8 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Add New City
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                City Name <span className="text-destructive">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Miami"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                State <span className="text-destructive">*</span>
              </label>
              <input
                name="state"
                type="text"
                required
                maxLength={2}
                placeholder="FL"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Latitude
              </label>
              <input
                name="latitude"
                type="number"
                step="any"
                placeholder="25.7617"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Longitude
              </label>
              <input
                name="longitude"
                type="number"
                step="any"
                placeholder="-80.1918"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="btn-neon px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add City
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

      {/* Cities List */}
      {cities.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">No cities yet</h2>
          <p className="text-sm text-muted-foreground">
            Add your first city to enable location-based features
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cities.map((city) => (
            <div
              key={city.id}
              className={cn(
                'glass-card p-4 flex items-center gap-4',
                !city.is_active && 'opacity-50'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">
                  {city.name}, {city.state}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {city.latitude && city.longitude
                    ? `${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`
                    : 'No coordinates'}
                </p>
              </div>

              <button
                onClick={() => toggleActive(city)}
                disabled={isPending}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title={city.is_active ? 'Deactivate' : 'Activate'}
              >
                {city.is_active ? (
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
