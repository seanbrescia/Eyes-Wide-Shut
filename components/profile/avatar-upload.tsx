'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '@/lib/actions/user'
import { cn } from '@/lib/utils/cn'
import { User, Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  userId: string
  currentUrl: string | null
  userName: string | null
}

export function AvatarUpload({ userId, currentUrl, userName }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)

    const result = await uploadAvatar(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.url) {
      setAvatarUrl(result.url)
    }

    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group',
          'bg-gradient-to-br from-primary to-accent'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={userName || 'Profile'}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-12 w-12 text-white" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
      >
        {uploading ? 'Uploading...' : 'Change photo'}
      </button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
