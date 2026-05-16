'use server'

import { redirect } from 'next/navigation'
import { db } from '@/db'
import {
  authAccounts,
  communities,
  communityInvites,
  members,
  onboardingProgress,
  wallets,
} from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSession, deleteCurrentSession } from '@/lib/auth/session'
import type { MembershipType, OnboardingStep } from '@/lib/exchange-engine'

export interface AuthActionState {
  error?: string
}

interface SignupCommunity {
  id: string
  name: string
  latitude: string
  longitude: string
}

interface ResolvedSignupCommunity {
  community: SignupCommunity
  inviteId?: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'profile_photo',
  'intro_vibe',
  'add_offerings',
  'post_need',
  'rsvp_happening',
  'first_exchange',
  'first_review',
  'invite_neighbor',
]

function readRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '-')
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function resolveSignupCommunity(
  formData: FormData,
): Promise<ResolvedSignupCommunity | { error: string }> {
  const inviteCode = normalizeInviteCode(readRequiredString(formData, 'inviteCode'))
  const communityId = readRequiredString(formData, 'communityId')

  if (inviteCode) {
    const [row] = await db
      .select({
        inviteId: communityInvites.id,
        maxUses: communityInvites.maxUses,
        usageCount: communityInvites.usageCount,
        expiresAt: communityInvites.expiresAt,
        communityId: communities.id,
        name: communities.name,
        latitude: communities.centerLatitude,
        longitude: communities.centerLongitude,
      })
      .from(communityInvites)
      .innerJoin(communities, eq(communityInvites.communityId, communities.id))
      .where(
        and(
          eq(communityInvites.code, inviteCode),
          eq(communityInvites.isActive, true),
          eq(communities.status, 'active'),
        ),
      )
      .limit(1)

    if (!row) return { error: 'Enter a valid invite code or choose a community.' }
    if (row.expiresAt && row.expiresAt < new Date()) {
      return { error: 'That invite code has expired.' }
    }
    if (row.maxUses !== null && row.usageCount >= row.maxUses) {
      return { error: 'That invite code has already been used.' }
    }

    return {
      inviteId: row.inviteId,
      community: {
        id: row.communityId,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
      },
    }
  }

  if (!communityId) {
    return { error: 'Choose your community or enter an invite code.' }
  }

  const [community] = await db
    .select({
      id: communities.id,
      name: communities.name,
      latitude: communities.centerLatitude,
      longitude: communities.centerLongitude,
    })
    .from(communities)
    .where(and(eq(communities.id, communityId), eq(communities.status, 'active')))
    .limit(1)

  if (!community) {
    return { error: 'Choose an active community.' }
  }

  return { community }
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = normalizeEmail(readRequiredString(formData, 'email'))
  const password = readRequiredString(formData, 'password')

  if (!isValidEmail(email) || password.length === 0) {
    return { error: 'Enter your email and password.' }
  }

  const [account] = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.email, email))
    .limit(1)

  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return { error: 'Email or password is incorrect.' }
  }

  await createSession(account.memberId)
  redirect('/')
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const firstName = readRequiredString(formData, 'firstName')
  const lastName = readRequiredString(formData, 'lastName')
  const email = normalizeEmail(readRequiredString(formData, 'email'))
  const password = readRequiredString(formData, 'password')
  const membershipType = (readRequiredString(formData, 'membershipType') ||
    'standard') as MembershipType

  if (!firstName || !lastName) {
    return { error: 'Enter your first and last name.' }
  }
  if (!isValidEmail(email)) {
    return { error: 'Enter a valid email address.' }
  }
  if (password.length < 8) {
    return { error: 'Use at least 8 characters for your password.' }
  }
  if (!['standard', 'business', 'community_contribution'].includes(membershipType)) {
    return { error: 'Choose a valid membership path.' }
  }

  const resolvedCommunity = await resolveSignupCommunity(formData)
  if ('error' in resolvedCommunity) return resolvedCommunity

  const [existingAccount, existingMember] = await Promise.all([
    db
      .select({ id: authAccounts.id })
      .from(authAccounts)
      .where(eq(authAccounts.email, email))
      .limit(1),
    db
      .select({ id: members.id })
      .from(members)
      .where(eq(members.email, email))
      .limit(1),
  ])

  if (existingAccount[0] || existingMember[0]) {
    return { error: 'An account already exists for that email.' }
  }

  const passwordHash = await hashPassword(password)

  const memberId = await db.transaction(async (tx) => {
    const [member] = await tx
      .insert(members)
      .values({
        firstName,
        lastName,
        email,
        bio: null,
        vibe: null,
        communityId: resolvedCommunity.community.id,
        neighborhood: resolvedCommunity.community.name,
        latitude: resolvedCommunity.community.latitude,
        longitude: resolvedCommunity.community.longitude,
        membershipType,
        status: 'pending',
      })
      .returning()

    await tx.insert(authAccounts).values({
      memberId: member.id,
      email,
      passwordHash,
    })

    await tx.insert(wallets).values({
      memberId: member.id,
      balance: 0,
      totalEarned: 0,
      monthlyEarned: 0,
      escrowHeld: 0,
    })

    await tx.insert(onboardingProgress).values(
      ONBOARDING_STEPS.map((step) => ({
        memberId: member.id,
        step,
        completed: false,
        tuEarned: 0,
      })),
    )

    if (resolvedCommunity.inviteId) {
      await tx
        .update(communityInvites)
        .set({
          usageCount: sql`${communityInvites.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(communityInvites.id, resolvedCommunity.inviteId))
    }

    return member.id
  })

  await createSession(memberId)
  redirect('/onboarding')
}

export async function signOutAction(): Promise<void> {
  await deleteCurrentSession()
  redirect('/welcome')
}
