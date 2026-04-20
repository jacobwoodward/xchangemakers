'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Lock } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import type { Exchange, Member, Booking } from '@/lib/exchange-engine'

export interface BookingConfirmationProps {
  exchange: Exchange
  provider: Member
  booking: Booking
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, '0')}${period}`
}

export function BookingConfirmation({
  exchange,
  provider,
  booking,
}: BookingConfirmationProps) {
  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-8 space-y-6">
      {/* Animated check circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
      >
        <div className="relative">
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/15"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
            <CheckCircle size={48} className="text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div
        className="text-center space-y-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-heading">Booking Confirmed!</h2>
        <p className="text-sm text-muted">
          Your exchange has been scheduled
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      >
        <Card className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Provider
              </span>
              <span className="text-sm font-semibold text-heading">
                {provider.firstName} {provider.lastName}
              </span>
            </div>
            <div className="h-px bg-border-light" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Date
              </span>
              <span className="text-sm font-semibold text-heading">
                {formatDate(booking.date)}
              </span>
            </div>
            <div className="h-px bg-border-light" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Time
              </span>
              <span className="text-sm font-semibold text-heading">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
            <div className="h-px bg-border-light" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Amount
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {exchange.tuAmount} TU
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Escrow notice */}
      <motion.div
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-warning/10 w-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.3 }}
      >
        <Lock size={16} className="text-accent-dark shrink-0" />
        <p className="text-xs text-accent-dark font-medium leading-relaxed">
          {exchange.tuAmount} TU will be held in escrow until the exchange is complete.
        </p>
      </motion.div>

      {/* View Exchange button */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.3 }}
      >
        <Link href={`/exchange/${exchange.id}`} className="block">
          <Button variant="primary" size="lg" className="w-full">
            View Exchange
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
