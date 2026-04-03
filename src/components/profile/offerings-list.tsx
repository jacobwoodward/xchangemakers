'use client'

import Link from 'next/link'
import { PressableCard, Badge } from '@/components/ui'
import type { Listing, AvailabilityType } from '@/lib/exchange-engine'
import { Repeat, CalendarClock, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfferingsListProps {
  offerings: Listing[]
  needs?: Listing[]
}

const AVAILABILITY_ICON: Record<AvailabilityType, typeof Repeat> = {
  ongoing: Repeat,
  one_time: CalendarClock,
  event_only: PartyPopper,
}

const AVAILABILITY_LABEL: Record<AvailabilityType, string> = {
  ongoing: 'Ongoing',
  one_time: 'One-time',
  event_only: 'Event only',
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function ListingCard({ listing }: { listing: Listing }) {
  const AvailIcon = AVAILABILITY_ICON[listing.availabilityType] ?? Repeat

  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <PressableCard className="p-3.5">
        {/* Top row — title + price */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-heading leading-snug flex-1 min-w-0">
            {listing.title}
          </h4>
          <span className="shrink-0 text-sm font-bold text-primary tabular-nums whitespace-nowrap">
            {listing.creditPrice} EU
          </span>
        </div>

        {/* Description (2-line clamp) */}
        <p className="mt-1 text-xs text-secondary leading-relaxed line-clamp-2">
          {listing.description}
        </p>

        {/* Bottom row — badges */}
        <div className="mt-2.5 flex items-center gap-2">
          <Badge variant="default" className="text-[10px]">
            {formatCategory(listing.category)}
          </Badge>
          <div className="flex items-center gap-1 text-muted">
            <AvailIcon size={11} />
            <span className="text-[10px] font-medium">
              {AVAILABILITY_LABEL[listing.availabilityType]}
            </span>
          </div>
        </div>
      </PressableCard>
    </Link>
  )
}

export function OfferingsList({ offerings, needs }: OfferingsListProps) {
  const hasOfferings = offerings.length > 0
  const hasNeeds = needs && needs.length > 0

  if (!hasOfferings && !hasNeeds) {
    return (
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
          Offerings
        </h3>
        <div className="py-6 text-center">
          <p className="text-sm text-muted">No offerings yet</p>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-5">
      {/* Offerings */}
      {hasOfferings && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Offerings
          </h3>
          <div className="space-y-2.5">
            {offerings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Needs */}
      {hasNeeds && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Looking For
          </h3>
          <div className="space-y-2.5">
            {needs!.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
