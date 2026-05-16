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
    `
  } finally {
    await sql.end()
  }
}

async function createListingForMember({
  title,
  memberFirstName,
  type,
  category,
  description,
  creditPrice,
}: {
  title: string
  memberFirstName: string
  type: 'offering' | 'need'
  category: string
  description: string
  creditPrice: number
}): Promise<string> {
  const sql = postgres(databaseUrl, { max: 1 })

  try {
    const [member] = await sql`
      SELECT id FROM members
      WHERE first_name = ${memberFirstName}
      ORDER BY joined_at
      LIMIT 1
    `
    if (!member?.id) {
      throw new Error(`No seeded member found for ${memberFirstName}`)
    }

    const [listing] = await sql`
      INSERT INTO listings (
        member_id,
        type,
        title,
        description,
        category,
        credit_price,
        availability_type,
        refreshed_at,
        expires_at
      )
      VALUES (
        ${member.id},
        ${type},
        ${title},
        ${description},
        ${category},
        ${creditPrice},
        'one_time',
        now(),
        now() + interval '45 days'
      )
      RETURNING id
    `
    return listing.id
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
    await page.getByLabel(/What do you need help with/i).fill(title)
    await page
      .getByLabel(/What would help look like/i)
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

test('posts an offer and shows matching open needs', async ({ page }) => {
  const title = `Offer marketplace smoke ${crypto.randomUUID()}`
  const needTitle = `Open need smoke ${crypto.randomUUID()}`
  await cleanupListing(title)
  await cleanupListing(needTitle)
  await createListingForMember({
    title: needTitle,
    memberFirstName: 'Maria',
    type: 'need',
    category: 'services',
    description: 'Need help moving a few bulky boxes from the garage.',
    creditPrice: 2,
  })

  try {
    await signIn(page)

    await page.goto(`${baseUrl}/profile/listing/new?type=offering`)
    await expect(page.getByText('Share what you can offer')).toBeVisible()
    await page.getByLabel(/What can you offer/i).fill(title)
    await page
      .getByLabel(/What should neighbors expect/i)
      .fill('I can bring a truck and help haul bulky home project materials.')
    await page.getByRole('button', { name: 'Services' }).click()
    await page.getByRole('spinbutton').fill('2')
    await page.getByRole('button', { name: /Post and match/i }).click()

    await page.waitForURL(/\/listing\/.*\/matches/)
    await expect(page.getByRole('heading', { name: 'Start with these matches' })).toBeVisible()
    await expect(page.getByText(needTitle)).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Respond to this need/i }).first(),
    ).toBeVisible()
  } finally {
    await cleanupListing(title)
    await cleanupListing(needTitle)
  }
})

test('responds to an open need by starting a direct message', async ({ page }) => {
  const needTitle = `Need response smoke ${crypto.randomUUID()}`
  await cleanupListing(needTitle)
  const needId = await createListingForMember({
    title: needTitle,
    memberFirstName: 'Maria',
    type: 'need',
    category: 'services',
    description: 'Need help loading a donation box into a car.',
    creditPrice: 1,
  })

  try {
    await signIn(page)

    await page.goto(`${baseUrl}/listing/${needId}`)
    await expect(page.getByText(needTitle)).toBeVisible()
    await page.getByRole('button', { name: /Respond to This Need/i }).click()

    await page.waitForURL(/\/messages\/.*/)
    await expect(page.getByText('Maria Gonzalez')).toBeVisible()
  } finally {
    await cleanupListing(needTitle)
  }
})
