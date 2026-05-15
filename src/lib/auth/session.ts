import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash, randomBytes } from 'crypto'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '@/db'
import { authAccounts, authSessions } from '@/db/schema'

const SESSION_COOKIE = 'xm_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function sessionExpiresAt(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
}

export async function createSession(memberId: string): Promise<void> {
  const [account] = await db
    .select()
    .from(authAccounts)
    .where(eq(authAccounts.memberId, memberId))
    .limit(1)

  if (!account) {
    throw new Error('Auth account not found for member')
  }

  const token = randomBytes(32).toString('base64url')
  await db.insert(authSessions).values({
    accountId: account.id,
    tokenHash: hashToken(token),
    expiresAt: sessionExpiresAt(),
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function getCurrentMemberId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const [session] = await db
    .select({
      memberId: authAccounts.memberId,
    })
    .from(authSessions)
    .innerJoin(authAccounts, eq(authSessions.accountId, authAccounts.id))
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1)

  return session?.memberId ?? null
}

export async function requireCurrentMemberId(): Promise<string> {
  const memberId = await getCurrentMemberId()
  if (!memberId) redirect('/welcome')
  return memberId
}

export async function deleteCurrentSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await db
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, hashToken(token)))
  }

  cookieStore.delete(SESSION_COOKIE)
}
