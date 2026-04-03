'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

/* ─── Card (static container) ─── */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove default padding */
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ noPadding = false, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-surface rounded-lg shadow-card',
        !noPadding && 'p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
)

Card.displayName = 'Card'

/* ─── PressableCard (interactive container with tap feedback) ─── */

export interface PressableCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Remove default padding */
  noPadding?: boolean
}

export const PressableCard = forwardRef<HTMLDivElement, PressableCardProps>(
  ({ noPadding = false, className, children, ...rest }, ref) => (
    <motion.div
      ref={ref}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'bg-surface rounded-lg shadow-card cursor-pointer',
        'transition-shadow duration-[var(--xm-transition-fast)]',
        'hover:shadow-md active:shadow-sm',
        !noPadding && 'p-4',
        className,
      )}
      {...(rest as HTMLMotionProps<'div'>)}
    >
      {children}
    </motion.div>
  ),
)

PressableCard.displayName = 'PressableCard'
