'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ShareButtonProps {
  referralCode: string
  entityType: 'event' | 'venue'
  entityId: string
  entityName: string
}

export function ShareButton({
  referralCode,
  entityType,
  entityId,
  entityName,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const referralUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${entityType}/${entityId}?ref=${referralCode}`
      : `/${entityType}/${entityId}?ref=${referralCode}`

  const shareText = `Check out ${entityName} on Eyes Wide Shut!`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: entityName,
          text: shareText,
          url: referralUrl,
        })
      } catch {
        // User cancelled or share failed silently
      }
      return
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text for manual copy
    }
  }

  // On mobile (share API available), use native share directly
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator
  if (canShare) {
    return (
      <button
        onClick={handleShare}
        className="glass-card px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary hover:border-primary/30 transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share & Earn
      </button>
    )
  }

  // On desktop, use dialog with copy
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="glass-card px-3 py-2 flex items-center gap-2 text-xs font-semibold text-primary hover:border-primary/30 transition-colors">
          <Share2 className="h-3.5 w-3.5" />
          Share & Earn
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Earn Points</DialogTitle>
          <DialogDescription>
            Share this link with friends. You earn 25 points for each RSVP and 50
            points for each signup via your link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Your Referral Code
            </p>
            <div className="glass-card px-3 py-2 text-center">
              <span className="font-mono font-bold text-primary tracking-widest text-lg">
                {referralCode}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Share Link
            </p>
            <div className="flex gap-2">
              <div className="glass-card px-3 py-2 flex-1 overflow-hidden">
                <p className="text-xs text-foreground/80 truncate font-mono">
                  {referralUrl}
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="glass-card px-3 py-2 hover:border-primary/30 transition-colors shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
