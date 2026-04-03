import { cn } from '@/lib/utils'

const variantStyles = {
  default: 'bg-hover text-secondary',
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  outline: 'bg-transparent text-secondary border border-border',
} as const

export type BadgeVariant = keyof typeof variantStyles

export interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium leading-none whitespace-nowrap select-none',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
