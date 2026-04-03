import { Users, Star } from 'lucide-react'

interface RsvpSummaryProps {
  goingCount: number
  interestedCount: number
}

export function RsvpSummary({ goingCount, interestedCount }: RsvpSummaryProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-secondary">
      <span className="inline-flex items-center gap-1.5">
        <Users size={14} className="text-primary" />
        <span className="font-medium tabular-nums">{goingCount}</span> going
      </span>
      <span
        className="h-3.5 w-px"
        style={{ backgroundColor: 'var(--xm-border)' }}
        aria-hidden
      />
      <span className="inline-flex items-center gap-1.5">
        <Star size={14} className="text-accent" />
        <span className="font-medium tabular-nums">{interestedCount}</span> interested
      </span>
    </div>
  )
}
