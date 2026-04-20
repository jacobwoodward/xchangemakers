import { Badge, ProgressBar, Card } from '@/components/ui'
import { Users } from 'lucide-react'
import type { TreasuryInfo, CommunityTier } from '@/lib/exchange-engine/types'

interface TreasuryProgressProps {
  treasury: TreasuryInfo
}

const TIER_CONFIG: Record<
  CommunityTier,
  { label: string; threshold: number; next: string | null; nextThreshold: number }
> = {
  starting: {
    label: 'Starting',
    threshold: 0,
    next: 'Active',
    nextThreshold: 5000,
  },
  active: {
    label: 'Active',
    threshold: 5000,
    next: 'Established',
    nextThreshold: 10000,
  },
  established: {
    label: 'Established',
    threshold: 10000,
    next: 'Strong',
    nextThreshold: 25000,
  },
  strong: {
    label: 'Strong',
    threshold: 25000,
    next: null,
    nextThreshold: 25000,
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TreasuryProgress({ treasury }: TreasuryProgressProps) {
  const config = TIER_CONFIG[treasury.tier]
  const progress =
    config.next !== null
      ? ((treasury.balance - config.threshold) /
          (config.nextThreshold - config.threshold)) *
        100
      : 100
  const remaining = config.nextThreshold - treasury.balance

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-heading leading-tight">
              {treasury.communityName}
            </p>
            <p className="text-lg font-bold text-heading tabular-nums leading-tight mt-0.5">
              {formatCurrency(treasury.balance)}
            </p>
          </div>
        </div>
        <Badge variant="primary" className="text-xs">
          {config.label}
        </Badge>
      </div>

      <div className="mt-3.5">
        <ProgressBar value={progress} color="primary" />
      </div>

      {config.next && remaining > 0 && (
        <p className="mt-2 text-xs text-muted">
          {formatCurrency(remaining)} to{' '}
          <span className="font-medium text-secondary">{config.next}</span>
        </p>
      )}
    </Card>
  )
}
