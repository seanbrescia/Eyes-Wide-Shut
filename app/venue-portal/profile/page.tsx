'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMyVenue, updateVenueProfile } from '@/lib/actions/venue'
import { PhotoUpload } from '@/components/venue/photo-upload'
import { HoursEditor } from '@/components/venue/hours-editor'
import { VENUE_TYPES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'
import type { Venue } from '@/types/database'
import {
  Building2,
  Globe,
  Instagram,
  Phone,
  Video,
  Users,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react'

export default function VenueProfilePage() {
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVenue() {
      const data = await getMyVenue()
      setVenue(data)
      setLoading(false)
    }
    loadVenue()
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateVenueProfile(formData)

      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        router.refresh()
      }
    })
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="p-6 md:p-10">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Venue Found</h2>
          <p className="text-muted-foreground">
            You don&apos;t have an approved venue yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Venue Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize how your venue appears to customers
        </p>
      </div>

      <div className="space-y-8">
        {/* Cover Photo */}
        <section className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Cover Photo
          </h2>
          <PhotoUpload
            venueId={venue.id}
            type="cover"
            currentUrl={venue.cover_photo_url}
          />
        </section>

        {/* Gallery Photos */}
        <section className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Photo Gallery
          </h2>
          <PhotoUpload
            venueId={venue.id}
            type="gallery"
            currentPhotos={venue.photos || []}
            maxPhotos={6}
          />
        </section>

        {/* Basic Info Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Basic Information
            </h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">
                Venue Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={venue.name}
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1.5">
                About / Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={venue.bio || ''}
                placeholder="Tell customers about your venue, vibe, and what makes you unique..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="venue_type" className="block text-sm font-medium mb-1.5">
                  Venue Type
                </label>
                <select
                  id="venue_type"
                  name="venue_type"
                  defaultValue={venue.venue_type || ''}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">Select a type...</option>
                  {VENUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Capacity
                  </span>
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  defaultValue={venue.capacity || ''}
                  placeholder="Max occupancy"
                  className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Age restrictions */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Age Restriction
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="age_restriction"
                    value="none"
                    defaultChecked={!venue.is_eighteen_plus && !venue.is_twenty_one_plus}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">All Ages</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="age_restriction"
                    value="18"
                    defaultChecked={venue.is_eighteen_plus && !venue.is_twenty_one_plus}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">18+</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="age_restriction"
                    value="21"
                    defaultChecked={venue.is_twenty_one_plus}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">21+</span>
                </label>
              </div>
            </div>
          </section>

          {/* Contact & Links */}
          <section className="glass-card p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Contact & Links
            </h2>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={venue.phone || ''}
                placeholder="(555) 555-5555"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Website
                </span>
              </label>
              <input
                id="website"
                name="website"
                type="url"
                defaultValue={venue.website || ''}
                placeholder="https://yourvenue.com"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="instagram" className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Instagram className="h-3.5 w-3.5 text-neon-pink" />
                  Instagram
                </span>
              </label>
              <input
                id="instagram"
                name="instagram"
                type="text"
                defaultValue={venue.instagram || ''}
                placeholder="@yourvenue"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="promo_video_url" className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                  Promo Video URL
                </span>
              </label>
              <input
                id="promo_video_url"
                name="promo_video_url"
                type="url"
                defaultValue={venue.promo_video_url || ''}
                placeholder="https://youtube.com/embed/..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use YouTube or Vimeo embed URL
              </p>
            </div>
          </section>

          {/* Error & Submit */}
          {error && (
            <div className="glass-card p-4 border-destructive/30 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2',
              saved
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'btn-neon neon-glow'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-5 w-5" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>

        {/* Hours of Operation */}
        <section className="glass-card p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4">
            Hours of Operation
          </h2>
          <HoursEditor
            venueId={venue.id}
            currentHours={venue.hours}
          />
        </section>
      </div>
    </div>
  )
}
