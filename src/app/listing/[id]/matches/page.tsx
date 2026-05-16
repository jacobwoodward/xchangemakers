export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CircleHelp, HandHeart, Sparkles } from 'lucide-react'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageHeader } from '@/components/shared/page-header'
import { PageTransition } from '@/components/shared/page-transition'
import { ListingSummaryCard } from '@/components/exchange/listing-summary-card'
import { Badge, Card } from '@/components/ui'
import { formatCategory, formatCredits } from '@/lib/marketplace'

export default async function ListingMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await exchangeEngine.initialize()

  let listing
  try {
    listing = await exchangeEngine.getListing(id)
  } catch {
    notFound()
  }

  const matches = await exchangeEngine.getSuggestedMatchesForListing(id)
  const isNeed = listing.type === 'need'
  const oppositeLabel = isNeed ? 'offers' : 'open needs'
  const browseHref = isNeed ? '/offers' : '/needs'
  const createHref = isNeed
    ? '/profile/listing/new?type=offering'
    : '/profile/listing/new?type=need'

  return (
    <>
      <PageHeader title="Suggested matches" />
      <PageTransition>
        <div className="px-4 pt-16 pb-10 space-y-5">
          <section className="space-y-3">
            <Badge variant={isNeed ? 'accent' : 'primary'}>
              {isNeed ? 'Need posted' : 'Offer posted'}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-heading">
                {matches.length > 0
                  ? 'Start with these matches'
                  : 'No close matches yet'}
              </h1>
              <p className="text-sm leading-relaxed text-secondary">
                {matches.length > 0
                  ? `These ${oppositeLabel} line up with your category, community, credits, or availability.`
                  : `Your listing is live. Check the broader ${oppositeLabel} board or create the other side of the exchange loop.`}
              </p>
            </div>
          </section>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              {isNeed ? (
                <CircleHelp size={16} className="text-accent-dark" />
              ) : (
                <HandHeart size={16} className="text-primary" />
              )}
              <h2 className="text-sm font-semibold text-heading">
                Your listing
              </h2>
            </div>
            <div>
              <p className="text-base font-semibold leading-snug text-heading">
                {listing.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-secondary">
                {listing.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{formatCategory(listing.category)}</Badge>
              <Badge variant="outline">{formatCredits(listing.creditPrice)}</Badge>
            </div>
          </Card>

          {matches.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-heading">
                  Best matches
                </h2>
                <span className="text-xs font-medium text-muted">
                  {matches.length} found
                </span>
              </div>

              <div className="space-y-3">
                {matches.map((match) => (
                  <div key={match.listing.id} className="space-y-2">
                    <ListingSummaryCard
                      listing={match.listing}
                      context={match.listing.type === 'need' ? 'need' : 'offer'}
                    />
                    <div className="rounded-lg border border-border-light bg-surface px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <span
                            key={reason}
                            className="inline-flex items-center gap-1 rounded-full bg-hover px-2 py-1 text-[11px] font-medium text-secondary"
                          >
                            <Sparkles size={10} />
                            {reason}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={
                          isNeed
                            ? `/booking/${match.listing.id}`
                            : `/listing/${match.listing.id}`
                        }
                        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
                      >
                        {isNeed ? 'Request this offer' : 'Respond to this need'}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <Card className="space-y-3 text-center">
              <Sparkles size={24} className="mx-auto text-muted" />
              <p className="text-sm font-semibold text-heading">
                Your listing is active
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Matching gets stronger as the local board fills in. You can
                browse manually or seed the other side of the market.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={browseHref}
                  className="rounded-full border border-primary px-3 py-2 text-sm font-semibold text-primary"
                >
                  Browse
                </Link>
                <Link
                  href={createHref}
                  className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Add another
                </Link>
              </div>
            </Card>
          )}
        </div>
      </PageTransition>
    </>
  )
}
