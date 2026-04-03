import { cn } from '@/lib/utils'

const colorStyles = {
  primary: 'bg-primary',
  accent: 'bg-accent',
} as const

export type ProgressColor = keyof typeof colorStyles

export interface ProgressBarProps {
  /** 0-100 */
  value: number
  color?: ProgressColor
  label?: string
  className?: string
}

export function ProgressBar({
  value,
  color = 'primary',
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-secondary">{label}</span>
          <span className="text-xs tabular-nums text-muted">
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className="h-2 w-full rounded-full bg-border-light overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorStyles[color],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
