'use client'

import { motion } from 'framer-motion'
import {
  UtensilsCrossed,
  Wrench,
  Lightbulb,
  GraduationCap,
  Palette,
  Heart,
  Cpu,
  Home,
  Baby,
  SearchX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ListingCategory } from '@/lib/exchange-engine'
import { PressableCard } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CategoryTile {
  label: string
  value: ListingCategory
  icon: LucideIcon
  color: string
}

const CATEGORY_TILES: CategoryTile[] = [
  { label: 'Food', value: 'food', icon: UtensilsCrossed, color: 'bg-accent/10 text-accent-dark' },
  { label: 'Services', value: 'services', icon: Wrench, color: 'bg-primary/10 text-primary-dark' },
  { label: 'Skills', value: 'skills', icon: Lightbulb, color: 'bg-warning/10 text-accent-dark' },
  { label: 'Classes', value: 'classes', icon: GraduationCap, color: 'bg-info/10 text-info' },
  { label: 'Handmade', value: 'handmade', icon: Palette, color: 'bg-error/10 text-error' },
  { label: 'Wellness', value: 'wellness', icon: Heart, color: 'bg-primary-light/15 text-primary-dark' },
  { label: 'Tech', value: 'tech', icon: Cpu, color: 'bg-info/10 text-info' },
  { label: 'Home', value: 'home', icon: Home, color: 'bg-accent-light/15 text-accent-dark' },
  { label: 'Kids', value: 'kids', icon: Baby, color: 'bg-primary/10 text-primary' },
]

interface EmptySearchProps {
  hasQuery: boolean
  onCategoryTap: (category: ListingCategory) => void
}

export function EmptySearch({ hasQuery, onCategoryTap }: EmptySearchProps) {
  // No results state
  if (hasQuery) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-hover mb-4">
          <SearchX size={28} className="text-muted" />
        </div>
        <h3 className="text-base font-semibold text-heading">
          No neighbors found
        </h3>
        <p className="mt-1.5 text-sm text-muted max-w-[240px] leading-relaxed">
          Try a different search or browse categories below
        </p>
      </motion.div>
    )
  }

  // Suggested categories state
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">
        Browse categories
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORY_TILES.map(({ label, value, icon: Icon, color }) => (
          <PressableCard
            key={value}
            noPadding
            className="p-4"
            onClick={() => onCategoryTap(value)}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center justify-center h-9 w-9 rounded-lg',
                  color,
                )}
              >
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-heading">
                {label}
              </span>
            </div>
          </PressableCard>
        ))}
      </div>
    </motion.div>
  )
}
