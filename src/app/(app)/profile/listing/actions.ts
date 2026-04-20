'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'
import type {
  CreateListingInput,
  ListingCategory,
  ListingType,
  AvailabilityType,
} from '@/lib/exchange-engine'

export async function createListingAction(
  input: CreateListingInput,
): Promise<{ id?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const listing = await exchangeEngine.createListing(input)
    revalidatePath('/profile')
    revalidatePath('/search')
    return { id: listing.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to create listing',
    }
  }
}

export async function updateListingAction(
  id: string,
  input: Partial<CreateListingInput>,
): Promise<{ id?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const listing = await exchangeEngine.updateListing(id, input)
    revalidatePath('/profile')
    revalidatePath(`/listing/${id}`)
    revalidatePath('/search')
    return { id: listing.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to update listing',
    }
  }
}

export async function deleteListingAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.deleteListing(id)
    revalidatePath('/profile')
    revalidatePath('/search')
    return { ok: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to delete listing',
    }
  }
}

export type { ListingCategory, ListingType, AvailabilityType }
