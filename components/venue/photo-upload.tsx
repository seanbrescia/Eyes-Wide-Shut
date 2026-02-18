'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadVenuePhoto, deleteVenuePhoto } from '@/lib/actions/venue'
import { cn } from '@/lib/utils/cn'
import { Camera, X, Loader2, ImagePlus } from 'lucide-react'

interface PhotoUploadProps {
  venueId: string
  type: 'cover' | 'gallery'
  currentUrl?: string | null
  currentPhotos?: string[]
  maxPhotos?: number
}

export function PhotoUpload({
  venueId,
  type,
  currentUrl,
  currentPhotos = [],
  maxPhotos = 6,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('venueId', venueId)
    formData.append('type', type)

    const result = await uploadVenuePhoto(formData)

    if (result.error) {
      setError(result.error)
    }

    setUploading(false)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleDelete(photoUrl: string) {
    setDeleting(photoUrl)
    setError(null)

    const result = await deleteVenuePhoto(venueId, photoUrl, type)

    if (result.error) {
      setError(result.error)
    }

    setDeleting(null)
  }

  if (type === 'cover') {
    return (
      <div className="space-y-3">
        <div
          className={cn(
            'relative aspect-[3/1] rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-border',
            'hover:border-primary/50 transition-colors cursor-pointer group'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {currentUrl ? (
            <>
              <Image
                src={currentUrl}
                alt="Cover photo"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Camera className="h-8 w-8 mb-2" />
                  <p className="text-sm">Click to upload cover photo</p>
                  <p className="text-xs mt-1">Recommended: 1200x400px</p>
                </>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  // Gallery type
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {currentPhotos.map((photo) => (
          <div
            key={photo}
            className="relative aspect-square rounded-xl overflow-hidden bg-secondary group"
          >
            <Image
              src={photo}
              alt="Gallery photo"
              fill
              sizes="150px"
              className="object-cover"
            />
            <button
              onClick={() => handleDelete(photo)}
              disabled={deleting === photo}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              {deleting === photo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}

        {currentPhotos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-xl border-2 border-dashed border-border',
              'flex flex-col items-center justify-center text-muted-foreground',
              'hover:border-primary/50 hover:text-primary transition-colors'
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 mb-1" />
                <span className="text-xs">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        {currentPhotos.length}/{maxPhotos} photos • Max 5MB each
      </p>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
