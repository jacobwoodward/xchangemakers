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

export default async function NeedsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()
  const filterValues = parseMarketplaceFilters(params)
  const openNeeds = await exchangeEngine.getMarketplaceListings(
    toMarketplaceListingFilters(filterValues, 'need'),
  )

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-2">
          <Badge variant="accent">Needs Board</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Help someone nearby
          </h1>
          <p className="text-sm leading-relaxed text-secondary">
            Open requests from neighbors. Pick one you can help with, agree on
            scope, and turn it into a trusted exchange.
          </p>
          <p className="text-xs font-medium text-muted">
            Browsing {currentMember.neighborhood} by default.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/profile/listing/new?type=need"
            className="rounded-lg bg-primary p-4 text-primary-foreground shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={18} />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Post a need
            </p>
            <p className="mt-1 text-xs text-primary-foreground/70">
              Ask the community for help.
            </p>
          </Link>
          <Link
            href="/offers"
            className="rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md"
          >
            <HandHeart size={18} className="text-primary" />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Browse offers
            </p>
            <p className="mt-1 text-xs text-muted">
              Find help already available.
            </p>
          </Link>
        </div>

        <MarketplaceFilters
          actionPath="/needs"
          values={filterValues}
          submitLabel="Update needs"
        />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">
              Open needs
            </h2>
            <span className="text-xs font-medium text-muted">
              {openNeeds.length} matching
            </span>
          </div>

          {openNeeds.length > 0 ? (
            <div className="space-y-2.5">
              {openNeeds.map((listing) => (
                <ListingSummaryCard
                  key={listing.id}
                  listing={listing}
                  context="need"
                />
              ))}
            </div>
          ) : (
            <Card className="py-8 text-center">
              <CircleHelp size={24} className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-semibold text-heading">
                No open needs yet
              </p>
              <p className="mt-1 text-xs text-muted">
                Post the first request and give the community something real to
                respond to.
              </p>
            </Card>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
