export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { SectionHeader } from '@/components/shared/section-header'
import { ListingSummaryCard } from '@/components/exchange/listing-summary-card'
import { ExchangeSummaryCard } from '@/components/exchange/exchange-summary-card'
import { HappeningsPreview } from '@/components/home/happenings-preview'
import { Badge, Card } from '@/components/ui'
import {
  ArrowRightLeft,
  CircleHelp,
  HandHeart,
  Plus,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Exchange } from '@/lib/exchange-engine'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatCredits(amount: number): string {
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
}

function isActiveExchange(exchange: Exchange): boolean {
  return !['completed', 'cancelled', 'disputed'].includes(exchange.status)
}

function ActionTile({
  href,
  title,
  description,
  icon: Icon,
  tone = 'surface',
}: {
  href: string
  title: string
  description: string
  icon: LucideIcon
  tone?: 'primary' | 'surface'
}) {
  const isPrimary = tone === 'primary'

  return (
    <Link
      href={href}
      className={
        isPrimary
          ? 'rounded-lg bg-primary p-4 text-primary-foreground shadow-card transition-colors hover:bg-primary-dark'
          : 'rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md'
      }
    >
      <Icon
        size={18}
        className={isPrimary ? 'text-primary-foreground' : 'text-primary'}
      />
      <p className="mt-3 text-sm font-semibold leading-tight">{title}</p>
      <p
        className={
          isPrimary
            ? 'mt-1 text-xs leading-snug text-primary-foreground/70'
            : 'mt-1 text-xs leading-snug text-muted'
        }
      >
        {description}
      </p>
    </Link>
  )
}

export default async function HomePage() {
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()

  const [wallet, needs, offers, exchanges, happenings] = await Promise.all([
    exchangeEngine.getWallet(currentMember.id),
    exchangeEngine.getListings({ type: 'need' }),
    exchangeEngine.getListings({ type: 'offering' }),
    exchangeEngine.getExchanges(currentMember.id),
    exchangeEngine.getHappenings(),
  ])

  const activeExchange = exchanges.find(isActiveExchange)
  const openNeeds = needs
    .filter((listing) => listing.memberId !== currentMember.id)
    .slice(0, 3)
  const availableOffers = offers
    .filter((listing) => listing.memberId !== currentMember.id)
    .slice(0, 3)

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-6">
        <div className="space-y-2">
          <Badge variant="primary">
            {currentMember.neighborhood} exchange network
          </Badge>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-heading">
              {getGreeting()}, {currentMember.firstName}
            </h1>
            <p className="mt-0.5 text-sm text-secondary">
              Ask for help, offer help, or close the loop on an exchange.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <ActionTile
            href="/profile/listing/new?type=need"
            title="Post a need"
            description="Tell neighbors what would help this week."
            icon={Plus}
            tone="primary"
          />
          <ActionTile
            href="/offers"
            title="Find help"
            description="Browse available offers near you."
            icon={HandHeart}
          />
          <ActionTile
            href="/needs"
            title="Help someone"
            description="Respond to open neighborhood needs."
            icon={CircleHelp}
          />
          <ActionTile
            href="/exchanges"
            title="My exchanges"
            description="Track requests, schedules, and reviews."
            icon={ArrowRightLeft}
          />
        </div>

        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <WalletCards size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Credits
              </p>
              <p className="text-sm text-secondary">
                Keep exchanges fair without using cash.
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-heading">
              {wallet.balance}
            </p>
            {wallet.escrowHeld > 0 && (
              <p className="text-xs font-medium text-muted">
                {wallet.escrowHeld} held
              </p>
            )}
          </div>
        </Card>

        {activeExchange && (
          <section className="space-y-3">
            <SectionHeader title="Needs Attention" href="/exchanges" />
            <ExchangeSummaryCard
              exchange={activeExchange}
              currentMemberId={currentMember.id}
            />
          </section>
        )}

        <section className="space-y-3">
          <SectionHeader title="Open Needs" href="/needs" />
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
            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-heading">
                No neighbor needs are open right now
              </p>
              <p className="mt-1 text-xs text-muted">
                Post your own need or check back after the next exchange event.
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeader title="Available Offers" href="/offers" />
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
            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-heading">
                No offers are available yet
              </p>
              <p className="mt-1 text-xs text-muted">
                Add something you can help with to seed the network.
              </p>
            </Card>
          )}
        </section>

        {happenings.length > 0 && (
          <section>
            <SectionHeader title="Exchange Events" href="/happenings" />
            <HappeningsPreview happenings={happenings.slice(0, 5)} />
          </section>
        )}

        <p className="px-1 text-center text-xs leading-relaxed text-muted">
          {formatCredits(wallet.balance)} available. Credits are a fairness
          tool for exchange, separate from any community fund.
        </p>
      </div>
    </PageTransition>
  )
}
