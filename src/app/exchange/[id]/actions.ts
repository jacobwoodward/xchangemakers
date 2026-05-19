'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'
import type { CancellationInput } from '@/lib/exchange-engine'

export async function completeExchangeAction(
  exchangeId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.completeExchange(exchangeId)

    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath('/exchanges')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to complete exchange'
    return { error: message }
  }
}

export async function acceptExchangeAction(
  exchangeId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.acceptExchange(exchangeId)

    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath('/exchanges')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to accept exchange'
    return { error: message }
  }
}

export async function scheduleExchangeAction(
  exchangeId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.scheduleExchange(exchangeId, {
      date,
      startTime,
      endTime,
    })

    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath('/exchanges')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to schedule exchange'
    return { error: message }
  }
}

export async function cancelExchangeAction(
  exchangeId: string,
  input?: CancellationInput,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const exchange = await exchangeEngine.cancelExchange(exchangeId, input)

    revalidatePath('/')
    revalidatePath('/needs')
    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath(`/listing/${exchange.listingId}`)
    revalidatePath('/exchanges')
    revalidatePath('/notifications')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel exchange'
    return { error: message }
  }
}

export async function disputeExchangeAction(
  exchangeId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.disputeExchange(exchangeId)

    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath('/exchanges')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to open dispute'
    return { error: message }
  }
}

export async function sendExchangeMessageAction(
  exchangeId: string,
  conversationId: string,
  content: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.sendMessage({ conversationId, content })

    revalidatePath(`/exchange/${exchangeId}`)
    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send message'
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
    revalidatePath('/exchanges')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit review'
    return { error: message }
  }
}
