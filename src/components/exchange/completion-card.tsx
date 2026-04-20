'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import type { Exchange, Member } from '@/lib/exchange-engine'

export interface CompletionCardProps {
  exchange: Exchange
  provider: Member
  requester: Member
}

/** Scattered colored dots that burst outward. */
function ConfettiBurst() {
  const colors = [
    'var(--xm-primary)',
    'var(--xm-primary-light)',
    'var(--xm-accent)',
    'var(--xm-accent-light)',
    'var(--xm-success)',
    'var(--xm-info)',
  ]

  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360
    const distance = 50 + Math.random() * 40
    const rad = (angle * Math.PI) / 180
    const x = Math.cos(rad) * distance
    const y = Math.sin(rad) * distance
    const size = 5 + Math.random() * 5
    const color = colors[i % colors.length]
    const delay = Math.random() * 0.15

    return { id: i, x, y, size, color, delay }
  })

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="relative w-full h-full flex items-center justify-center">
        {dots.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
            }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
              scale: [0, 1.2, 0.8],
              x: dot.x,
              y: dot.y,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.9,
              delay: 0.2 + dot.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function CompletionCard({
  exchange,
  provider,
  requester,
}: CompletionCardProps) {
  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-8 space-y-7">
      {/* Confetti burst area */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <ConfettiBurst />

        {/* Center icon */}
        <motion.div
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Clock size={36} className="text-primary" strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* Heading */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-heading">Exchange Complete!</h2>
        <p className="text-sm text-secondary">
          <span className="font-semibold text-primary tabular-nums">
            {exchange.tuAmount} TU
          </span>
          {' '}transferred to {provider.firstName}
        </p>
      </motion.div>

      {/* Avatars side by side */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3 }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Avatar
            src={requester.avatarUrl}
            firstName={requester.firstName}
            lastName={requester.lastName}
            size="lg"
          />
          <span className="text-xs font-medium text-muted">{requester.firstName}</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-6 h-px bg-border" />
          <Clock size={14} className="text-primary shrink-0" />
          <div className="w-6 h-px bg-border" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Avatar
            src={provider.avatarUrl}
            firstName={provider.firstName}
            lastName={provider.lastName}
            size="lg"
          />
          <span className="text-xs font-medium text-muted">{provider.firstName}</span>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      >
        <Link href={`/exchange/${exchange.id}/review`} className="block">
          <Button variant="accent" size="lg" className="w-full">
            Leave a Review
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
