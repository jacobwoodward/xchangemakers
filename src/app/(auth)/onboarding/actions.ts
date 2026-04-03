'use server'

import { exchangeEngine } from '@/lib/exchange-engine/client'
import type { OnboardingStep } from '@/lib/exchange-engine/types'

export async function completeStepAction(step: OnboardingStep) {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()
  await exchangeEngine.completeOnboardingStep(member.id, step)
}
