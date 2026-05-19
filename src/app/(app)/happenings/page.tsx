export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  ArrowRightLeft,
  Baby,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  Heart,
  ListFilter,
  PartyPopper,
  Plus,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { HappeningCard } from '@/components/happenings/happening-card'
import { Badge, Card } from '@/components/ui'
import { exchangeEngine } from '@/lib/exchange-engine'
import { formatHappeningCategory } from '@/lib/happenings'
import type { Happening, HappeningCategory, HappeningFilters } from '@/lib/exchange-engine'

type PageSearchParams = Record<string, string | string[] | undefined>

const CATEGORY_OPTIONS: {
  label: string
  value: HappeningCategory
  icon: LucideIcon
}[] = [
  { label: formatHappeningCategory('kids'), value: 'kids', icon: Baby },
  { label: formatHappeningCategory('food'), value: 'food', icon: UtensilsCrossed },
  { label: formatHappeningCategory('markets'), value: 'markets', icon: Store },
  { label: formatHappeningCategory('fitness'), value: 'fitness', icon: Dumbbell },
  { label: formatHappeningCategory('classes'), value: 'classes', icon: GraduationCap },
  { label: formatHappeningCategory('social'), value: 'social', icon: PartyPopper },
  { label: formatHappeningCategory('community'), value: 'community', icon: Heart },
  { label: formatHappeningCategory('exchange_event'), value: 'exchange_event', icon: ArrowRightLeft },
]

const CATEGORY_VALUES = new Set(CATEGORY_OPTIONS.map((category) => category.value))
const TIMEFRAME_VALUES = new Set(['week', 'month'])

const dayNameFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const dayNumberFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' })
const headingFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

function readParam(params: PageSearchParams, key: string): string {
  const value = params[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function weekDays(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return date
  })
}

function parseFilters(params: PageSearchParams): HappeningFilters {
  const category = readParam(params, 'category')
  const timeframe = readParam(params, 'timeframe')
  const day = readParam(params, 'day')

  return {
    category: CATEGORY_VALUES.has(category as HappeningCategory)
      ? (category as HappeningCategory)
      : undefined,
    timeframe: TIMEFRAME_VALUES.has(timeframe)
      ? (timeframe as HappeningFilters['timeframe'])
      : 'week',
    day: isDateKey(day) ? day : undefined,
  }
}

type HappeningsHrefPatch = Omit<Partial<HappeningFilters>, 'category' | 'day'> & {
  category?: HappeningCategory | null
  day?: string | null
}

function hrefFor(current: HappeningFilters, next: HappeningsHrefPatch): string {
  const params = new URLSearchParams()
  const category = next.category === null ? undefined : next.category ?? current.category
  const day = next.day === null ? undefined : next.day ?? current.day
  const timeframe = day ? undefined : next.timeframe ?? current.timeframe

  if (category) params.set('category', category)
  if (day) params.set('day', day)
  if (timeframe && timeframe !== 'week') params.set('timeframe', timeframe)

  const query = params.toString()
  return query ? `/happenings?${query}` : '/happenings'
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
          ? 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm'
          : 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-light bg-surface px-4 text-sm font-semibold text-secondary'
      }
    >
      {children}
    </Link>
  )
}

function buildCountsByDay(happenings: Happening[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const happening of happenings) {
    const key = dateKey(new Date(happening.startAt))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function headingFor(filters: HappeningFilters): string {
  if (filters.day) {
    return headingFormatter.format(new Date(`${filters.day}T00:00:00`))
  }
  return filters.timeframe === 'month' ? 'This Month' : 'This Week'
}

export default async function HappeningsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  await exchangeEngine.initialize()

  const filters = parseFilters(params)
  const [happenings, weekHappenings] = await Promise.all([
    exchangeEngine.getHappenings(filters),
    exchangeEngine.getHappenings({
      category: filters.category,
      timeframe: 'week',
      limit: 100,
    }),
  ])
  const days = weekDays()
  const todayKey = dateKey(days[0])
  const countsByDay = buildCountsByDay(weekHappenings)
  const activeCategory = filters.category ?? null
  const activeDay = filters.day ?? (!filters.timeframe || filters.timeframe === 'week' ? todayKey : '')
  const featured = happenings[0]
  const remaining = featured ? happenings.slice(1) : happenings

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="primary">Happenings</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
                Community calendar
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                Events, groups, and workshops around Friendswood.
              </p>
            </div>
            <Link
              href="/happenings/new"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              <Plus size={17} />
              Create
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-hover p-1">
            <Link
              href="/needs"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-secondary"
            >
              <Heart size={16} />
              Needs Calendar
            </Link>
            <Link
              href="/happenings"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-surface text-sm font-semibold text-primary shadow-sm"
            >
              <CalendarDays size={16} />
              Happenings
            </Link>
          </div>
        </div>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-heading">This Week</h2>
            </div>
            <Link
              href={hrefFor(filters, { day: null, timeframe: 'month' })}
              className="text-xs font-semibold text-primary"
            >
              See month
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((date) => {
              const key = dateKey(date)
              const isActive = activeDay === key
              const count = countsByDay.get(key) ?? 0

              return (
                <Link
                  key={key}
                  href={hrefFor(filters, { day: key })}
                  className={
                    isActive
                      ? 'flex min-h-16 flex-col items-center justify-center rounded-xl bg-primary px-1 text-primary-foreground shadow-sm'
                      : 'flex min-h-16 flex-col items-center justify-center rounded-xl border border-border-light bg-surface px-1 text-secondary'
                  }
                >
                  <span className="text-[11px] font-medium">
                    {dayNameFormatter.format(date)}
                  </span>
                  <span className="text-base font-bold leading-tight">
                    {dayNumberFormatter.format(date)}
                  </span>
                  <span className="mt-0.5 text-[10px] opacity-80">
                    {count || ''}
                  </span>
                </Link>
              )
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <ListFilter size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-heading">Show me</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              href={hrefFor(filters, { category: null })}
              active={activeCategory === null}
            >
              All
            </FilterPill>
            {CATEGORY_OPTIONS.map(({ label, value, icon: Icon }) => (
              <FilterPill
                key={value}
                href={hrefFor(filters, { category: value })}
                active={activeCategory === value}
              >
                <Icon size={14} />
                {label}
              </FilterPill>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterPill
              href={hrefFor(filters, { day: null, timeframe: 'week' })}
              active={!filters.day && filters.timeframe === 'week'}
            >
              This week
            </FilterPill>
            <FilterPill
              href={hrefFor(filters, { day: null, timeframe: 'month' })}
              active={!filters.day && filters.timeframe === 'month'}
            >
              This month
            </FilterPill>
          </div>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-heading">
              {headingFor(filters)}
            </h2>
            <span className="text-xs font-medium text-muted">
              {happenings.length} {happenings.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {featured ? (
            <div className="space-y-3">
              <HappeningCard happening={featured} />
              {remaining.length > 0 && (
                <div className="space-y-3">
                  {remaining.map((happening) => (
                    <HappeningCard key={happening.id} happening={happening} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Card className="py-8 text-center">
              <CalendarDays size={24} className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-semibold text-heading">
                No happenings found
              </p>
              <p className="mt-1 text-sm text-secondary">
                Try another day or create the first event.
              </p>
              <Link
                href="/happenings/new"
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Plus size={16} />
                Create Event
              </Link>
            </Card>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
