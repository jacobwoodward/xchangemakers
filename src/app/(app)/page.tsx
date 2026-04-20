export const dynamic = 'force-dynamic'

import { exchangeEngine } from '@/lib/exchange-engine'
import type { ActivityFeedItem, ActivityType } from '@/lib/exchange-engine'
import { PageTransition } from '@/components/shared/page-transition'
import { SectionHeader } from '@/components/shared/section-header'
import { SearchPrompt } from '@/components/home/search-prompt'
import { TuBalanceCard } from '@/components/home/tu-balance-card'
import { TreasuryProgress } from '@/components/home/treasury-progress'
import { HappeningsPreview } from '@/components/home/happenings-preview'
import { ShopLocalCategories } from '@/components/home/shop-local-categories'
import {
  ArrowRightLeft,
  CalendarPlus,
  UserPlus,
  ListPlus,
  Trophy,
  BarChart3,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const ACTIVITY_ICON: Record<ActivityType, typeof ArrowRightLeft> = {
  exchange_completed: ArrowRightLeft,
  happening_posted: CalendarPlus,
  new_member: UserPlus,
  new_listing: ListPlus,
  treasury_milestone: Trophy,
  weekly_stats: BarChart3,
}

const ACTIVITY_LABEL: Record<ActivityType, (data: Record<string, unknown>) => string> = {
  // Kept intentionally vague — no provider/requester names, no amounts.
  // The activity feed is a positive public signal, not an exchange log.
  exchange_completed: () => 'Two neighbors completed an exchange',
  happening_posted: (d) =>
    `New happening: ${d.title ?? 'Untitled'}`,
  new_member: (d) =>
    `${d.memberName ?? 'A new neighbor'} joined the community`,
  new_listing: (d) =>
    `New ${d.listingType === 'need' ? 'need' : 'offering'}: ${d.title ?? 'Untitled'}`,
  treasury_milestone: (d) =>
    `Treasury reached ${d.milestone ?? 'a new milestone'}`,
  weekly_stats: () => 'Weekly community stats posted',
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const Icon = ACTIVITY_ICON[item.type] ?? ArrowRightLeft
  const label = ACTIVITY_LABEL[item.type]?.(item.data) ?? 'Community activity'
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
    addSuffix: true,
  })

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hover">
        <Icon size={14} className="text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-body leading-snug line-clamp-2">{label}</p>
        <p className="mt-0.5 text-xs text-muted tabular-nums">{timeAgo}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  // Fetch all data server-side
  await exchangeEngine.initialize()
  const currentMember = await exchangeEngine.getCurrentMember()
  const wallet = await exchangeEngine.getWallet(currentMember.id)
  const treasury = await exchangeEngine.getTreasury()
  const happenings = await exchangeEngine.getHappenings()
  const { items: activityItems } = await exchangeEngine.getActivityFeed()

  const recentActivity = activityItems.slice(0, 5)
  const greeting = getGreeting()

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-6">
        {/* ─── Greeting ─── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            {greeting}, {currentMember.firstName}
          </h1>
          <p className="mt-0.5 text-sm text-secondary">
            What will you exchange today?
          </p>
        </div>

        {/* ─── "What do you need today?" — hero search ─── */}
        <SearchPrompt />

        {/* ─── TU Balance ─── */}
        <TuBalanceCard
          balance={wallet.balance}
          monthlyEarned={wallet.monthlyEarned}
          escrowHeld={wallet.escrowHeld}
        />

        {/* ─── Treasury ─── */}
        <TreasuryProgress treasury={treasury} />

        {/* ─── Happenings ─── */}
        {happenings.length > 0 && (
          <section>
            <SectionHeader title="Happenings Near You" href="/happenings" />
            <HappeningsPreview happenings={happenings.slice(0, 5)} />
          </section>
        )}

        {/* ─── Shop Local (category-based, not people) ─── */}
        <section>
          <SectionHeader
            title="Shop Local"
            href="/search?type=businesses"
          />
          <ShopLocalCategories />
        </section>

        {/* ─── Recent Activity ─── */}
        {recentActivity.length > 0 && (
          <section>
            <SectionHeader title="Recent Activity" href="/activity" />
            <div className="mt-2 divide-y divide-border-light">
              {recentActivity.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  )
}
