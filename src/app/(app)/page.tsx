export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  ArrowRightLeft,
  Bell,
  CalendarDays,
  CircleHelp,
  MapPin,
  Plus,
  Radar,
  Store,
  WalletCards,
  Zap,
} from 'lucide-react'
import { exchangeEngine } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { SectionHeader } from '@/components/shared/section-header'
import { ExchangeSummaryCard } from '@/components/exchange/exchange-summary-card'
import { HappeningsPreview } from '@/components/home/happenings-preview'
import { LocalBusinessCard } from '@/components/local/local-business-card'
import { TimedNeedCard } from '@/components/needs/timed-need-card'
import { Badge, Card } from '@/components/ui'
import type { Exchange, Notification } from '@/lib/exchange-engine'
import type { LucideIcon } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatCredits(amount: number): string {
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
}

function formatAge(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(1, Math.round(diffMs / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function isActiveExchange(exchange: Exchange): boolean {
  return !['completed', 'cancelled', 'disputed'].includes(exchange.status)
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone = 'primary',
}: {
  icon: LucideIcon
  value: number
  label: string
  tone?: 'primary' | 'error' | 'accent'
}) {
  const toneClass =
    tone === 'error'
      ? 'text-error'
      : tone === 'accent'
        ? 'text-accent-dark'
        : 'text-primary'

  return (
    <Card className="px-3 py-3">
      <div className={`flex items-center gap-2 ${toneClass}`}>
        <Icon size={16} />
        <span className="text-lg font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-1 text-[11px] font-medium leading-snug text-muted">
        {label}
      </p>
    </Card>
  )
}

function PulseAction({
  href,
  title,
  description,
  icon: Icon,
  primary = false,
}: {
  href: string
  title: string
  description: string
  icon: LucideIcon
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'rounded-lg bg-primary p-4 text-primary-foreground shadow-card transition-colors hover:bg-primary-dark'
          : 'rounded-lg bg-surface p-4 text-heading shadow-card transition-shadow hover:shadow-md'
      }
    >
      <Icon
        size={18}
        className={primary ? 'text-primary-foreground' : 'text-primary'}
      />
      <p className="mt-3 text-sm font-semibold leading-tight">{title}</p>
      <p
        className={
          primary
            ? 'mt-1 text-xs leading-snug text-primary-foreground/70'
            : 'mt-1 text-xs leading-snug text-muted'
        }
      >
        {description}
      </p>
    </Link>
  )
}

function AlertsCard({
  notifications,
  unreadCount,
}: {
  notifications: Notification[]
  unreadCount: number
}) {
  if (notifications.length === 0) return null

  return (
    <section className="space-y-3">
      <SectionHeader title="Action Alerts" href="/notifications" />
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={17} className="text-primary" />
            <p className="text-sm font-bold text-heading">
              {unreadCount} unread
            </p>
          </div>
          <Link
            href="/notifications"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {notifications.map((item) => (
            <Link
              key={item.id}
              href={item.targetPath}
              className="block rounded-lg border border-border-light bg-hover px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-secondary">
                    {item.body}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-muted">
                  {formatAge(item.createdAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </section>
  )
}

export default async function PulsePage() {
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()

  const [
    wallet,
    timedNeeds,
    urgentNeeds,
    exchanges,
    happenings,
    unreadNotifications,
    unreadNotificationCount,
    localBusinesses,
  ] = await Promise.all([
    exchangeEngine.getWallet(currentMember.id),
    exchangeEngine.getTimedNeeds({
      timeframe: 'week',
      distance: 'community',
      includeOwn: false,
      limit: 3,
    }),
    exchangeEngine.getTimedNeeds({
      timeframe: 'week',
      urgentOnly: true,
      distance: 'community',
      includeOwn: false,
      limit: 2,
    }),
    exchangeEngine.getExchanges(currentMember.id),
    exchangeEngine.getHappenings(),
    exchangeEngine.getNotifications({ unreadOnly: true, limit: 3 }),
    exchangeEngine.getUnreadNotificationCount(),
    exchangeEngine.getLocalBusinessFallbacks(null, 2),
  ])

  const activeExchange = exchanges.find(isActiveExchange)
  const availableToHelp = timedNeeds.filter(
    (need) => !need.currentMemberOffer && !need.isOwnedByCurrentMember,
  )
  const primaryNeeds = urgentNeeds.length > 0 ? urgentNeeds : availableToHelp

  return (
    <PageTransition>
      <div className="space-y-6 px-4 pb-6 pt-12">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="primary">Pulse</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
                {getGreeting()}, {currentMember.firstName}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                Your Friendswood action queue for needs, exchanges, and local
                community activity.
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
            <StatCard
              icon={Radar}
              value={availableToHelp.length}
              label="you can help"
            />
            <StatCard
              icon={Zap}
              value={urgentNeeds.length}
              label="urgent"
              tone="error"
            />
            <StatCard
              icon={Bell}
              value={unreadNotificationCount}
              label="alerts"
              tone="accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <PulseAction
            href="/needs"
            title="Help someone"
            description="See timed needs that match your availability."
            icon={CircleHelp}
            primary
          />
          <PulseAction
            href="/happenings"
            title="Happenings"
            description="Browse local events and community meetups."
            icon={CalendarDays}
          />
          <PulseAction
            href="/exchanges"
            title="My exchanges"
            description="Track offers, rooms, and reviews."
            icon={ArrowRightLeft}
          />
          <PulseAction
            href="/local"
            title="Shop local"
            description="Find trusted nearby businesses."
            icon={Store}
          />
        </div>

        <AlertsCard
          notifications={unreadNotifications}
          unreadCount={unreadNotificationCount}
        />

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
          <SectionHeader
            title={urgentNeeds.length > 0 ? 'Needs Help Now' : 'Good Matches'}
            href="/needs"
          />
          {primaryNeeds.length > 0 ? (
            <div className="space-y-3">
              {primaryNeeds.map((need) => (
                <TimedNeedCard key={need.listing.id} need={need} />
              ))}
            </div>
          ) : (
            <Card className="py-6 text-center">
              <p className="text-sm font-semibold text-heading">
                No timed needs match you right now
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Update your helper preferences or check the calendar later.
              </p>
            </Card>
          )}
        </section>

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
                Balance available for neighbor exchanges.
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

        {happenings.length > 0 && (
          <section>
            <SectionHeader title="This Week Nearby" href="/happenings" />
            <HappeningsPreview happenings={happenings.slice(0, 5)} />
          </section>
        )}

        {localBusinesses.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-heading">
                  Local Backup
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} />
                  Trusted options near Friendswood
                </p>
              </div>
              <Link
                href="/local"
                className="text-sm font-semibold text-primary hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {localBusinesses.map((business) => (
                <LocalBusinessCard
                  key={business.profile.id}
                  business={business}
                  source="fallback"
                />
              ))}
            </div>
          </section>
        )}

        <p className="px-1 text-center text-xs leading-relaxed text-muted">
          {formatCredits(wallet.balance)} available. Credits keep exchanges
          fair without turning neighbor help into a cash marketplace.
        </p>
      </div>
    </PageTransition>
  )
}
