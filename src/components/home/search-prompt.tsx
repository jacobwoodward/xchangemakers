'use client'

import Link from 'next/link'
import { Search, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function SearchPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-2.5"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h2 className="text-lg font-bold tracking-tight text-heading">
          What do you need today?
        </h2>
      </div>
      <Link
        href="/search"
        className="flex items-center gap-3 rounded-2xl px-5 py-4 bg-primary/5 border-2 border-primary/20 transition-all duration-[var(--xm-transition-fast)] hover:bg-primary/10 hover:border-primary/30 active:scale-[0.99]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 shrink-0">
          <Search size={17} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-heading leading-tight">
            Search offerings & services
          </p>
          <p className="text-xs text-muted mt-0.5">
            Tamales, yoga, handyman, tutoring…
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
