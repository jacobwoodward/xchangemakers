'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine'

export async function markNotificationReadAction(id: string) {
  await exchangeEngine.initialize()
  await exchangeEngine.markNotificationRead(id)
  revalidatePath('/notifications')
  revalidatePath('/')
}

export async function markAllNotificationsReadAction() {
  await exchangeEngine.initialize()
  await exchangeEngine.markAllNotificationsRead()
  revalidatePath('/notifications')
  revalidatePath('/')
}
