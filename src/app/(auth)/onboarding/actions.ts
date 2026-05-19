'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine } from '@/lib/exchange-engine/client'
import type {
  MemberIntentProfile,
  OnboardingStep,
  UpdateMemberIntentProfileInput,
} from '@/lib/exchange-engine/types'

export async function completeStepAction(step: OnboardingStep) {
  await exchangeEngine.initialize()
  const member = await exchangeEngine.getCurrentMember()
  await exchangeEngine.completeOnboardingStep(member.id, step)
}

export async function saveOnboardingPreferencesAction(
  input: UpdateMemberIntentProfileInput,
): Promise<{ profile?: MemberIntentProfile; error?: string }> {
  try {
    await exchangeEngine.initialize()
    const member = await exchangeEngine.getCurrentMember()
    const profile = await exchangeEngine.updateMemberIntentProfile(input, member.id)

    revalidatePath('/onboarding')
    revalidatePath('/needs')
    revalidatePath('/happenings')
    return { profile }
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : 'Failed to save onboarding preferences',
    }
  }
}
