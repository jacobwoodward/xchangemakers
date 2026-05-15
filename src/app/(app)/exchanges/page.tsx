export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { ExchangeSummaryCard } from '@/components/exchange/exchange-summary-card'
import { Badge, Card } from '@/components/ui'
import { ArrowRightLeft, CircleHelp, HandHeart } from 'lucide-react'

export default async function ExchangesPage() {
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()
  const exchanges = await exchangeEngine.getExchanges(currentMember.id)

  const active = exchanges.filter(
    (exchange) =>
      exchange.status !== 'completed' &&
      exchange.status !== 'cancelled' &&
      exchange.status !== 'disputed',
  )
  const completed = exchanges.filter((exchange) => exchange.status === 'completed')

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-2">
          <Badge variant="primary">Exchange Rooms</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Your active exchanges
          </h1>
          <p className="text-sm leading-relaxed text-secondary">
            Requests, schedules, messages, held credits, completion, and review
            should all live in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/needs"
            className="rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md"
          >
            <CircleHelp size={18} className="text-accent-dark" />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Help a neighbor
            </p>
            <p className="mt-1 text-xs text-muted">
              Browse open needs.
            </p>
          </Link>
          <Link
            href="/offers"
            className="rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md"
          >
            <HandHeart size={18} className="text-primary" />
            <p className="mt-3 text-sm font-semibold leading-tight">
              Find help
            </p>
            <p className="mt-1 text-xs text-muted">
              Browse available offers.
            </p>
          </Link>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-heading">
              In progress
            </h2>
            <span className="text-xs font-medium text-muted">
              {active.length} active
            </span>
          </div>

          {active.length > 0 ? (
            <div className="space-y-2.5">
              {active.map((exchange) => (
                <ExchangeSummaryCard
                  key={exchange.id}
                  exchange={exchange}
                  currentMemberId={currentMember.id}
                />
              ))}
            </div>
          ) : (
            <Card className="py-8 text-center">
              <ArrowRightLeft size={24} className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-semibold text-heading">
                No active exchanges
              </p>
              <p className="mt-1 text-xs text-muted">
                Start by helping someone nearby or booking an offer.
              </p>
            </Card>
          )}
        </section>

        {completed.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-heading">
                Completed
              </h2>
              <span className="text-xs font-medium text-muted">
                {completed.length} total
              </span>
            </div>
            <div className="space-y-2.5">
              {completed.slice(0, 4).map((exchange) => (
                <ExchangeSummaryCard
                  key={exchange.id}
                  exchange={exchange}
                  currentMemberId={currentMember.id}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  )
}
