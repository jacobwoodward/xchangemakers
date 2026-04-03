'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Users } from 'lucide-react'
import { PressableCard, Badge } from '@/components/ui'
import type { Happening, HappeningCategory } from '@/lib/exchange-engine/types'

interface HappeningsPreviewProps {
  happenings: Happening[]
}

const CATEGORY_GRADIENTS: Record<HappeningCategory, string> = {
  kids: 'from-amber-300 to-orange-400',
  food: 'from-emerald-400 to-teal-500',
  markets: 'from-yellow-400 to-amber-500',
  fitness: 'from-blue-400 to-indigo-500',
  classes: 'from-violet-400 to-purple-500',
  social: 'from-pink-400 to-rose-500',
  community: 'from-emerald-500 to-green-600',
  exchange_event: 'from-teal-400 to-cyan-500',
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

function formatHappeningDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, "EEE, MMM d '\u00B7' h:mm a")
}

export function HappeningsPreview({ happenings }: HappeningsPreviewProps) {
  if (happenings.length === 0) return null

  return (
    <div className="-mx-4 mt-3">
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {happenings.map((happening) => (
          <Link
            key={happening.id}
            href={`/happenings/${happening.id}`}
            className="shrink-0"
          >
            <PressableCard
              noPadding
              className="w-[280px] overflow-hidden"
            >
              {/* Image / gradient header */}
              {happening.imageUrl ? (
                <img
                  src={happening.imageUrl}
                  alt={happening.title}
                  className="h-32 w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div
                  className={`h-32 w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[happening.category]} flex items-center justify-center`}
                >
                  <span className="text-3xl text-white/30 font-bold">
                    {CATEGORY_LABELS[happening.category]}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="default" className="text-[10px]">
                    {CATEGORY_LABELS[happening.category]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    <Users size={10} className="mr-1" />
                    {happening.goingCount} going
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-heading leading-snug line-clamp-1">
                  {happening.title}
                </h3>

                <p className="mt-1 text-xs text-secondary tabular-nums">
                  {formatHappeningDate(happening.startAt)}
                </p>

                <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin size={11} className="shrink-0" />
                  <span className="line-clamp-1">{happening.location}</span>
                </div>
              </div>
            </PressableCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
