'use client'

import { motion } from 'framer-motion'
import { Handshake, Users, ArrowRightLeft, Target } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { TreasuryInfo, CommunityTier } from '@/lib/exchange-engine'

interface CommunityStatsProps {
  treasury: TreasuryInfo
}

const TIER_THRESHOLDS: Record<CommunityTier, { next: string; target: number } | null> = {
  starting: { next: 'Active', target: 1000 },
  active: { next: 'Established', target: 5000 },
  established: { next: 'Strong', target: 10000 },
  strong: null,
}

function formatAmount(n: number): string {
  if (n >= 1000) {
    return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`
  }
  return `$${n}`
}

export function CommunityStats({ treasury }: CommunityStatsProps) {
  const milestone = TIER_THRESHOLDS[treasury.tier]
  const milestoneText = milestone
    ? `${formatAmount(milestone.target - treasury.balance)} to ${milestone.next}`
    : 'Max tier reached!'

  const stats = [
    {
      icon: Handshake,
      value: treasury.exchangesThisWeek,
      label: 'Exchanges this week',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Users,
      value: treasury.totalMembers,
      label: 'Total members',
      color: 'bg-info/10 text-info',
    },
    {
      icon: ArrowRightLeft,
      value: treasury.totalExchanges,
      label: 'Total exchanges',
      color: 'bg-accent/10 text-accent-dark',
    },
    {
      icon: Target,
      value: milestoneText,
      label: 'Next milestone',
      color: 'bg-primary/10 text-primary',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 + 0.3, duration: 0.3 }}
        >
          <Card className="flex flex-col items-start gap-2.5">
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center',
                stat.color,
              )}
            >
              <stat.icon size={17} />
            </div>
            <div>
              <p className="text-lg font-bold text-heading leading-none tabular-nums">
                {stat.value}
              </p>
              <p className="text-[11px] text-muted mt-0.5 leading-snug">
                {stat.label}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
