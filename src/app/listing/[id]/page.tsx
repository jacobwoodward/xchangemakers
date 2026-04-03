import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { Card, Avatar, Badge, Button } from '@/components/ui'
import {
  Repeat,
  CalendarClock,
  PartyPopper,
  Zap,
  CalendarCheck,
} from 'lucide-react'
import type { AvailabilityType } from '@/lib/exchange-engine'

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

  const AvailIcon = AVAILABILITY_ICON[listing.availabilityType] ?? Repeat
  const availLabel = AVAILABILITY_LABEL[listing.availabilityType] ?? listing.availabilityType

  return (
    <>
      <PageHeader title={listing.title} />
      <PageTransition>
        <div className="pt-16 pb-28 px-4 space-y-5">
          {/* ─── Price hero ─── */}
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-primary" />
              <span className="text-4xl font-bold tracking-tight text-primary tabular-nums">
                {listing.creditPrice}
              </span>
              <span className="text-lg font-semibold text-primary/60">EU</span>
            </div>
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
          </div>

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
            href={`/booking/${listing.id}`}
            className="block"
          >
            <Button variant="primary" size="lg" className="w-full">
              <CalendarCheck size={18} />
              Book This
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
