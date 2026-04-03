'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  onBack,
  rightAction,
  className,
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = onBack ?? (() => router.back())

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b bg-surface',
        className,
      )}
      style={{ borderColor: 'var(--xm-border-light)' }}
    >
      <div
        className="relative mx-auto flex h-full w-full items-center px-2"
        style={{ maxWidth: 'var(--xm-content-max-width)' }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--xm-text-heading)' }}
          aria-label="Go back"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Centered title */}
        <span
          className="absolute inset-x-0 text-center text-base font-semibold pointer-events-none"
          style={{ color: 'var(--xm-text-heading)' }}
        >
          {title}
        </span>

        {/* Right action slot */}
        {rightAction && (
          <div className="ml-auto flex items-center">{rightAction}</div>
        )}
      </div>
    </header>
  )
}
