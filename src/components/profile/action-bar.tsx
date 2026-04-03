'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'
import { MessageCircle, CalendarCheck } from 'lucide-react'

interface ActionBarProps {
  memberId: string
  firstListingId: string | null
}

export function ActionBar({ memberId, firstListingId }: ActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 bg-surface border-t border-border-light"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 16px rgba(45, 42, 38, 0.06)',
      }}
    >
      <div
        className="mx-auto flex items-center gap-3 px-4 py-3"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        {/* Message — secondary */}
        <Link href="/messages" className="shrink-0">
          <Button variant="secondary" size="md">
            <MessageCircle size={18} />
            Message
          </Button>
        </Link>

        {/* Book — primary, links to first listing's booking page */}
        {firstListingId ? (
          <Link href={`/booking/${firstListingId}`} className="flex-1">
            <Button variant="primary" size="md" className="w-full">
              <CalendarCheck size={18} />
              Book a Session
            </Button>
          </Link>
        ) : (
          <div className="flex-1">
            <Button variant="primary" size="md" className="w-full" disabled>
              <CalendarCheck size={18} />
              No Offerings Yet
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
