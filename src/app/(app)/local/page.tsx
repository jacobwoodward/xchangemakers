export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  HeartHandshake,
  Home,
  Map,
  MoreHorizontal,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { LocalBusinessCard } from '@/components/local/local-business-card'
import { Badge, Card } from '@/components/ui'
import { exchangeEngine } from '@/lib/exchange-engine'
import { BUSINESS_CATEGORIES } from '@/lib/local-business'
import type { BusinessCategory } from '@/lib/exchange-engine'

type PageSearchParams = Record<string, string | string[] | undefined>

const CATEGORY_VALUES = new Set(BUSINESS_CATEGORIES.map((category) => category.value))

function readParam(params: PageSearchParams, key: string): string {
  const value = params[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function hrefFor(category?: BusinessCategory | null): string {
  return category ? `/local?category=${category}` : '/local'
}

function categoryIcon(category: BusinessCategory) {
  switch (category) {
    case 'food_drink':
      return UtensilsCrossed
    case 'home_services':
    case 'garden_outdoors':
      return Home
    case 'shopping_makers':
      return ShoppingBag
    case 'health_wellness':
      return Sparkles
    default:
      return MoreHorizontal
  }
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

export default async function LocalBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const params = await searchParams
  await exchangeEngine.initialize()

  const categoryParam = readParam(params, 'category')
  const category = CATEGORY_VALUES.has(categoryParam as BusinessCategory)
    ? (categoryParam as BusinessCategory)
    : undefined

  const businesses = await exchangeEngine.getLocalBusinesses({
    category,
    limit: 24,
  })
  const favorites = businesses.filter((business) => business.profile.isCommunityFavorite)

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="primary">Shop Local</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-heading">
                Local businesses near you
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-secondary">
                Trusted town options when a neighbor exchange is not the right fit.
              </p>
            </div>
            <Link
              href="/search?type=businesses"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-card"
              aria-label="Search local businesses"
            >
              <Search size={18} />
            </Link>
          </div>

          <Card className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-primary">
                <HeartHandshake size={16} />
                <span className="text-lg font-bold tabular-nums">
                  {businesses.length}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-muted">local</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-success">
                <Sparkles size={16} />
                <span className="text-lg font-bold tabular-nums">
                  {favorites.length}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-muted">favorites</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-accent-dark">
                <Map size={16} />
                <span className="text-lg font-bold tabular-nums">5 mi</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-muted">radius</p>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill href={hrefFor(null)} active={!category}>
            All
          </FilterPill>
          {BUSINESS_CATEGORIES.map((option) => {
            const Icon = categoryIcon(option.value)
            return (
              <FilterPill
                key={option.value}
                href={hrefFor(option.value)}
                active={category === option.value}
              >
                <Icon size={14} />
                {option.label}
              </FilterPill>
            )
          })}
        </div>

        {businesses.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-heading">
                {category ? 'Matching local options' : 'Nearby favorites'}
              </h2>
              <Link
                href="/needs"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Needs
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {businesses.map((business) => (
                <LocalBusinessCard
                  key={business.profile.id}
                  business={business}
                />
              ))}
            </div>
          </section>
        ) : (
          <Card className="py-8 text-center">
            <HeartHandshake size={24} className="mx-auto text-muted" />
            <p className="mt-3 text-sm font-semibold text-heading">
              No local businesses found
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Try another category or check neighbor needs first.
            </p>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
