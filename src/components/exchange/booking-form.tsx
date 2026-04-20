'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Avatar, Button } from '@/components/ui'
import { TimeSlotPicker } from './time-slot-picker'
import { createBookingAction } from '@/app/booking/[id]/actions'
import type { Listing, Member, AvailabilitySlot } from '@/lib/exchange-engine'

export interface BookingFormProps {
  listing: Listing
  provider: Member
  availability: AvailabilitySlot[]
  walletBalance: number
}

export function BookingForm({
  listing,
  provider,
  availability,
  walletBalance,
}: BookingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasSufficientBalance = walletBalance >= listing.creditPrice
  const canConfirm = selectedDate && selectedSlot && hasSufficientBalance && !isPending

  function handleConfirm() {
    if (!selectedDate || !selectedSlot) return
    setError(null)

    startTransition(async () => {
      try {
        const result = await createBookingAction(
          listing.id,
          provider.id,
          listing.creditPrice,
          selectedDate,
          selectedSlot.start,
          selectedSlot.end,
        )

        if (result.error) {
          setError(result.error)
          return
        }

        router.push(`/exchange/${result.exchangeId}?booked=1`)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* ─── Provider info card ─── */}
      <Card className="flex items-center gap-3">
        <Avatar
          src={provider.avatarUrl}
          firstName={provider.firstName}
          lastName={provider.lastName}
          size="lg"
          isAvailable={provider.isAvailable}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-heading leading-tight">
            {provider.firstName} {provider.lastName}
          </p>
          <p className="text-sm text-body leading-snug mt-0.5">
            {listing.title}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {provider.neighborhood}
          </p>
        </div>
      </Card>

      {/* ─── Date & time picker ─── */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Select a time
        </h3>
        <TimeSlotPicker
          availability={availability}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onDateSelect={(date) => {
            setSelectedDate(date)
            setSelectedSlot(null)
          }}
          onSlotSelect={setSelectedSlot}
        />
      </Card>

      {/* ─── TU amount ─── */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Exchange cost
            </h3>
            <div className="flex items-center gap-1.5">
              <Clock size={18} className="text-primary" />
              <span className="text-2xl font-bold text-primary tabular-nums">
                {listing.creditPrice}
              </span>
              <span className="text-sm font-semibold text-primary/60">TU</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted mb-0.5">Your balance</p>
            <p
              className={cn(
                'text-lg font-bold tabular-nums',
                hasSufficientBalance ? 'text-heading' : 'text-error',
              )}
            >
              {walletBalance} TU
            </p>
          </div>
        </div>

        {!hasSufficientBalance && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg bg-error/8 border border-error/15">
            <AlertCircle size={16} className="text-error shrink-0" />
            <p className="text-xs text-error font-medium">
              Insufficient balance. You need {listing.creditPrice - walletBalance} more TU.
            </p>
          </div>
        )}
      </Card>

      {/* ─── Escrow notice ─── */}
      <p className="text-xs text-center text-muted leading-relaxed px-4">
        TU will be held in escrow until the exchange is marked complete by both parties.
      </p>

      {/* ─── Error ─── */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-error/8 border border-error/15">
          <AlertCircle size={16} className="text-error shrink-0" />
          <p className="text-xs text-error font-medium">{error}</p>
        </div>
      )}

      {/* ─── Confirm button ─── */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canConfirm}
        isLoading={isPending}
        onClick={handleConfirm}
      >
        Confirm Booking
      </Button>
    </div>
  )
}
