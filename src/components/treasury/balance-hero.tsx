'use client'

import { motion } from 'framer-motion'

interface BalanceHeroProps {
  communityName: string
  balance: number
}

export function BalanceHero({ communityName, balance }: BalanceHeroProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(balance)

  return (
    <div className="relative flex flex-col items-center py-8 overflow-hidden">
      {/* Soft radial glow behind the balance */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(91,140,90,0.10) 0%, transparent 70%)',
        }}
      />

      <p className="text-sm font-medium text-secondary mb-1 relative z-10">
        {communityName} Treasury
      </p>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
      >
        <span className="text-5xl font-bold tracking-tight text-heading tabular-nums">
          {formatted}
        </span>

        {/* Sparkle dots */}
        {[
          { top: '10%', left: '8%', delay: 0 },
          { top: '20%', right: '5%', delay: 0.6 },
          { bottom: '15%', left: '15%', delay: 1.2 },
          { top: '5%', right: '18%', delay: 0.3 },
          { bottom: '25%', right: '12%', delay: 0.9 },
        ].map((pos, i) => (
          <motion.span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/50"
            style={{
              top: pos.top,
              left: pos.left,
              right: pos.right,
              bottom: pos.bottom,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: pos.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      <p className="text-xs text-muted mt-2 relative z-10">
        Shared community fund
      </p>
    </div>
  )
}
