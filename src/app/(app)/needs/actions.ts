'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'
import type {
  AvailabilitySlot,
  CreateAvailabilitySlotInput,
  HelperPreferences,
  CancellationInput,
  OfferNeedHelpInput,
  UpdateHelperPreferencesInput,
} from '@/lib/exchange-engine'

export async function offerNeedHelpAction(
  input: OfferNeedHelpInput,
): Promise<{ offerId?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const offer = await exchangeEngine.offerNeedHelp(input)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/exchanges')
    revalidatePath('/notifications')
    return { offerId: offer.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to offer help',
    }
  }
}

export async function acceptNeedOfferAction(
  offerId: string,
): Promise<{ exchangeId?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const exchange = await exchangeEngine.acceptNeedOffer(offerId)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/exchanges')
    revalidatePath('/notifications')
    revalidatePath(`/exchange/${exchange.id}`)
    return { exchangeId: exchange.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to accept helper',
    }
  }
}

export async function cancelTimedNeedAction(
  needId: string,
  input?: CancellationInput,
): Promise<{ ok?: true; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.cancelTimedNeed(needId, input)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/profile')
    revalidatePath('/notifications')
    revalidatePath(`/listing/${needId}`)
    return { ok: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to cancel need',
    }
  }
}

export async function withdrawNeedOfferAction(
  offerId: string,
  input?: CancellationInput,
): Promise<{ ok?: true; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.withdrawNeedOffer(offerId, input)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/exchanges')
    revalidatePath('/notifications')
    return { ok: true }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to withdraw offer',
    }
  }
}

export async function repostTimedNeedAction(
  needId: string,
): Promise<{ listingId?: string; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const listing = await exchangeEngine.repostTimedNeed(needId)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/profile')
    revalidatePath('/notifications')
    revalidatePath(`/listing/${needId}`)
    revalidatePath(`/listing/${listing.id}`)
    return { listingId: listing.id }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to repost need',
    }
  }
}

export async function markNeedStillNeedsHelpAction(
  needId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.markNeedStillNeedsHelp(needId)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath('/profile')
    revalidatePath('/notifications')
    revalidatePath(`/listing/${needId}`)
    return { ok: true }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to refresh need',
    }
  }
}

export async function addAvailabilitySlotAction(
  input: CreateAvailabilitySlotInput,
): Promise<{ slot?: AvailabilitySlot; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const slot = await exchangeEngine.addAvailabilitySlot(input)

    revalidatePath('/needs')
    revalidatePath('/onboarding')
    return { slot }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to add availability',
    }
  }
}

export async function deleteAvailabilitySlotAction(
  slotId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.deleteAvailabilitySlot(slotId)

    revalidatePath('/needs')
    revalidatePath('/onboarding')
    return { ok: true }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to delete availability',
    }
  }
}

export async function updateHelperPreferencesAction(
  input: UpdateHelperPreferencesInput,
): Promise<{ preferences?: HelperPreferences; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const preferences = await exchangeEngine.updateHelperPreferences(input)

    revalidatePath('/')
    revalidatePath('/needs')
    return { preferences }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to update preferences',
    }
  }
}
