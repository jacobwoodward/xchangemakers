'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { AvailabilitySlot } from '@/lib/exchange-engine'

export interface TimeSlotPickerProps {
  availability: AvailabilitySlot[]
  selectedDate: string | null
  selectedSlot: { start: string; end: string } | null
  onDateSelect: (date: string) => void
  onSlotSelect: (slot: { start: string; end: string }) => void
}

function getNext7Days(): { date: string; dayName: string; dayNumber: number; dayOfWeek: number }[] {
  const days: { date: string; dayName: string; dayNumber: number; dayOfWeek: number }[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      date: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      dayOfWeek: d.getDay(), // 0 = Sunday
    })
  }

  return days
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${m.toString().padStart(2, '0')}${period}`
}

export function TimeSlotPicker({
  availability,
  selectedDate,
  selectedSlot,
  onDateSelect,
  onSlotSelect,
}: TimeSlotPickerProps) {
  const days = useMemo(() => getNext7Days(), [])

  // Get slots for the selected date by matching dayOfWeek
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return []
    const selectedDay = days.find((d) => d.date === selectedDate)
    if (!selectedDay) return []

    return availability
      .filter((slot) => slot.dayOfWeek === selectedDay.dayOfWeek)
      .map((slot) => ({
        start: slot.startTime,
        end: slot.endTime,
      }))
  }, [availability, selectedDate, days])

  return (
    <div className="space-y-4">
      {/* Date row — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {days.map((day) => {
          const isSelected = selectedDate === day.date
          return (
            <motion.button
              key={day.date}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateSelect(day.date)}
              className={cn(
                'flex flex-col items-center justify-center shrink-0',
                'w-[60px] h-[72px] rounded-xl transition-all duration-200',
                'border-2 select-none',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'bg-surface border-border-light text-secondary hover:border-primary/30',
              )}
            >
              <span
                className={cn(
                  'text-[11px] font-medium leading-none',
                  isSelected ? 'text-primary-foreground/80' : 'text-muted',
                )}
              >
                {day.dayName}
              </span>
              <span
                className={cn(
                  'text-xl font-bold leading-tight mt-1',
                  isSelected ? 'text-primary-foreground' : 'text-heading',
                )}
              >
                {day.dayNumber}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {slotsForDate.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slotsForDate.map((slot) => {
                const isSelected =
                  selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                return (
                  <motion.button
                    key={`${slot.start}-${slot.end}`}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSlotSelect(slot)}
                    className={cn(
                      'px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                      'border select-none',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                        : 'bg-surface border-border text-body hover:border-primary/40 hover:bg-hover',
                    )}
                  >
                    {formatTime(slot.start)} - {formatTime(slot.end)}
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted">No availability on this day</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
