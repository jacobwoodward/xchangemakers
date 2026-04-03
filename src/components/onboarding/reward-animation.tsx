'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RewardAnimationProps {
  amount: number
  onComplete: () => void
}

// Colors from the xChangeMakers palette
const DOT_COLORS = [
  'var(--xm-primary)',
  'var(--xm-primary-light)',
  'var(--xm-accent)',
  'var(--xm-accent-light)',
  'var(--xm-success)',
  'var(--xm-info)',
]

const DOTS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * 2 * Math.PI
  const radius = 50 + Math.random() * 30
  return {
    id: i,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    color: DOT_COLORS[i % DOT_COLORS.length],
    size: 4 + Math.random() * 4,
    delay: Math.random() * 0.15,
  }
})

export function RewardAnimation({ amount, onComplete }: RewardAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1100)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* EU amount floating up */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: -40, scale: 1.1 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{
            duration: 0.9,
            ease: 'easeOut',
          }}
          className="absolute text-3xl font-bold text-primary drop-shadow-lg"
        >
          +{amount} EU
        </motion.div>

        {/* Confetti dots burst */}
        {DOTS.map((dot) => (
          <motion.div
            key={dot.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: dot.x,
              y: dot.y,
              scale: 0,
            }}
            transition={{
              duration: 0.7,
              delay: dot.delay,
              ease: 'easeOut',
            }}
            className="absolute rounded-full"
            style={{
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}
