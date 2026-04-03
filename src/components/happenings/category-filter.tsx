'use client'

import { cn } from '@/lib/utils'
import type { HappeningCategory } from '@/lib/exchange-engine/types'
import {
  Baby,
  UtensilsCrossed,
  Store,
  Dumbbell,
  GraduationCap,
  PartyPopper,
  Heart,
  ArrowRightLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryOption {
  label: string
  value: HappeningCategory
  icon: LucideIcon
}

const CATEGORIES: CategoryOption[] = [
  { label: 'Kids', value: 'kids', icon: Baby },
  { label: 'Food', value: 'food', icon: UtensilsCrossed },
  { label: 'Markets', value: 'markets', icon: Store },
  { label: 'Fitness', value: 'fitness', icon: Dumbbell },
  { label: 'Classes', value: 'classes', icon: GraduationCap },
  { label: 'Social', value: 'social', icon: PartyPopper },
  { label: 'Community', value: 'community', icon: Heart },
  { label: 'Exchange Events', value: 'exchange_event', icon: ArrowRightLeft },
]

interface CategoryFilterProps {
  activeCategory: HappeningCategory | null
  onSelect: (category: HappeningCategory | null) => void
}

export function CategoryFilter({ activeCategory, onSelect }: CategoryFilterProps) {
  return (
    <div className="-mx-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
        {/* "All" chip */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
            'text-xs font-medium whitespace-nowrap select-none',
            'transition-colors duration-[var(--xm-transition-fast)]',
            activeCategory === null
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-hover text-secondary hover:bg-active',
          )}
        >
          All
        </button>

        {CATEGORIES.map(({ label, value, icon: Icon }) => {
          const isActive = activeCategory === value

          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(isActive ? null : value)}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5',
                'text-xs font-medium whitespace-nowrap select-none',
                'transition-colors duration-[var(--xm-transition-fast)]',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-hover text-secondary hover:bg-active',
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
