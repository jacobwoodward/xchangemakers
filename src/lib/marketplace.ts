import type {
  AvailabilityType,
  ListingCategory,
  ListingType,
  MarketplaceDistanceScope,
  MarketplaceListingFilters,
  MarketplaceSort,
} from '@/lib/exchange-engine'

export const LISTING_CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'services', label: 'Services' },
  { value: 'skills', label: 'Skills' },
  { value: 'classes', label: 'Classes' },
  { value: 'handmade', label: 'Handmade' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'tech', label: 'Tech' },
  { value: 'home', label: 'Home' },
  { value: 'kids', label: 'Kids' },
  { value: 'other', label: 'Other' },
]

export const AVAILABILITY_OPTIONS: {
  value: AvailabilityType
  label: string
  hint: string
}[] = [
  { value: 'ongoing', label: 'Ongoing', hint: 'Available regularly' },
  { value: 'one_time', label: 'One-time', hint: 'Single occurrence' },
  { value: 'event_only', label: 'Event only', hint: 'Tied to an event' },
]

export type CreditFilter = 'any' | 'open' | '1-2' | '3-plus'

export interface MarketplaceFilterValues {
  query: string
  category: ListingCategory | 'all'
  availability: AvailabilityType | 'all'
  credits: CreditFilter
  distance: MarketplaceDistanceScope
  trustedOnly: boolean
  sort: MarketplaceSort
}

type RawSearchParams = Record<string, string | string[] | undefined>

const CATEGORY_VALUES = new Set(LISTING_CATEGORIES.map((c) => c.value))
const AVAILABILITY_VALUES = new Set(AVAILABILITY_OPTIONS.map((a) => a.value))
const CREDIT_VALUES = new Set<CreditFilter>(['any', 'open', '1-2', '3-plus'])
const DISTANCE_VALUES = new Set<MarketplaceDistanceScope>([
  'community',
  'nearby',
  'all',
])
const SORT_VALUES = new Set<MarketplaceSort>([
  'newest',
  'credits_low',
  'credits_high',
])

function readParam(params: RawSearchParams, key: string): string {
  const value = params[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export function parseMarketplaceFilters(
  searchParams: RawSearchParams,
): MarketplaceFilterValues {
  const category = readParam(searchParams, 'category')
  const availability = readParam(searchParams, 'availability')
  const credits = readParam(searchParams, 'credits')
  const distance = readParam(searchParams, 'distance')
  const sort = readParam(searchParams, 'sort')

  return {
    query: readParam(searchParams, 'q').trim(),
    category: CATEGORY_VALUES.has(category as ListingCategory)
      ? (category as ListingCategory)
      : 'all',
    availability: AVAILABILITY_VALUES.has(availability as AvailabilityType)
      ? (availability as AvailabilityType)
      : 'all',
    credits: CREDIT_VALUES.has(credits as CreditFilter)
      ? (credits as CreditFilter)
      : 'any',
    distance: DISTANCE_VALUES.has(distance as MarketplaceDistanceScope)
      ? (distance as MarketplaceDistanceScope)
      : 'community',
    trustedOnly: readParam(searchParams, 'trusted') === '1',
    sort: SORT_VALUES.has(sort as MarketplaceSort)
      ? (sort as MarketplaceSort)
      : 'newest',
  }
}

export function toMarketplaceListingFilters(
  values: MarketplaceFilterValues,
  type: ListingType,
): MarketplaceListingFilters {
  const filters: MarketplaceListingFilters = {
    type,
    query: values.query || undefined,
    category: values.category === 'all' ? undefined : values.category,
    availabilityType:
      values.availability === 'all' ? undefined : values.availability,
    distance: values.distance,
    trustedOnly: values.trustedOnly,
    sort: values.sort,
  }

  if (values.credits === 'open') {
    filters.maxCredits = 0
  } else if (values.credits === '1-2') {
    filters.minCredits = 1
    filters.maxCredits = 2
  } else if (values.credits === '3-plus') {
    filters.minCredits = 3
  }

  if (values.distance === 'nearby') {
    filters.radius = 5
  }

  return filters
}

export function getActiveMarketplaceFilterCount(
  values: MarketplaceFilterValues,
): number {
  return [
    values.query,
    values.category !== 'all',
    values.availability !== 'all',
    values.credits !== 'any',
    values.distance !== 'community',
    values.trustedOnly,
    values.sort !== 'newest',
  ].filter(Boolean).length
}

export function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function formatCredits(amount: number): string {
  if (amount === 0) return 'Open'
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
}
