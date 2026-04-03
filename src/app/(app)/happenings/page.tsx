'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { Calendar } from 'lucide-react'
import { PageTransition } from '@/components/shared/page-transition'
import { CategoryFilter } from '@/components/happenings/category-filter'
import { HappeningList } from '@/components/happenings/happening-list'
import type { HappeningCategory, Happening } from '@/lib/exchange-engine'
import { getHappeningsAction } from './actions'

export default function HappeningsPage() {
  const [category, setCategory] = useState<HappeningCategory | null>(null)
  const [happenings, setHappenings] = useState<Happening[]>([])
  const [isInitial, setIsInitial] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Fetch happenings on mount and when category changes
  const fetchHappenings = useCallback((cat: HappeningCategory | null) => {
    startTransition(async () => {
      const result = await getHappeningsAction(cat ?? undefined)
      setHappenings(result)
      setIsInitial(false)
    })
  }, [])

  useEffect(() => {
    fetchHappenings(category)
  }, [category, fetchHappenings])

  const handleCategorySelect = useCallback((cat: HappeningCategory | null) => {
    setCategory(cat)
  }, [])

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-6 space-y-4">
        {/* ─── Title ─── */}
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--xm-text-heading)' }}
          >
            Happenings
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--xm-text-secondary)' }}
          >
            Events, workshops & community moments
          </p>
        </div>

        {/* ─── Sticky category filter ─── */}
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-2 bg-page">
          <CategoryFilter
            activeCategory={category}
            onSelect={handleCategorySelect}
          />
        </div>

        {/* ─── Content ─── */}
        {isInitial && isPending ? (
          <div className="flex flex-col items-center py-16">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--xm-bg-hover)' }}
            >
              <Calendar size={24} style={{ color: 'var(--xm-text-muted)' }} />
            </div>
            <p
              className="mt-3 text-sm font-medium"
              style={{ color: 'var(--xm-text-muted)' }}
            >
              Loading happenings...
            </p>
          </div>
        ) : (
          <HappeningList happenings={happenings} />
        )}
      </div>
    </PageTransition>
  )
}
