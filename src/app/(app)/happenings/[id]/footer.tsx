'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RsvpButton } from '@/components/happenings/rsvp-button'
import type { RsvpStatus } from '@/lib/exchange-engine'
import { rsvpAction } from '../actions'

interface HappeningDetailFooterProps {
  happeningId: string
}

export function HappeningDetailFooter({ happeningId }: HappeningDetailFooterProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRsvp = useCallback(
    (status: RsvpStatus) => {
      // Toggle off if already selected
      if (currentStatus === status) {
        setCurrentStatus(null)
        return
      }

      setCurrentStatus(status)

      startTransition(async () => {
        await rsvpAction(happeningId, status)
        router.refresh()
      })
    },
    [currentStatus, happeningId, router],
  )

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-surface border-t border-border-light"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 16px rgba(45, 42, 38, 0.06)',
      }}
    >
      <div
        className="mx-auto px-4 py-3"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        <RsvpButton
          currentStatus={currentStatus}
          onRsvp={handleRsvp}
          isLoading={isPending}
        />
      </div>
    </div>
  )
}
