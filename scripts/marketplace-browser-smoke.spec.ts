import crypto from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
import postgres from 'postgres'

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

test.use({ channel: 'chrome' })

async function cleanupListing(title: string) {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    await sql`
      DELETE FROM listings
      WHERE title = ${title}
        AND member_id = (
          SELECT member_id FROM auth_accounts WHERE email = 'lauren@example.com'
        )
    `
  } finally {
    await sql.end()
  }
}

async function signIn(page: Page) {
  await page.goto(`${baseUrl}/sign-in`)
  await page.getByLabel('Email').fill('lauren@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: /Sign In/i }).click()
  await page.waitForURL(`${baseUrl}/`)
}

test('filters needs and offers boards', async ({ page }) => {
  await signIn(page)

  await page.goto(`${baseUrl}/needs?category=food&distance=all`)
  await expect(page.getByRole('heading', { name: 'Help someone nearby' })).toBeVisible()
  await expect(page.getByText('Looking for homemade birthday cake')).toBeVisible()

  await page.goto(`${baseUrl}/offers?category=food&distance=all`)
  await expect(page.getByRole('heading', { name: 'Find help you can trust' })).toBeVisible()
  await expect(page.getByText('Fresh Homemade Tamales (dozen)')).toBeVisible()
})

test('posts a need and shows suggested offer matches', async ({ page }) => {
  const title = `Need marketplace smoke ${crypto.randomUUID()}`
  await cleanupListing(title)

  try {
    await signIn(page)

    await page.goto(`${baseUrl}/profile/listing/new?type=need`)
    await expect(page.getByText('Tell your community what you')).toBeVisible()
    await page.getByLabel('Title').fill(title)
    await page
      .getByLabel('Description')
      .fill('Need a neighbor who can help with food for a small gathering.')
    await page.getByRole('button', { name: 'Food' }).click()
    await page.getByRole('spinbutton').fill('2')
    await page.getByRole('button', { name: /Post and match/i }).click()

    await page.waitForURL(/\/listing\/.*\/matches/)
    await expect(page.getByRole('heading', { name: 'Start with these matches' })).toBeVisible()
    await expect(page.getByText('Fresh Homemade Tamales (dozen)')).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Request this offer/i }).first(),
    ).toBeVisible()
  } finally {
    await cleanupListing(title)
  }
})
