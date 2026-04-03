'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'

export async function sendMessageAction(
  conversationId: string,
  content: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await exchangeEngine.initialize()
    await exchangeEngine.sendMessage({ conversationId, content })

    revalidatePath(`/messages/${conversationId}`)
    revalidatePath('/messages')
    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to send message'
    return { error: message }
  }
}
