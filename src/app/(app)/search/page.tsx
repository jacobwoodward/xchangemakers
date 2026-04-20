'use client'

import { Suspense, useState, useEffect, useCallback, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageTransition } from '@/components/shared/page-transition'
import { SearchInput } from '@/components/search/search-input'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchResults } from '@/components/search/search-results'
import { SearchTypeToggle, type SearchScope } from '@/components/search/search-type-toggle'
import { EmptySearch } from '@/components/search/empty-search'
import type {
  SearchResult,
  ListingCategory,
} from '@/lib/exchange-engine'
import { searchMembers } from './actions'

function isValidCategory(value: string | null): value is ListingCategory {
  if (!value) return false
  return [
    'food',
    'services',
    'skills',
    'classes',
    'handmade',
    'wellness',
    'tech',
    'home',
    'kids',
    'other',
  ].includes(value)
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initial values from URL params so category/type links work from elsewhere.
  const initialCategoryParam = searchParams.get('category')
  const initialCategory = isValidCategory(initialCategoryParam)
    ? initialCategoryParam
    : null
  const initialScope: SearchScope =
    searchParams.get('type') === 'businesses' ? 'businesses' : 'neighbors'

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ListingCategory | null>(initialCategory)
  const [scope, setScope] = useState<SearchScope>(initialScope)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const executeSearch = useCallback(
    (q: string, cat: ListingCategory | null) => {
      if (!q && !cat) {
        setResults(null)
        setHasSearched(false)
        return
      }

      startTransition(async () => {
        const result = await searchMembers(q, cat ?? undefined)
        setResults(result)
        setHasSearched(true)
      })
    },
    [],
  )

  // Kick off an initial search if we landed here with a category filter.
  useEffect(() => {
    if (initialCategory) {
      executeSearch('', initialCategory)
    }
    // Only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      executeSearch(value, category)
    },
    [category, executeSearch],
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setResults(null)
    setHasSearched(false)
  }, [])

  const handleCategorySelect = useCallback(
    (cat: ListingCategory | null) => {
      setCategory(cat)
      executeSearch(query, cat)
    },
    [query, executeSearch],
  )

  const handleCategoryTap = useCallback(
    (cat: ListingCategory) => {
      setCategory(cat)
      executeSearch(query, cat)
    },
    [query, executeSearch],
  )

  const handleScopeChange = useCallback(
    (next: SearchScope) => {
      setScope(next)
      // Keep URL in sync so deep-linking works.
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'businesses') params.set('type', 'businesses')
      else params.delete('type')
      router.replace(`/search?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  // Narrow results to only the active scope before display.
  const scopedResults: SearchResult | null = results
    ? scope === 'businesses'
      ? { shopLocal: results.shopLocal, neighbors: [] }
      : { shopLocal: [], neighbors: results.neighbors }
    : null

  const hasResults =
    scopedResults &&
    (scopedResults.shopLocal.length > 0 || scopedResults.neighbors.length > 0)

  return (
    <div className="px-4 pt-12 pb-6 space-y-4">
      {/* ---- Header with back button ---- */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center h-9 w-9 rounded-full bg-hover text-secondary hover:bg-active transition-colors duration-[var(--xm-transition-fast)]"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-heading">Search</h1>
      </div>

      {/* ---- Sticky search input ---- */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-2 bg-page space-y-2.5">
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          onClear={handleClear}
        />
        <SearchTypeToggle value={scope} onChange={handleScopeChange} />
      </div>

      {/* ---- Category filters ---- */}
      <SearchFilters
        activeCategory={category}
        onSelect={handleCategorySelect}
      />

      {/* ---- Results or empty state ---- */}
      {hasResults || isPending ? (
        <SearchResults results={scopedResults} isLoading={isPending} />
      ) : (
        <EmptySearch
          hasQuery={hasSearched && !hasResults}
          onCategoryTap={handleCategoryTap}
        />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="px-4 pt-12 pb-6" />}>
        <SearchPageInner />
      </Suspense>
    </PageTransition>
  )
}
