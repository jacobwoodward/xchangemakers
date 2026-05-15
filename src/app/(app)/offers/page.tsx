export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { ListingSummaryCard } from '@/components/exchange/listing-summary-card'
import { MarketplaceFilters } from '@/components/exchange/marketplace-filters'
import { Badge, Card } from '@/components/ui'
import { CircleHelp, HandHeart, Plus } from 'lucide-react'
import {
  parseMarketplaceFilters,
  toMarketplaceListingFilters,
} from '@/lib/marketplace'

type PageSearchParams = Record<string, string | string[] | undefined>

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()
  const filterValues = parseMarketplaceFilters(params)
  const availableOffers = await exchangeEngine.getMarketplaceListings(
    toMarketplaceListingFilters(filterValues, 'offering'),
  )

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-2">
          <Badge variant="primary">Offers</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Find help you can trust
          </h1>
          <p className="text-sm leading-relaxed text-secondary">
            Browse people, skills, goods, and services already available in the
            community.
          </p>
          <p className="text-xs font-medium text-muted">
            Browsing {currentMember.neighborhood} by default.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/profile/listing/new?type=offering"
            className="rounded-lg bg-primary p-4 text-primary-foreground shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={18} />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Add an offer
            </p>
            <p className="mt-1 text-xs text-primary-foreground/70">
              Share what you can help with.
            </p>
          </Link>
          <Link
            href="/needs"
            className="rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md"
          >
            <CircleHelp size={18} className="text-accent-dark" />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Open needs
            </p>
            <p className="mt-1 text-xs text-muted">
              See who needs help now.
            </p>
          </Link>
        </div>

        <MarketplaceFilters
          actionPath="/offers"
          values={filterValues}
          submitLabel="Update offers"
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">
              Available offers
            </h2>
            <span className="text-xs font-medium text-muted">
              {availableOffers.length} matching
            </span>
          </div>

          {availableOffers.length > 0 ? (
            <div className="space-y-2.5">
              {availableOffers.map((listing) => (
                <ListingSummaryCard
                  key={listing.id}
                  listing={listing}
                  context="offer"
                />
              ))}
            </div>
          ) : (
            <Card className="py-8 text-center">
              <HandHeart size={24} className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-semibold text-heading">
                No offers yet
              </p>
              <p className="mt-1 text-xs text-muted">
                Add the first offer so neighbors can find help.
              </p>
            </Card>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
