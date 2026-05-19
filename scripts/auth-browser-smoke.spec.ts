import crypto from 'node:crypto'
import { test, expect } from '@playwright/test'
import postgres from 'postgres'

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

test.use({ channel: 'msedge' })

async function cleanupMember(email: string) {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const [member] = await sql`
      SELECT id FROM members WHERE email = ${email}
    `
    if (!member?.id) return

    await sql`
      DELETE FROM auth_sessions
      WHERE account_id IN (
        SELECT id FROM auth_accounts WHERE member_id = ${member.id}
      )
    `
    await sql`DELETE FROM auth_accounts WHERE member_id = ${member.id}`
    await sql`DELETE FROM onboarding_progress WHERE member_id = ${member.id}`
    await sql`DELETE FROM member_intent_profiles WHERE member_id = ${member.id}`
    await sql`DELETE FROM helper_preferences WHERE member_id = ${member.id}`
    await sql`DELETE FROM notifications WHERE member_id = ${member.id}`
    await sql`DELETE FROM analytics_events WHERE member_id = ${member.id}`
    await sql`DELETE FROM wallets WHERE member_id = ${member.id}`
    await sql`DELETE FROM members WHERE id = ${member.id}`
  } finally {
    await sql.end()
  }
}

test('signs in through the form', async ({ page }) => {
  await page.goto(`${baseUrl}/sign-in`)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  await page.getByLabel('Email').fill('lauren.chen@email.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: /Sign In/i }).click()

  await page.waitForURL(`${baseUrl}/`)
  await expect(page.getByText(/Your Friendswood action queue/i)).toBeVisible()
})

test('creates an account through the signup form', async ({ page }) => {
  const email = `phase2-${crypto.randomUUID()}@example.com`
  await cleanupMember(email)

  try {
    await page.goto(`${baseUrl}/sign-up`)
    await expect(page.getByRole('heading', { name: 'Start exchanging locally' })).toBeVisible()

    await page.getByLabel('First Name').fill('Phase')
    await page.getByLabel('Last Name').fill('Two')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('password123')
    await page.getByLabel('Invite Code').fill('FRIENDSWOOD')
    await page.getByRole('button', { name: /Create Account/i }).click()

    await page.waitForURL(`${baseUrl}/onboarding`)
    await expect(page.getByRole('heading', { name: 'Your Trail' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit profile' })).toBeVisible()
  } finally {
    await cleanupMember(email)
  }
})
