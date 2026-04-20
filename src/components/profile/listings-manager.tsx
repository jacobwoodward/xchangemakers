'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PressableCard, Badge, Button } from '@/components/ui'
import type { Listing, AvailabilityType } from '@/lib/exchange-engine'
import {
  Repeat,
  CalendarClock,
  PartyPopper,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { deleteListingAction } from '@/app/(app)/profile/listing/actions'

interface ListingsManagerProps {
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

function ListingRow({ listing }: { listing: Listing }) {
  const [isPending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const AvailIcon = AVAILABILITY_ICON[listing.availabilityType] ?? Repeat

  const handleDelete = () => {
    if (!confirm(`Remove "${listing.title}"?`)) return
    startTransition(async () => {
      const result = await deleteListingAction(listing.id)
      if (result.error) {
        alert(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <PressableCard className="p-3.5">
        {/* Top row — title + price */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/listing/${listing.id}`}
            className="flex-1 min-w-0"
          >
            <h4 className="text-sm font-semibold text-heading leading-snug">
              {listing.title}
            </h4>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-bold text-primary tabular-nums whitespace-nowrap">
              {listing.creditPrice} TU
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded-md hover:bg-hover transition-colors"
              aria-label="Manage listing"
            >
              <MoreVertical size={15} className="text-muted" />
            </button>
          </div>
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

      {/* Inline action menu */}
      {menuOpen && (
        <div
          className="absolute right-3 top-10 z-10 flex flex-col rounded-lg border border-border-light bg-surface shadow-lg overflow-hidden min-w-[140px]"
          onClick={() => setMenuOpen(false)}
        >
          <Link
            href={`/profile/listing/${listing.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-body hover:bg-hover transition-colors"
          >
            <Pencil size={14} />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors text-left"
          >
            <Trash2 size={14} />
            {isPending ? 'Removing…' : 'Remove'}
          </button>
        </div>
      )}
    </div>
  )
}

export function ListingsManager({ offerings, needs }: ListingsManagerProps) {
  const hasOfferings = offerings.length > 0
  const hasNeeds = needs && needs.length > 0

  return (
    <div className="space-y-5">
      {/* Offerings */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Offerings
          </h3>
          <Link href="/profile/listing/new?type=offering">
            <Button variant="ghost" size="sm">
              <Plus size={14} />
              Add offering
            </Button>
          </Link>
        </div>
        {hasOfferings ? (
          <div className="space-y-2.5">
            {offerings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-5 text-center rounded-xl border border-dashed border-border-light">
            <p className="text-sm text-muted">No offerings yet</p>
            <p className="mt-1 text-xs text-muted">
              Share something you can offer your neighbors
            </p>
          </div>
        )}
      </section>

      {/* Needs */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Looking For
          </h3>
          <Link href="/profile/listing/new?type=need">
            <Button variant="ghost" size="sm">
              <Plus size={14} />
              Post a need
            </Button>
          </Link>
        </div>
        {hasNeeds ? (
          <div className="space-y-2.5">
            {needs!.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-5 text-center rounded-xl border border-dashed border-border-light">
            <p className="text-sm text-muted">No needs posted</p>
            <p className="mt-1 text-xs text-muted">
              Tell your community what you&rsquo;re looking for
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
