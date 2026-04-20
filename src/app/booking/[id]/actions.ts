'use server'

import { exchangeEngine } from '@/lib/exchange-engine'

export async function createBookingAction(
  listingId: string,
  providerId: string,
  tuAmount: number,
  date: string,
  startTime: string,
  endTime: string,
): Promise<{ exchangeId?: string; bookingId?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()

    // 1. Create the exchange (places TU in escrow)
    const exchange = await exchangeEngine.createExchange({
      listingId,
      providerId,
      tuAmount,
      scheduledAt: `${date}T${startTime}:00`,
    })

    // 2. Create the booking time slot
    const booking = await exchangeEngine.createBooking({
      exchangeId: exchange.id,
      providerId,
      date,
      startTime,
      endTime,
    })

    return { exchangeId: exchange.id, bookingId: booking.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create booking'
    return { error: message }
  }
}
