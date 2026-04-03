import { HappeningCard } from './happening-card'
import type { Happening } from '@/lib/exchange-engine/types'

interface HappeningListProps {
  happenings: Happening[]
}

export function HappeningList({ happenings }: HappeningListProps) {
  if (happenings.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-sm text-muted">No happenings found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {happenings.map((happening) => (
        <HappeningCard key={happening.id} happening={happening} />
      ))}
    </div>
  )
}
