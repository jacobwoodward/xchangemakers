import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  href?: string
  className?: string
}

export function SectionHeader({ title, href, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--xm-text-heading)' }}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium"
          style={{ color: 'var(--xm-primary)' }}
        >
          See all
        </Link>
      )}
    </div>
  )
}
