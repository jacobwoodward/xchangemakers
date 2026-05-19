'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RsvpButton } from '@/components/happenings/rsvp-button'
import type { RsvpStatus } from '@/lib/exchange-engine'
import { clearRsvpAction, rsvpAction } from '../actions'

interface HappeningDetailFooterProps {
  happeningId: string
  initialStatus: RsvpStatus | null
}

export function HappeningDetailFooter({
  happeningId,
  initialStatus,
}: HappeningDetailFooterProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] =
    useState<RsvpStatus | null>(initialStatus)
  const [isPending, startTransition] = useTransition()

  const handleRsvp = useCallback(
    (status: RsvpStatus) => {
      if (currentStatus === status) {
        setCurrentStatus(null)
        startTransition(async () => {
          await clearRsvpAction(happeningId)
          router.refresh()
        })
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
      className="fixed inset-x-0 bottom-[calc(var(--xm-bottomnav-height)+env(safe-area-inset-bottom,0px))] z-40 border-t border-border-light bg-surface"
      style={{
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
