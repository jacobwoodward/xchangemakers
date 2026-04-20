'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface TuBalanceCardProps {
  balance: number
  monthlyEarned: number
  escrowHeld: number
}

const MONTHLY_CAP = 20

export function TuBalanceCard({
  balance,
  monthlyEarned,
  escrowHeld,
}: TuBalanceCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #4A7249 0%, #7BAF7A 100%)',
        boxShadow:
          '0 8px 24px rgba(91, 140, 90, 0.25), 0 2px 8px rgba(91, 140, 90, 0.15)',
      }}
    >
      {/* Decorative circle in top-right */}
      <div
        className="absolute -top-6 -right-6 h-28 w-28 rounded-full opacity-10"
        style={{ backgroundColor: '#FFFFFF' }}
      />

      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-white/70" />
            <span className="text-sm font-medium text-white/70">
              Time Units
            </span>
          </div>
          {escrowHeld > 0 && (
            <span className="text-xs font-medium text-white/50 tabular-nums">
              {escrowHeld} TU in escrow
            </span>
          )}
        </div>

        {/* Big balance */}
        <p className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">
          {balance}{' '}
          <span className="text-lg font-semibold text-white/60">TU</span>
        </p>
        <p className="mt-1 text-xs text-white/50">
          1 TU ≈ 1 hour of community time
        </p>

        {/* Monthly progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, (monthlyEarned / MONTHLY_CAP) * 100)}%`,
              }}
            />
          </div>
          <span className="text-xs font-medium text-white/60 tabular-nums whitespace-nowrap">
            {monthlyEarned} / {MONTHLY_CAP} TU this month
          </span>
        </div>
      </div>
    </motion.div>
  )
}
