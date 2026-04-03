'use server'

import { exchangeEngine } from '@/lib/exchange-engine'
import type { HappeningCategory, RsvpStatus, Happening } from '@/lib/exchange-engine'

export async function getHappeningsAction(
  category?: HappeningCategory,
): Promise<Happening[]> {
  await exchangeEngine.initialize()
  return exchangeEngine.getHappenings(category)
}

export async function rsvpAction(
  happeningId: string,
  status: RsvpStatus,
): Promise<void> {
  await exchangeEngine.initialize()
  await exchangeEngine.rsvpHappening(happeningId, status)
}
