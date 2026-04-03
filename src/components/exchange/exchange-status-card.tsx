'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CalendarDays, Zap, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Avatar, Button, StatusStepper, Badge } from '@/components/ui'
import { EscrowIndicator } from './escrow-indicator'
import { completeExchangeAction } from '@/app/exchange/[id]/actions'
import type { Exchange, ExchangeStatus } from '@/lib/exchange-engine'
import type { Step } from '@/components/ui/status-stepper'

export interface ExchangeStatusCardProps {
  exchange: Exchange
  currentMemberId: string
}

function getSteps(status: ExchangeStatus): Step[] {
  const stages: ExchangeStatus[] = ['requested', 'accepted', 'in_escrow', 'completed']
  const currentIndex = stages.indexOf(status)

  return [
    { label: 'Requested', status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'active' : 'pending' },
    { label: 'Accepted', status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'active' : 'pending' },
    { label: 'In Escrow', status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'active' : 'pending' },
    { label: 'Completed', status: currentIndex >= 3 ? 'completed' : 'pending' },
  ] satisfies Step[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'accent' | 'outline' }> = {
  requested: { label: 'Requested', variant: 'outline' },
  accepted: { label: 'Accepted', variant: 'accent' },
  in_escrow: { label: 'In Escrow', variant: 'accent' },
  completed: { label: 'Completed', variant: 'primary' },
  cancelled: { label: 'Cancelled', variant: 'default' },
  disputed: { label: 'Disputed', variant: 'default' },
}

export function ExchangeStatusCard({
  exchange,
  currentMemberId,
}: ExchangeStatusCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const steps = getSteps(exchange.status)
  const isProvider = currentMemberId === exchange.providerId
  const isRequester = currentMemberId === exchange.requesterId

  const counterparty = isProvider ? exchange.requester : exchange.provider
  const counterpartyRole = isProvider ? 'Requester' : 'Provider'

  const badgeInfo = STATUS_BADGE[exchange.status] ?? { label: exchange.status, variant: 'default' as const }

  function handleComplete() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await completeExchangeAction(exchange.id)
        if (result.error) setError(result.error)
      } catch {
        setError('Something went wrong.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* ─── Status stepper ─── */}
      <Card>
        <StatusStepper steps={steps} />
      </Card>

      {/* ─── Exchange details ─── */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-heading">Exchange Details</h3>
          <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
        </div>

        {/* Counterparty */}
        {counterparty && (
          <div className="flex items-center gap-3">
            <Avatar
              src={counterparty.avatarUrl}
              firstName={counterparty.firstName}
              lastName={counterparty.lastName}
              size="md"
              isAvailable={counterparty.isAvailable}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-heading leading-tight">
                {counterparty.firstName} {counterparty.lastName}
              </p>
              <p className="text-xs text-muted">{counterpartyRole}</p>
            </div>
          </div>
        )}

        <div className="h-px bg-border-light" />

        {/* Listing */}
        {exchange.listing && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-hover">
              <User size={14} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted">Service</p>
              <p className="text-sm font-medium text-heading truncate">
                {exchange.listing.title}
              </p>
            </div>
          </div>
        )}

        {/* EU Amount */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Zap size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Amount</p>
            <p className="text-sm font-bold text-primary tabular-nums">
              {exchange.euAmount} EU
            </p>
          </div>
          {(exchange.status === 'in_escrow' || exchange.status === 'requested' || exchange.status === 'accepted') && (
            <EscrowIndicator amount={exchange.euAmount} />
          )}
        </div>

        {/* Scheduled date */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-hover">
            <CalendarDays size={14} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">Scheduled</p>
            <p className="text-sm font-medium text-heading">
              {formatDate(exchange.scheduledAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* ─── Action area ─── */}
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-error/8 border border-error/15">
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}

      {exchange.status === 'requested' && isRequester && (
        <Card className="flex items-center gap-3 bg-hover/50">
          <Clock size={18} className="text-muted shrink-0" />
          <p className="text-sm text-secondary">
            Waiting for {exchange.provider?.firstName ?? 'the provider'} to accept...
          </p>
        </Card>
      )}

      {(exchange.status === 'in_escrow' || exchange.status === 'accepted') && (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isPending}
          onClick={handleComplete}
        >
          Mark as Complete
        </Button>
      )}

      {exchange.status === 'completed' && (
        <Link
          href={`/exchange/${exchange.id}/review`}
          className="block"
        >
          <Button variant="accent" size="lg" className="w-full">
            Leave a Review
          </Button>
        </Link>
      )}
    </div>
  )
}
