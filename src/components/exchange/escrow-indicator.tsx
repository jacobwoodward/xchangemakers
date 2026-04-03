import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EscrowIndicatorProps {
  amount: number
  className?: string
}

export function EscrowIndicator({ amount, className }: EscrowIndicatorProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-warning/15 text-accent-dark',
        'text-xs font-semibold select-none',
        className,
      )}
    >
      <Lock size={12} />
      <span>{amount} EU in escrow</span>
    </div>
  )
}
