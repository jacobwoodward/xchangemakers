export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  CircleHelp,
  ListFilter,
  Plus,
  Radar,
} from 'lucide-react'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { AvailabilityCard } from '@/components/needs/availability-card'
import { HelperPreferencesForm } from '@/components/needs/helper-preferences-form'
import { TimedNeedCard } from '@/components/needs/timed-need-card'
import { LocalBusinessCard } from '@/components/local/local-business-card'
import { Badge, Card } from '@/components/ui'
import { LISTING_CATEGORIES, formatCategory } from '@/lib/marketplace'
import type {
  ListingCategory,
  MarketplaceDistanceScope,
  TimedNeedFilters,
} from '@/lib/exchange-engine'

type PageSearchParams = Record<string, string | string[] | undefined>

const CATEGORY_VALUES = new Set(LISTING_CATEGORIES.map((category) => category.value))
const TIMEFRAME_VALUES = new Set(['today', 'week', 'month'])
const DISTANCE_VALUES = new Set(['community', 'nearby', 'all'])

function readParam(params: PageSearchParams, key: string): string {
  const value = params[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function parseFilters(params: PageSearchParams): TimedNeedFilters {
  const category = readParam(params, 'category')
  const timeframe = readParam(params, 'timeframe')
  const distance = readParam(params, 'distance')

  return {
    category: CATEGORY_VALUES.has(category as ListingCategory)
      ? (category as ListingCategory)
      : undefined,
    timeframe: TIMEFRAME_VALUES.has(timeframe)
      ? (timeframe as TimedNeedFilters['timeframe'])
      : 'week',
    urgentOnly: readParam(params, 'urgent') === '1',
    distance: DISTANCE_VALUES.has(distance)
      ? (distance as MarketplaceDistanceScope)
      : 'community',
    includeOwn: true,
  }
}

function hrefFor(
  current: TimedNeedFilters,
  next: Partial<Omit<TimedNeedFilters, 'category'>> & {
    category?: ListingCategory | null
    urgentOnly?: boolean
  },
): string {
  const params = new URLSearchParams()
  const category = next.category === null ? undefined : next.category ?? current.category
  const timeframe = next.timeframe ?? current.timeframe
  const distance = next.distance ?? current.distance
  const urgentOnly = next.urgentOnly ?? current.urgentOnly

  if (category) params.set('category', category)
  if (timeframe && timeframe !== 'week') params.set('timeframe', timeframe)
  if (distance && distance !== 'community') params.set('distance', distance)
  if (urgentOnly) params.set('urgent', '1')

  const query = params.toString()
  return query ? `/needs?${query}` : '/needs'
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground'
          : 'inline-flex h-9 items-center rounded-full border border-border-light bg-surface px-4 text-sm font-semibold text-secondary'
      }
    >
      {children}
    </Link>
  )
}

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  await exchangeEngine.initialize()

  const filters = parseFilters(params)
  const postedId = readParam(params, 'posted')
  const currentMember = await exchangeEngine.getCurrentMember()
  const [helperPreferences, timedNeeds, localFallbacks, availabilitySlots] =
    await Promise.all([
    exchangeEngine.getHelperPreferences(),
    exchangeEngine.getTimedNeeds(filters),
    exchangeEngine.getLocalBusinessFallbacks(filters.category, 3),
    exchangeEngine.getAvailability(currentMember.id),
  ])

  const urgentCount = timedNeeds.filter((need) => need.listing.isUrgent).length
  const ownedNeeds = timedNeeds.filter((need) => need.isOwnedByCurrentMember)
  const openHelperOffers = ownedNeeds.reduce(
    (sum, need) =>
      sum + need.offers.filter((offer) => offer.status === 'offered').length,
    0,
  )
  const availableToHelp = timedNeeds.filter(
    (need) => !need.isOwnedByCurrentMember && !need.currentMemberOffer,
  )

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="primary">Needs Calendar</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
                Help timed needs nearby
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                See who needs help, when they need it, and whether you can take
                the task.
              </p>
            </div>
            <Link
              href="/profile/listing/new?type=need"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              <Plus size={17} />
              Post
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Card className="px-3 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Radar size={16} />
                <span className="text-lg font-bold tabular-nums">
                  {availableToHelp.length}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug text-muted">
                you can help
              </p>
            </Card>
            <Card className="px-3 py-3">
              <div className="flex items-center gap-2 text-error">
                <Bell size={16} />
                <span className="text-lg font-bold tabular-nums">
                  {urgentCount}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug text-muted">
                urgent
              </p>
            </Card>
            <Card className="px-3 py-3">
              <div className="flex items-center gap-2 text-accent-dark">
                <CheckCircle2 size={16} />
                <span className="text-lg font-bold tabular-nums">
                  {openHelperOffers}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug text-muted">
                offers to review
              </p>
            </Card>
          </div>
        </div>

        {postedId && (
          <Card className="flex items-start gap-3 border-primary/25 bg-primary/5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-heading">
                Need posted to the calendar
              </p>
              <p className="mt-1 text-xs leading-relaxed text-secondary">
                Helpers who match the category and timing can now offer a slot.
              </p>
            </div>
            <Link
              href="/needs"
              className="shrink-0 text-xs font-semibold text-primary hover:underline"
            >
              Clear
            </Link>
          </Card>
        )}

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-heading">Show me</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              href={hrefFor(filters, { timeframe: 'today' })}
              active={filters.timeframe === 'today'}
            >
              Today
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { timeframe: 'week' })}
              active={filters.timeframe === 'week'}
            >
              This week
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { timeframe: 'month' })}
              active={filters.timeframe === 'month'}
            >
              This month
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { urgentOnly: !filters.urgentOnly })}
              active={Boolean(filters.urgentOnly)}
            >
              Urgent
            </FilterPill>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              href={hrefFor(filters, { distance: 'community' })}
              active={filters.distance === 'community'}
            >
              My community
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { distance: 'nearby' })}
              active={filters.distance === 'nearby'}
            >
              Within 5 mi
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { distance: 'all' })}
              active={filters.distance === 'all'}
            >
              All
            </FilterPill>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              href={hrefFor(filters, { category: null })}
              active={!filters.category}
            >
              All
            </FilterPill>
            {LISTING_CATEGORIES.map((category) => (
              <FilterPill
                key={category.value}
                href={hrefFor(filters, { category: category.value })}
                active={filters.category === category.value}
              >
                {category.label}
              </FilterPill>
            ))}
          </div>
        </Card>

        <AvailabilityCard
          slots={availabilitySlots}
          memberName={currentMember.firstName}
          availabilityNote={currentMember.availabilityNote}
        />

        <HelperPreferencesForm preferences={helperPreferences} />

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-heading">
                {filters.category
                  ? `${formatCategory(filters.category)} needs`
                  : 'Timed needs'}
              </h2>
              <p className="text-xs text-muted">
                {timedNeeds.length} matching this view
              </p>
            </div>
            <Link
              href="/happenings"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Happenings
            </Link>
          </div>

          {timedNeeds.length > 0 ? (
            <div className="space-y-3">
              {timedNeeds.map((need) => (
                <TimedNeedCard key={need.listing.id} need={need} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="py-8 text-center">
                <CircleHelp size={24} className="mx-auto text-muted" />
                <p className="mt-3 text-sm font-semibold text-heading">
                  No timed needs match this view
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Try a broader timeframe or post a concrete need with a few time
                  windows.
                </p>
              </Card>

              {localFallbacks.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-heading">
                      Local help nearby
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Trusted business options when a neighbor is not available.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {localFallbacks.map((business) => (
                      <LocalBusinessCard
                        key={business.profile.id}
                        business={business}
                        source="fallback"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
