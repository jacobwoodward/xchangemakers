'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { members } from '@/db/schema'
import { requireCurrentMemberId } from '@/lib/auth/session'
import { eq } from 'drizzle-orm'

export interface UpdateProfileInput {
  firstName: string
  lastName: string
  vibe: string
  bio: string
}

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<{ ok?: true; error?: string }> {
  const memberId = await requireCurrentMemberId()
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const vibe = input.vibe.trim()
  const bio = input.bio.trim()

  if (!firstName || !lastName) {
    return { error: 'First and last name are required.' }
  }

  await db
    .update(members)
    .set({
      firstName,
      lastName,
      vibe: vibe || null,
      bio: bio || null,
      updatedAt: new Date(),
    })
    .where(eq(members.id, memberId))

  revalidatePath('/profile')
  revalidatePath('/profile/edit')
  return { ok: true }
}
