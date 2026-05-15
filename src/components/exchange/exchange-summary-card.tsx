import Link from 'next/link'
import { Badge, Card, Avatar } from '@/components/ui'
import type { Exchange, ExchangeStatus } from '@/lib/exchange-engine'
import { CalendarDays, CheckCircle2, Clock3, MessageCircle } from 'lucide-react'

interface ExchangeSummaryCardProps {
  exchange: Exchange
  currentMemberId: string
}

const STATUS_LABEL: Record<ExchangeStatus, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  in_escrow: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Needs review',
}

const STATUS_VARIANT: Record<
  ExchangeStatus,
  'default' | 'primary' | 'accent' | 'outline'
> = {
  requested: 'outline',
  accepted: 'accent',
  in_escrow: 'accent',
  completed: 'primary',
  cancelled: 'default',
  disputed: 'default',
}

function formatDate(value: string | null): string {
  if (!value) return 'Time not set'
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatCredits(amount: number): string {
  return `${amount} ${amount === 1 ? 'credit' : 'credits'}`
}

export function ExchangeSummaryCard({
  exchange,
  currentMemberId,
}: ExchangeSummaryCardProps) {
  const isProvider = currentMemberId === exchange.providerId
  const otherMember = isProvider ? exchange.requester : exchange.provider
  const roleCopy = isProvider ? 'You are helping' : 'You requested help'

  return (
    <Link href={`/exchange/${exchange.id}`} className="block">
      <Card className="space-y-3 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {otherMember && (
              <Avatar
                src={otherMember.avatarUrl}
                firstName={otherMember.firstName}
                lastName={otherMember.lastName}
                size="md"
                isAvailable={otherMember.isAvailable}
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-heading">
                {exchange.listing?.title ?? 'Exchange'}
              </p>
              <p className="truncate text-xs text-muted">
                {otherMember
                  ? `${roleCopy} ${otherMember.firstName}`
                  : roleCopy}
              </p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[exchange.status]}>
            {STATUS_LABEL[exchange.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
          <div className="flex items-center gap-1.5">
            <Clock3 size={13} className="text-primary" />
            <span className="font-semibold text-primary">
              {formatCredits(exchange.tuAmount)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-muted" />
            <span className="truncate">{formatDate(exchange.scheduledAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border-light pt-3 text-xs text-muted">
          {exchange.status === 'completed' ? (
            <>
              <CheckCircle2 size={13} className="text-primary" />
              Ready for review and reputation.
            </>
          ) : (
            <>
              <MessageCircle size={13} className="text-primary" />
              Open exchange room.
            </>
          )}
        </div>
      </Card>
    </Link>
  )
}
