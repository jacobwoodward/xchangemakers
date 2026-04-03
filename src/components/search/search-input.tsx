'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function SearchInput({ value, onChange, onClear }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(next)
      }, 300)

      // Update input immediately (uncontrolled-ish for snappy feel)
      // We still need the parent to track value for clear, so we call onChange
      // after debounce, but we let the input show the typed value instantly
    },
    [onChange],
  )

  // When parent clears, also clear the input element
  useEffect(() => {
    if (!value && inputRef.current) {
      inputRef.current.value = ''
    }
  }, [value])

  return (
    <div
      className={cn(
        'relative flex items-center gap-3',
        'rounded-full bg-surface border border-border-light',
        'shadow-sm px-5 py-3',
        'transition-shadow duration-[var(--xm-transition-fast)]',
        'focus-within:shadow-default focus-within:border-primary/30',
      )}
    >
      <Search
        size={18}
        className="shrink-0 text-muted"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={handleChange}
        placeholder="What do you need?"
        className={cn(
          'flex-1 bg-transparent text-sm text-body placeholder:text-muted',
          'outline-none border-none p-0',
          'caret-primary',
        )}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onClear()
            inputRef.current?.focus()
          }}
          className={cn(
            'shrink-0 flex items-center justify-center',
            'h-6 w-6 rounded-full bg-hover',
            'text-secondary hover:bg-active',
            'transition-colors duration-[var(--xm-transition-fast)]',
          )}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
