import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Card } from '@/components/ui'
import {
  AVAILABILITY_OPTIONS,
  LISTING_CATEGORIES,
  type MarketplaceFilterValues,
  getActiveMarketplaceFilterCount,
} from '@/lib/marketplace'

interface MarketplaceFiltersProps {
  actionPath: string
  values: MarketplaceFilterValues
  submitLabel: string
}

export function MarketplaceFilters({
  actionPath,
  values,
  submitLabel,
}: MarketplaceFiltersProps) {
  const activeCount = getActiveMarketplaceFilterCount(values)

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-heading">Find a match</h2>
        </div>
        {activeCount > 0 && (
          <Link
            href={actionPath}
            className="text-xs font-medium text-primary hover:underline"
          >
            Reset filters
          </Link>
        )}
      </div>

      <form action={actionPath} className="space-y-3">
        <label className="relative block">
          <span className="sr-only">Search marketplace</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            name="q"
            type="search"
            defaultValue={values.query}
            placeholder="Search by keyword"
            className="w-full rounded-lg border border-border-light bg-surface py-2.5 pl-9 pr-3 text-sm text-body outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Category
            </span>
            <select
              name="category"
              defaultValue={values.category}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="all">All</option>
              {LISTING_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Timing
            </span>
            <select
              name="availability"
              defaultValue={values.availability}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="all">Any</option>
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Credits
            </span>
            <select
              name="credits"
              defaultValue={values.credits}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="any">Any</option>
              <option value="open">Open</option>
              <option value="1-2">1-2 credits</option>
              <option value="3-plus">3+ credits</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Scope
            </span>
            <select
              name="distance"
              defaultValue={values.distance}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="community">My community</option>
              <option value="nearby">Within 5 miles</option>
              <option value="all">All communities</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-light px-3 py-2.5">
            <input
              type="checkbox"
              name="trusted"
              value="1"
              defaultChecked={values.trustedOnly}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm font-medium text-body">
              Trusted members
            </span>
          </label>

          <label className="w-36 space-y-1">
            <span className="sr-only">Sort</span>
            <select
              name="sort"
              defaultValue={values.sort}
              className="w-full rounded-lg border border-border-light bg-surface px-3 py-2.5 text-sm text-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
              <option value="newest">Newest</option>
              <option value="credits_low">Low credits</option>
              <option value="credits_high">High credits</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="h-10 w-full rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark"
        >
          {submitLabel}
        </button>
      </form>
    </Card>
  )
}
