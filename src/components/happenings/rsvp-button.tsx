'use client'

import { Check, Star } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { RsvpStatus } from '@/lib/exchange-engine/types'

interface RsvpButtonProps {
  currentStatus: RsvpStatus | null
  onRsvp: (status: RsvpStatus) => void
  isLoading: boolean
}

export function RsvpButton({ currentStatus, onRsvp, isLoading }: RsvpButtonProps) {
  const isGoing = currentStatus === 'going'
  const isInterested = currentStatus === 'interested'

  return (
    <div className="flex gap-3">
      <Button
        variant={isGoing ? 'primary' : 'secondary'}
        size="lg"
        className={cn('flex-1', isGoing && 'shadow-md')}
        onClick={() => onRsvp('going')}
        disabled={isLoading}
        isLoading={isLoading && isGoing}
      >
        <Check size={18} />
        Going
      </Button>

      <Button
        variant={isInterested ? 'accent' : 'secondary'}
        size="lg"
        className={cn('flex-1', isInterested && 'shadow-md')}
        onClick={() => onRsvp('interested')}
        disabled={isLoading}
        isLoading={isLoading && isInterested}
      >
        <Star size={18} />
        Interested
      </Button>
    </div>
  )
}
