'use server'

import { revalidatePath } from 'next/cache'
import { exchangeEngine, type MemberStatus } from '@/lib/exchange-engine'

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function revalidateStewardPaths() {
  revalidatePath('/steward')
  revalidatePath('/profile')
  revalidatePath('/needs')
  revalidatePath('/offers')
  revalidatePath('/exchanges')
}

export async function setMemberStatusAction(formData: FormData): Promise<void> {
  const memberId = readRequiredString(formData, 'memberId')
  const status = readRequiredString(formData, 'status') as MemberStatus

  await exchangeEngine.initialize()
  await exchangeEngine.setMemberStatusAsSteward(memberId, status)
  revalidateStewardPaths()
}

export async function archiveListingAction(formData: FormData): Promise<void> {
  const listingId = readRequiredString(formData, 'listingId')

  await exchangeEngine.initialize()
  await exchangeEngine.archiveListingAsSteward(listingId)
  revalidateStewardPaths()
  revalidatePath(`/listing/${listingId}`)
}

export async function refreshListingAction(formData: FormData): Promise<void> {
  const listingId = readRequiredString(formData, 'listingId')

  await exchangeEngine.initialize()
  await exchangeEngine.refreshListingAsSteward(listingId)
  revalidateStewardPaths()
  revalidatePath(`/listing/${listingId}`)
}

export async function deletePastHappeningAction(formData: FormData): Promise<void> {
  const happeningId = readRequiredString(formData, 'happeningId')

  await exchangeEngine.initialize()
  await exchangeEngine.deletePastHappeningAsSteward(happeningId)
  revalidateStewardPaths()
  revalidatePath('/happenings')
}

export async function resolveDisputeAction(formData: FormData): Promise<void> {
  const exchangeId = readRequiredString(formData, 'exchangeId')
  const outcome = readRequiredString(formData, 'outcome')
  if (outcome !== 'refund' && outcome !== 'release') {
    throw new Error('Choose a valid dispute outcome')
  }

  await exchangeEngine.initialize()
  await exchangeEngine.resolveDisputeAsSteward(exchangeId, outcome)
  revalidateStewardPaths()
  revalidatePath(`/exchange/${exchangeId}`)
}

export async function resolveFlagAction(formData: FormData): Promise<void> {
  const flagId = readRequiredString(formData, 'flagId')

  await exchangeEngine.initialize()
  await exchangeEngine.resolveStewardFlag(flagId)
  revalidateStewardPaths()
}
