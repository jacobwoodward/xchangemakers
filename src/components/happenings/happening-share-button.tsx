'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'

interface HappeningShareButtonProps {
  title: string
}

export function HappeningShareButton({ title }: HappeningShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }

      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-heading transition-colors hover:bg-hover"
      aria-label={copied ? 'Event link copied' : 'Share event'}
      title={copied ? 'Copied' : 'Share'}
    >
      <Share2 size={18} />
    </button>
  )
}
