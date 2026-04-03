import { Sprout } from 'lucide-react'

export function CaughtUpCard() {
  return (
    <div
      className="mt-8 mb-4 flex flex-col items-center rounded-xl px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--xm-bg-hover)' }}
    >
      <Sprout
        size={48}
        strokeWidth={1.4}
        style={{ color: 'var(--xm-primary)' }}
      />

      <p
        className="mt-4 text-base font-semibold"
        style={{ color: 'var(--xm-text-heading)' }}
      >
        You're all caught up
      </p>

      <p
        className="mt-1.5 text-sm leading-relaxed"
        style={{ color: 'var(--xm-text-muted)' }}
      >
        Check back tomorrow for more neighborhood activity
      </p>
    </div>
  )
}
