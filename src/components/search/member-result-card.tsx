'use client'

import Link from 'next/link'
import { PressableCard, Avatar } from '@/components/ui'
import type { MemberWithDetails } from '@/lib/exchange-engine'
import { cn } from '@/lib/utils'

interface MemberResultCardProps {
  member: MemberWithDetails
}

/**
 * Deterministic mock distance derived from member coordinates.
 * Keeps the prototype feeling real without actual geolocation.
 */
function getMockDistance(lat: number, lng: number): string {
  const hash = Math.abs(Math.round((lat * 1000 + lng * 100) % 97))
  const miles = 0.1 + (hash % 30) / 10 // 0.1 – 3.0 miles
  return `${miles.toFixed(1)} mi`
}

/**
 * Visual trust indicator — 5 dots showing trust score out of 100.
 */
function TrustDots({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5)

  return (
    <div className="flex gap-0.5" aria-label={`Trust score: ${score}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'block h-1.5 w-1.5 rounded-full',
            i < filled ? 'bg-primary' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

export function MemberResultCard({ member }: MemberResultCardProps) {
  const primaryOffering = member.offerings[0]
  const distance = getMockDistance(member.latitude, member.longitude)

  return (
    <Link href={`/member/${member.id}`} className="block">
      <PressableCard className="flex items-center gap-3 p-3.5">
        {/* Left — Avatar */}
        <Avatar
          src={member.avatarUrl}
          firstName={member.firstName}
          lastName={member.lastName}
          size="md"
          isAvailable={member.isAvailable}
        />

        {/* Center — Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-heading leading-tight truncate">
            {member.firstName} {member.lastName}
          </p>
          <p className="text-xs text-muted leading-snug truncate">
            {member.neighborhood}
          </p>
          {primaryOffering && (
            <p className="mt-0.5 text-xs text-body leading-snug truncate">
              {primaryOffering.title}
              <span className="ml-1 font-medium text-primary">
                {primaryOffering.creditPrice} EU
              </span>
            </p>
          )}
          <div className="mt-1">
            <TrustDots score={member.trustScore} />
          </div>
        </div>

        {/* Right — Distance */}
        <div className="shrink-0 text-right">
          <span className="text-xs font-medium text-muted tabular-nums">
            {distance}
          </span>
        </div>
      </PressableCard>
    </Link>
  )
}
