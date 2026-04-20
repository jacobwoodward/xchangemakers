'use client'

import { Users, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
export type SearchScope = 'neighbors' | 'businesses'

interface SearchTypeToggleProps {
  value: SearchScope
  onChange: (value: SearchScope) => void
}

const TABS: { value: SearchScope; label: string; Icon: typeof Users }[] = [
  { value: 'neighbors', label: 'Neighbors', Icon: Users },
  { value: 'businesses', label: 'Local Businesses', Icon: Store },
]

export function SearchTypeToggle({ value, onChange }: SearchTypeToggleProps) {
  return (
    <div
      className="inline-flex w-full rounded-full bg-hover p-1"
      role="tablist"
      aria-label="Filter results"
    >
      {TABS.map(({ value: tabValue, label, Icon }) => {
        const isActive = value === tabValue
        return (
          <button
            key={tabValue}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tabValue)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5',
              'text-xs font-semibold whitespace-nowrap select-none',
              'transition-all duration-[var(--xm-transition-fast)]',
              isActive
                ? 'bg-surface text-primary shadow-sm'
                : 'text-secondary hover:text-body',
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
