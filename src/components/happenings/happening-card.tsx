'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Users } from 'lucide-react'
import { PressableCard, Badge, Avatar } from '@/components/ui'
import type { Happening, HappeningCategory } from '@/lib/exchange-engine/types'
import type { Member } from '@/lib/exchange-engine/types'

// ---------------------------------------------------------------------------
// Category visual config
// ---------------------------------------------------------------------------

const CATEGORY_GRADIENTS: Record<HappeningCategory, string> = {
  kids: 'from-purple-300 to-violet-400',
  food: 'from-orange-300 to-amber-500',
  markets: 'from-emerald-300 to-green-400',
  fitness: 'from-teal-300 to-cyan-500',
  classes: 'from-blue-300 to-indigo-500',
  social: 'from-pink-300 to-rose-400',
  community: 'from-amber-300 to-yellow-500',
  exchange_event: 'from-green-500 to-emerald-700',
}

const CATEGORY_LABELS: Record<HappeningCategory, string> = {
  kids: 'Kids',
  food: 'Food',
  markets: 'Markets',
  fitness: 'Fitness',
  classes: 'Classes',
  social: 'Social',
  community: 'Community',
  exchange_event: 'Exchange',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHappeningDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "EEEE, MMM d '\u00B7' h:mm a")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HappeningCardProps {
  happening: Happening
  host?: Member
}

export function HappeningCard({ happening, host }: HappeningCardProps) {
  const displayHost = host ?? happening.host

  return (
    <Link href={`/happenings/${happening.id}`} className="block">
      <PressableCard noPadding className="w-full overflow-hidden">
        {/* ─── Hero section ─── */}
        <div className="relative">
          {happening.imageUrl ? (
            <img
              src={happening.imageUrl}
              alt={happening.title}
              className="h-36 w-full object-cover"
              draggable={false}
            />
          ) : (
            <div
              className={`h-36 w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[happening.category]} flex items-center justify-center`}
            >
              <span className="text-3xl text-white/25 font-bold">
                {CATEGORY_LABELS[happening.category]}
              </span>
            </div>
          )}

          {/* Category badge — top left */}
          <Badge
            variant="default"
            className="absolute top-2.5 left-2.5 text-[10px] bg-white/90 text-body backdrop-blur-sm"
          >
            {CATEGORY_LABELS[happening.category]}
          </Badge>

          {/* Going count badge — top right */}
          {happening.goingCount > 0 && (
            <Badge
              variant="default"
              className="absolute top-2.5 right-2.5 text-[10px] bg-white/90 text-body backdrop-blur-sm"
            >
              <Users size={10} className="mr-1" />
              {happening.goingCount} going
            </Badge>
          )}
        </div>

        {/* ─── Content ─── */}
        <div className="p-3.5 space-y-1.5">
          <h3 className="text-[15px] font-semibold text-heading leading-snug line-clamp-2">
            {happening.title}
          </h3>

          <p className="text-xs text-secondary tabular-nums">
            {formatHappeningDate(happening.startAt)}
          </p>

          <div className="flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} className="shrink-0" />
            <span className="line-clamp-1">{happening.location}</span>
          </div>

          {/* Host info */}
          {displayHost && (
            <div className="flex items-center gap-2 pt-1.5 border-t border-border-light mt-2">
              <Avatar
                src={displayHost.avatarUrl}
                firstName={displayHost.firstName}
                lastName={displayHost.lastName}
                size="xs"
              />
              <span className="text-xs text-muted">
                {displayHost.firstName} {displayHost.lastName}
              </span>
            </div>
          )}
        </div>
      </PressableCard>
    </Link>
  )
}
