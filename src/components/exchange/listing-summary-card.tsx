import Link from 'next/link'
import { Badge, PressableCard, Avatar } from '@/components/ui'
import type { AvailabilityType, Listing } from '@/lib/exchange-engine'
import {
  CalendarClock,
  CircleHelp,
  HandHeart,
  PartyPopper,
  Repeat,
} from 'lucide-react'
import {
  formatCategory,
  formatCredits,
  getListingLifecycle,
} from '@/lib/marketplace'

interface ListingSummaryCardProps {
  listing: Listing
  context?: 'need' | 'offer'
}

const AVAILABILITY_LABEL: Record<AvailabilityType, string> = {
  ongoing: 'Ongoing',
  one_time: 'One-time',
  event_only: 'Event only',
}

const AVAILABILITY_ICON: Record<AvailabilityType, typeof Repeat> = {
  ongoing: Repeat,
  one_time: CalendarClock,
  event_only: PartyPopper,
}

export function ListingSummaryCard({
  listing,
  context = listing.type === 'need' ? 'need' : 'offer',
}: ListingSummaryCardProps) {
  const AvailabilityIcon = AVAILABILITY_ICON[listing.availabilityType] ?? Repeat
  const TypeIcon = context === 'need' ? CircleHelp : HandHeart
  const href = `/listing/${listing.id}`
  const lifecycle = getListingLifecycle(listing)

  return (
    <Link href={href} className="block">
      <PressableCard className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TypeIcon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-heading">
                {listing.title}
              </h3>
              <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                {formatCredits(listing.creditPrice)}
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-secondary">
              {listing.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Badge variant={context === 'need' ? 'accent' : 'primary'} className="text-[10px]">
                {context === 'need' ? 'Need' : 'Offer'}
              </Badge>
              <Badge variant="default" className="text-[10px]">
                {formatCategory(listing.category)}
              </Badge>
              {lifecycle.state === 'refresh_soon' && (
                <Badge variant="outline" className="text-[10px]">
                  Refresh soon
                </Badge>
              )}
              {lifecycle.state === 'expired' && (
                <Badge variant="outline" className="text-[10px]">
                  Expired
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted">
                <AvailabilityIcon size={11} />
                {AVAILABILITY_LABEL[listing.availabilityType]}
              </span>
            </div>

            {listing.member && (
              <div className="mt-3 flex items-center gap-2 border-t border-border-light pt-2.5">
                <Avatar
                  src={listing.member.avatarUrl}
                  firstName={listing.member.firstName}
                  lastName={listing.member.lastName}
                  size="sm"
                  isAvailable={listing.member.isAvailable}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-heading">
                    {listing.member.firstName} {listing.member.lastName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {listing.member.neighborhood}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PressableCard>
    </Link>
  )
}
