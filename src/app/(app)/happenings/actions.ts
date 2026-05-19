'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'
import type {
  CreateHappeningInput,
  HappeningCategory,
  HappeningFilters,
  RsvpStatus,
  Happening,
} from '@/lib/exchange-engine'

export async function getHappeningsAction(
  filters?: HappeningCategory | HappeningFilters,
): Promise<Happening[]> {
  await exchangeEngine.initialize()
  return exchangeEngine.getHappenings(filters)
}

export async function createHappeningAction(
  input: CreateHappeningInput,
): Promise<Happening> {
  await exchangeEngine.initialize()
  const happening = await exchangeEngine.createHappening(input)
  revalidatePath('/happenings')
  revalidatePath('/activity')
  return happening
}

export async function rsvpAction(
  happeningId: string,
  status: RsvpStatus,
): Promise<void> {
  await exchangeEngine.initialize()
  await exchangeEngine.rsvpHappening(happeningId, status)
  revalidatePath('/happenings')
  revalidatePath(`/happenings/${happeningId}`)
}

export async function clearRsvpAction(happeningId: string): Promise<void> {
  await exchangeEngine.initialize()
  await exchangeEngine.clearHappeningRsvp(happeningId)
  revalidatePath('/happenings')
  revalidatePath(`/happenings/${happeningId}`)
}
