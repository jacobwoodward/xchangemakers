'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-dark active:bg-primary-dark shadow-sm',
  secondary:
    'bg-surface text-primary border border-primary hover:bg-hover active:bg-active',
  accent:
    'bg-accent text-accent-foreground hover:bg-accent-dark active:bg-accent-dark shadow-sm',
  ghost:
    'bg-transparent text-body hover:bg-hover active:bg-active',
  icon:
    'bg-transparent text-secondary hover:bg-hover active:bg-active aspect-square !p-0',
} as const

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-[15px] gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
} as const

const iconSizeStyles = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export type ButtonVariant = keyof typeof variantStyles
export type ButtonSize = keyof typeof sizeStyles

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="2.5"
    />
    <path
      d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading
    const isIcon = variant === 'icon'

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        whileTap={isDisabled ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        disabled={isDisabled}
        className={cn(
          // Base
          'relative inline-flex items-center justify-center font-medium',
          'rounded-full select-none outline-none',
          'transition-colors duration-[var(--xm-transition-fast)]',
          'focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page',
          'disabled:opacity-50 disabled:pointer-events-none',
          // Variant
          variantStyles[variant],
          // Size
          isIcon ? iconSizeStyles[size] : sizeStyles[size],
          className,
        )}
        {...(rest as HTMLMotionProps<'button'>)}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-inherit',
            isLoading && 'invisible',
          )}
        >
          {children}
        </span>
      </motion.button>
    )
  },
)

Button.displayName = 'Button'
