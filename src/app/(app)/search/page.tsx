'use client'

import { useState, useCallback, useTransition } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageTransition } from '@/components/shared/page-transition'
import { SearchInput } from '@/components/search/search-input'
import { SearchFilters } from '@/components/search/search-filters'
import { SearchResults } from '@/components/search/search-results'
import { EmptySearch } from '@/components/search/empty-search'
import type { SearchResult, ListingCategory } from '@/lib/exchange-engine'
import { searchMembers } from './actions'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ListingCategory | null>(null)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const executeSearch = useCallback(
    (q: string, cat: ListingCategory | null) => {
      // Only search if there's a query or a category filter
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

  const hasResults =
    results &&
    (results.shopLocal.length > 0 || results.neighbors.length > 0)

  return (
    <PageTransition>
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
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-2 bg-page">
          <SearchInput
            value={query}
            onChange={handleQueryChange}
            onClear={handleClear}
          />
        </div>

        {/* ---- Category filters ---- */}
        <SearchFilters
          activeCategory={category}
          onSelect={handleCategorySelect}
        />

        {/* ---- Results or empty state ---- */}
        {hasResults || isPending ? (
          <SearchResults results={results} isLoading={isPending} />
        ) : (
          <EmptySearch
            hasQuery={hasSearched && !hasResults}
            onCategoryTap={handleCategoryTap}
          />
        )}
      </div>
    </PageTransition>
  )
}
