import { test, expect, type Page } from '@playwright/test'
import postgres from 'postgres'

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

test.use({ channel: 'msedge' })

async function signIn(page: Page) {
  await page.goto(`${baseUrl}/sign-in`)
  await page.getByLabel('Email').fill('lauren.chen@email.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: /Sign In/i }).click()
  await page.waitForURL(`${baseUrl}/`)
}

async function getSmokeFixture() {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const [member] = await sql<{ id: string }[]>`
      SELECT id
      FROM members
      WHERE email = 'lauren.chen@email.com'
      LIMIT 1
    `
    const [happening] = await sql<{ id: string; title: string }[]>`
      SELECT id, title
      FROM happenings
      ORDER BY start_at
      LIMIT 1
    `

    if (!member?.id || !happening?.id) {
      throw new Error('Seeded Lauren member and happening are required')
    }

    return { memberId: member.id, happening }
  } finally {
    await sql.end()
  }
}

async function clearRsvp(memberId: string, happeningId: string) {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    await sql`
      DELETE FROM happening_rsvps
      WHERE member_id = ${memberId}
        AND happening_id = ${happeningId}
    `
    await sql`
      DELETE FROM analytics_events
      WHERE member_id = ${memberId}
        AND target_id = ${happeningId}
        AND event_type = 'event_rsvp'
    `
  } finally {
    await sql.end()
  }
}

async function getRsvpStatus(memberId: string, happeningId: string) {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const [row] = await sql<{ status: string }[]>`
      SELECT status
      FROM happening_rsvps
      WHERE member_id = ${memberId}
        AND happening_id = ${happeningId}
      LIMIT 1
    `

    return row?.status ?? null
  } finally {
    await sql.end()
  }
}

test('shows happening detail, persists RSVP, and toggles it off', async ({ page }) => {
  const { memberId, happening } = await getSmokeFixture()
  await clearRsvp(memberId, happening.id)

  try {
    await signIn(page)
    await page.goto(`${baseUrl}/happenings/${happening.id}`)

    await expect(
      page.getByRole('heading', { name: happening.title }),
    ).toBeVisible()
    await expect(page.getByLabel('Share event')).toBeVisible()

    await page.getByRole('button', { name: /Going/i }).click()
    await expect
      .poll(() => getRsvpStatus(memberId, happening.id))
      .toBe('going')

    await page.reload()
    await expect(page.getByRole('button', { name: /Going/i })).toBeVisible()

    await page.getByRole('button', { name: /Going/i }).click()
    await expect
      .poll(() => getRsvpStatus(memberId, happening.id))
      .toBeNull()
  } finally {
    await clearRsvp(memberId, happening.id)
  }
})
