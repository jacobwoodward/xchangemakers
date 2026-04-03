'use client'

import { cn } from '@/lib/utils'
import type { ListingCategory } from '@/lib/exchange-engine'
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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryOption {
  label: string
  value: ListingCategory
  icon: LucideIcon
}

const CATEGORIES: CategoryOption[] = [
  { label: 'Food', value: 'food', icon: UtensilsCrossed },
  { label: 'Services', value: 'services', icon: Wrench },
  { label: 'Skills', value: 'skills', icon: Lightbulb },
  { label: 'Classes', value: 'classes', icon: GraduationCap },
  { label: 'Handmade', value: 'handmade', icon: Palette },
  { label: 'Wellness', value: 'wellness', icon: Heart },
  { label: 'Tech', value: 'tech', icon: Cpu },
  { label: 'Home', value: 'home', icon: Home },
  { label: 'Kids', value: 'kids', icon: Baby },
]

interface SearchFiltersProps {
  activeCategory: ListingCategory | null
  onSelect: (category: ListingCategory | null) => void
}

export function SearchFilters({ activeCategory, onSelect }: SearchFiltersProps) {
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

export { CATEGORIES }
