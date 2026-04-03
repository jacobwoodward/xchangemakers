import type { AvailabilitySlot } from '@/lib/exchange-engine'
import { cn } from '@/lib/utils'

interface AvailabilityDisplayProps {
  slots: AvailabilitySlot[]
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Format "09:00:00" or "09:00" → "9a", "17:00" → "5p" */
function formatShortTime(time: string): string {
  const parts = time.split(':')
  let hour = parseInt(parts[0], 10)
  const suffix = hour >= 12 ? 'p' : 'a'
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12
  return `${hour}${suffix}`
}

export function AvailabilityDisplay({ slots }: AvailabilityDisplayProps) {
  if (slots.length === 0) return null

  // Group slots by day of week (0 = Monday through 6 = Sunday)
  const slotsByDay = new Map<number, AvailabilitySlot[]>()
  for (const slot of slots) {
    const existing = slotsByDay.get(slot.dayOfWeek) ?? []
    existing.push(slot)
    slotsByDay.set(slot.dayOfWeek, existing)
  }

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
        Availability
      </h3>
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((label, dayIndex) => {
          const daySlots = slotsByDay.get(dayIndex)
          const isAvailable = !!daySlots && daySlots.length > 0
          // Take the first slot for display (most common case)
          const primarySlot = daySlots?.[0]

          return (
            <div key={dayIndex} className="flex flex-col items-center gap-1">
              {/* Day label */}
              <span
                className={cn(
                  'text-[10px] font-semibold',
                  isAvailable ? 'text-heading' : 'text-muted',
                )}
              >
                {label}
              </span>

              {/* Availability block */}
              <div
                className={cn(
                  'w-full aspect-[1/1.2] rounded-md flex items-center justify-center',
                  isAvailable
                    ? 'bg-primary/12'
                    : 'bg-hover',
                )}
              >
                {isAvailable && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Time range */}
              {primarySlot ? (
                <span className="text-[9px] font-medium text-secondary leading-none whitespace-nowrap">
                  {formatShortTime(primarySlot.startTime)}-{formatShortTime(primarySlot.endTime)}
                </span>
              ) : (
                <span className="text-[9px] text-muted leading-none">&mdash;</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
