'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { exchangeEngine } from '@/lib/exchange-engine'

export async function respondToListingAction(listingId: string): Promise<void> {
  await exchangeEngine.initialize()
  const conversationId = await exchangeEngine.startListingConversation(listingId)

  revalidatePath('/messages')
  revalidatePath(`/listing/${listingId}`)
  redirect(`/messages/${conversationId}`)
}

export async function refreshListingFromDetailAction(
  listingId: string,
): Promise<void> {
  await exchangeEngine.initialize()
  await exchangeEngine.refreshListing(listingId)

  revalidatePath('/profile')
  revalidatePath('/needs')
  revalidatePath('/offers')
  revalidatePath(`/listing/${listingId}`)
  revalidatePath(`/listing/${listingId}/matches`)
  redirect(`/listing/${listingId}`)
}
