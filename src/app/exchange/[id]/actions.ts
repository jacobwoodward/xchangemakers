'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'

export async function completeExchangeAction(
  exchangeId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.completeExchange(exchangeId)

    revalidatePath(`/exchange/${exchangeId}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete exchange'
    return { error: message }
  }
}

export async function createReviewAction(
  exchangeId: string,
  revieweeId: string,
  tags: string[],
  note: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()

    await exchangeEngine.createReview({
      exchangeId,
      revieweeId,
      tags: tags as import('@/lib/exchange-engine').ReputationTagType[],
      note: note || undefined,
    })

    revalidatePath(`/exchange/${exchangeId}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit review'
    return { error: message }
  }
}
