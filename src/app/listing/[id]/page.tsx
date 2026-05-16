import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { Card, Avatar, Badge, Button } from '@/components/ui'
import {
  Repeat,
  CalendarClock,
  PartyPopper,
  Clock,
  CalendarCheck,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import type { AvailabilityType } from '@/lib/exchange-engine'
import {
  formatListingExpiration,
  getListingLifecycle,
} from '@/lib/marketplace'
import {
  refreshListingFromDetailAction,
  respondToListingAction,
} from './actions'

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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()
  const listing = await exchangeEngine.getListing(id)
  const currentMember = await exchangeEngine.getCurrentMember()
  const isOwner = currentMember.id === listing.memberId
  const lifecycle = getListingLifecycle(listing)
  const isExpired = lifecycle.state === 'expired'

  const AvailIcon = AVAILABILITY_ICON[listing.availabilityType] ?? Repeat
  const availLabel = AVAILABILITY_LABEL[listing.availabilityType] ?? listing.availabilityType

  return (
    <>
      <PageHeader title={listing.title} />
      <PageTransition>
        <div className="pt-16 pb-28 px-4 space-y-5">
          {/* ─── Credit hero ─── */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                {listing.creditPrice}
              </span>
              <span className="text-lg font-semibold text-primary/60">
                {listing.creditPrice === 1 ? 'credit' : 'credits'}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Credits keep the exchange fair without using cash
            </p>
          </div>

          {/* ─── Badges ─── */}
          <div className="flex items-center justify-center gap-2.5">
            <Badge variant="default">
              {formatCategory(listing.category)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <AvailIcon size={11} />
              {availLabel}
            </Badge>
            <Badge variant={listing.type === 'offering' ? 'primary' : 'accent'}>
              {listing.type === 'offering' ? 'Offering' : 'Need'}
            </Badge>
            <Badge variant={isExpired ? 'outline' : 'default'}>
              {formatListingExpiration(listing)}
            </Badge>
          </div>

          {(isExpired || lifecycle.state === 'refresh_soon') && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold text-heading">
                {isExpired ? 'This listing has expired' : 'Refresh this listing soon'}
              </h3>
              <p className="text-xs leading-relaxed text-muted">
                {isOwner
                  ? 'Refresh it to keep it visible on the marketplace boards.'
                  : 'This listing is not accepting new responses right now.'}
              </p>
              {isOwner && (
                <form action={refreshListingFromDetailAction.bind(null, listing.id)}>
                  <Button type="submit" variant="secondary" size="sm" className="w-full">
                    <RefreshCw size={15} />
                    Refresh listing
                  </Button>
                </form>
              )}
            </Card>
          )}

          {/* ─── Description ─── */}
          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              About this {listing.type === 'offering' ? 'offering' : 'need'}
            </h3>
            <p className="text-sm text-body leading-relaxed">
              {listing.description}
            </p>
          </Card>

          {/* ─── Member info card ─── */}
          {listing.member && (
            <Link href={`/member/${listing.member.id}`} className="block">
              <Card className="flex items-center gap-3">
                <Avatar
                  src={listing.member.avatarUrl}
                  firstName={listing.member.firstName}
                  lastName={listing.member.lastName}
                  size="md"
                  isAvailable={listing.member.isAvailable}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-heading leading-tight">
                    {listing.member.firstName} {listing.member.lastName}
                  </p>
                  <p className="text-xs text-muted leading-snug">
                    {listing.member.neighborhood}
                  </p>
                </div>
                <span className="text-xs font-medium text-primary">
                  View profile
                </span>
              </Card>
            </Link>
          )}
        </div>
      </PageTransition>

      {/* ─── Sticky bottom CTA ─── */}
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
          <Link
            href={listing.type === 'need' ? '/needs' : '/offers'}
            className={isExpired && !isOwner ? 'block' : 'hidden'}
          >
            <Button variant="secondary" size="lg" className="w-full">
              Browse active listings
            </Button>
          </Link>
          {isOwner ? (
            lifecycle.state === 'active' ? (
              <Link href={`/listing/${listing.id}/matches`} className="block">
                <Button variant="primary" size="lg" className="w-full">
                  <CalendarCheck size={18} />
                  See Suggested Matches
                </Button>
              </Link>
            ) : (
              <form action={refreshListingFromDetailAction.bind(null, listing.id)}>
                <Button type="submit" variant="primary" size="lg" className="w-full">
                  <RefreshCw size={18} />
                  Refresh Listing
                </Button>
              </form>
            )
          ) : !isExpired && listing.type === 'offering' ? (
            <Link href={`/booking/${listing.id}`} className="block">
              <Button variant="primary" size="lg" className="w-full">
                <CalendarCheck size={18} />
                Request This Offer
              </Button>
            </Link>
          ) : !isExpired ? (
            <form action={respondToListingAction.bind(null, listing.id)}>
              <Button type="submit" variant="primary" size="lg" className="w-full">
                <MessageCircle size={18} />
                Respond to This Need
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </>
  )
}
