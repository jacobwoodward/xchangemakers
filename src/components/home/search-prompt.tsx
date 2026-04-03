'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'

export function SearchPrompt() {
  return (
    <Link
      href="/search"
      className="flex items-center gap-3 rounded-full px-5 py-3.5 bg-surface border border-border-light shadow-sm transition-shadow duration-[var(--xm-transition-fast)] hover:shadow-default active:shadow-sm"
    >
      <Search size={18} className="text-muted shrink-0" />
      <span className="text-sm text-muted">What do you need?</span>
    </Link>
  )
}
