'use client'

import { motion } from 'framer-motion'
import { Leaf, Sprout, TreePine, Trees } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VitalityTier } from '@/lib/exchange-engine'

interface TierDisplayProps {
  currentTier: VitalityTier
  balance: number
}

const TIERS = [
  {
    key: 'sprouting' as const,
    label: 'Sprouting',
    range: '$0 - $999',
    min: 0,
    max: 999,
    Icon: Leaf,
  },
  {
    key: 'growing' as const,
    label: 'Growing',
    range: '$1K - $4.9K',
    min: 1000,
    max: 4999,
    Icon: Sprout,
  },
  {
    key: 'rooted' as const,
    label: 'Rooted',
    range: '$5K - $9.9K',
    min: 5000,
    max: 9999,
    Icon: TreePine,
  },
  {
    key: 'thriving' as const,
    label: 'Thriving',
    range: '$10K+',
    min: 10000,
    max: Infinity,
    Icon: Trees,
  },
] as const

const TIER_ORDER: Record<VitalityTier, number> = {
  sprouting: 0,
  growing: 1,
  rooted: 2,
  thriving: 3,
}

export function TierDisplay({ currentTier, balance }: TierDisplayProps) {
  const currentIndex = TIER_ORDER[currentTier]

  return (
    <div className="px-2">
      {/* Tier progression */}
      <div className="flex items-start justify-between relative">
        {/* Connecting line behind the icons */}
        <div
          className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-border-light"
          aria-hidden="true"
        />
        {/* Filled portion of the line */}
        <motion.div
          className="absolute top-5 left-[12%] h-0.5 bg-primary"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentIndex / (TIERS.length - 1)) * 76}%`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          aria-hidden="true"
        />

        {TIERS.map((tier, index) => {
          const isCurrent = tier.key === currentTier
          const isReached = index <= currentIndex

          return (
            <div key={tier.key} className="flex flex-col items-center z-10 w-1/4">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'transition-colors duration-300',
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isReached
                      ? 'bg-primary/15 text-primary'
                      : 'bg-hover text-muted',
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
              >
                <tier.Icon size={18} />
              </motion.div>
              <span
                className={cn(
                  'text-[11px] font-semibold mt-1.5 text-center leading-tight',
                  isCurrent ? 'text-primary' : isReached ? 'text-secondary' : 'text-muted',
                )}
              >
                {tier.label}
              </span>
              <span
                className={cn(
                  'text-[10px] text-center leading-tight',
                  isCurrent ? 'text-primary/70' : 'text-muted',
                )}
              >
                {tier.range}
              </span>

              {isCurrent && (
                <motion.span
                  className="mt-1 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Current
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
