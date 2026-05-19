'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  Clock3,
  Plus,
  Repeat2,
  Trash2,
} from 'lucide-react'
import {
  addAvailabilitySlotAction,
  deleteAvailabilitySlotAction,
} from '@/app/(app)/needs/actions'
import { Badge, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AvailabilitySlot } from '@/lib/exchange-engine'

const DAYS = [
  { value: 0, short: 'Sun', label: 'Sunday' },
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
  { value: 6, short: 'Sat', label: 'Saturday' },
]

function sortSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
    return a.startTime.localeCompare(b.startTime)
  })
}

function formatTime(value: string): string {
  const [hourText = '0', minuteText = '00'] = value.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function dayLabel(dayOfWeek: number): string {
  return DAYS.find((day) => day.value === dayOfWeek)?.label ?? 'Day'
}

export function AvailabilityCard({
  slots: initialSlots,
  memberName,
  availabilityNote,
}: {
  slots: AvailabilitySlot[]
  memberName: string
  availabilityNote: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [slots, setSlots] = useState(() => sortSlots(initialSlots))
  const [dayOfWeek, setDayOfWeek] = useState(
    String(initialSlots[0]?.dayOfWeek ?? 2),
  )
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('18:00')
  const [isRecurring, setIsRecurring] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const groupedSlots = useMemo(
    () =>
      DAYS.map((day) => ({
        ...day,
        slots: slots.filter((slot) => slot.dayOfWeek === day.value),
      })).filter((day) => day.slots.length > 0),
    [slots],
  )

  function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (startTime >= endTime) {
      setError('Start time must be before end time.')
      return
    }

    startTransition(async () => {
      const result = await addAvailabilitySlotAction({
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        isRecurring,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const createdSlot = result.slot
      if (createdSlot) {
        setSlots((current) => sortSlots([...current, createdSlot]))
      }

      setSaved(true)
      router.refresh()
    })
  }

  function handleDelete(slotId: string) {
    setError(null)
    setSaved(false)
    setDeletingId(slotId)

    startTransition(async () => {
      try {
        const result = await deleteAvailabilitySlotAction(slotId)

        if (result.error) {
          setError(result.error)
          return
        }

        setSlots((current) => current.filter((slot) => slot.id !== slotId))
        router.refresh()
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-heading">
                I&apos;m available
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              {memberName}
              {availabilityNote ? `, ${availabilityNote}` : ''}
            </p>
          </div>
          <Badge variant="outline">
            {slots.length === 1 ? '1 window' : `${slots.length} windows`}
          </Badge>
        </div>

        {groupedSlots.length > 0 ? (
          <div className="space-y-2">
            {groupedSlots.map((day) => (
              <div
                key={day.value}
                className="rounded-lg border border-border-light bg-hover/40 px-3 py-2.5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-surface text-primary shadow-sm">
                    <span className="text-[11px] font-bold uppercase">
                      {day.short}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-semibold text-heading">
                      {day.label}
                    </p>
                    {day.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2 text-sm text-body">
                          <Clock3 size={14} className="shrink-0 text-muted" />
                          <span className="truncate font-medium">
                            {formatTime(slot.startTime)} -{' '}
                            {formatTime(slot.endTime)}
                          </span>
                          {slot.isRecurring && (
                            <Repeat2
                              size={13}
                              className="shrink-0 text-primary"
                              aria-label="Recurring"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(slot.id)}
                          disabled={isPending}
                          className={cn(
                            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-error',
                            deletingId === slot.id &&
                              'pointer-events-none opacity-50',
                          )}
                          aria-label={`Remove ${dayLabel(slot.dayOfWeek)} availability`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border-light bg-hover/40 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-heading">
              No availability windows yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Add a time window so matched needs can surface at the right time.
            </p>
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Plus size={14} />
            Add availability
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr]">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted">Day</span>
              <select
                value={dayOfWeek}
                onChange={(event) => {
                  setSaved(false)
                  setDayOfWeek(event.target.value)
                }}
                className="h-10 w-full rounded-lg border border-border-light bg-surface px-3 text-sm font-medium text-heading outline-none focus:border-primary"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted">Start</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => {
                  setSaved(false)
                  setStartTime(event.target.value)
                }}
                className="h-10 w-full rounded-lg border border-border-light bg-surface px-3 text-sm font-medium text-heading outline-none focus:border-primary"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted">End</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => {
                  setSaved(false)
                  setEndTime(event.target.value)
                }}
                className="h-10 w-full rounded-lg border border-border-light bg-surface px-3 text-sm font-medium text-heading outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border-light bg-hover/50 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Repeat2 size={15} className="shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-heading">
                  Repeat weekly
                </p>
                <p className="text-xs text-muted">
                  Use this window for ongoing matching.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(event) => {
                setSaved(false)
                setIsRecurring(event.target.checked)
              }}
              className="h-5 w-5 rounded border-border text-primary"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-error/15 bg-error/8 px-3 py-2 text-xs font-medium text-error">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              isLoading={isPending && !deletingId}
            >
              <Plus size={16} />
              Save availability
            </Button>
            {saved && (
              <span className="text-xs font-semibold text-primary">Saved</span>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}
