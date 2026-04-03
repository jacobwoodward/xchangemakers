'use client'

import { motion } from 'framer-motion'
import { Store, Users } from 'lucide-react'
import type { SearchResult } from '@/lib/exchange-engine'
import { ResultGroup } from './result-group'

interface SearchResultsProps {
  results: SearchResult | null
  isLoading: boolean
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg bg-surface p-3.5 shadow-card"
        >
          <div className="h-10 w-10 rounded-full bg-hover animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded bg-hover animate-pulse" />
            <div className="h-3 w-40 rounded bg-hover animate-pulse" />
          </div>
          <div className="h-3 w-12 rounded bg-hover animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!results) return null

  const hasShopLocal = results.shopLocal.length > 0
  const hasNeighbors = results.neighbors.length > 0

  if (!hasShopLocal && !hasNeighbors) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-5"
    >
      {hasShopLocal && (
        <ResultGroup
          title="Shop Local"
          members={results.shopLocal}
          icon={Store}
        />
      )}
      {hasNeighbors && (
        <ResultGroup
          title="Neighbors"
          members={results.neighbors}
          icon={Users}
        />
      )}
    </motion.div>
  )
}
