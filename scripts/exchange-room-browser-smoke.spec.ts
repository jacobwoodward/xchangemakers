import crypto from 'node:crypto'
import { test, expect, type Page } from '@playwright/test'
import postgres from 'postgres'

const baseUrl = process.env.AUTH_SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

test.use({ channel: 'chrome' })

interface WalletSnapshot {
  id: string
  balance: number
  total_earned: number
  monthly_earned: number
  escrow_held: number
}

interface ExchangeFixture {
  exchangeId: string
  listingId: string
  requesterWallet: WalletSnapshot
  providerWallet: WalletSnapshot
}

async function signIn(page: Page, email: string) {
  await page.goto(`${baseUrl}/sign-in`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: /Sign In/i }).click()
  await page.waitForURL(`${baseUrl}/`)
}

async function createExchangeFixture(): Promise<{
  fixture: ExchangeFixture
  email: string
}> {
  const sql = postgres(databaseUrl, { max: 1 })
  const title = `Exchange room smoke ${crypto.randomUUID()}`
  const amount = 1

  try {
    const [requester] = await sql`
      SELECT id, email FROM members
      WHERE lower(first_name) = 'lauren'
      ORDER BY joined_at
      LIMIT 1
    `
    const [provider] = await sql`
      SELECT id FROM members
      WHERE lower(first_name) = 'maria'
      ORDER BY joined_at
      LIMIT 1
    `
    if (!requester?.id || !requester?.email) {
      throw new Error('No Lauren member found')
    }
    if (!provider?.id) {
      throw new Error('No Maria member found')
    }

    const [requesterWallet] = await sql<WalletSnapshot[]>`
      SELECT id, balance, total_earned, monthly_earned, escrow_held
      FROM wallets
      WHERE member_id = ${requester.id}
      LIMIT 1
    `
    const [providerWallet] = await sql<WalletSnapshot[]>`
      SELECT id, balance, total_earned, monthly_earned, escrow_held
      FROM wallets
      WHERE member_id = ${provider.id}
      LIMIT 1
    `
    if (!requesterWallet || !providerWallet) {
      throw new Error('Fixture members need wallets')
    }

    await sql`
      UPDATE wallets
      SET balance = GREATEST(balance, ${amount})
      WHERE id = ${requesterWallet.id}
    `

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
        ${provider.id},
        'offering',
        ${title},
        'A short listing created by the exchange-room smoke test.',
        'services',
        ${amount},
        'one_time',
        now(),
        now() + interval '45 days'
      )
      RETURNING id
    `

    const [exchange] = await sql`
      INSERT INTO exchanges (
        listing_id,
        provider_id,
        requester_id,
        idempotency_key,
        status,
        tu_amount
      )
      VALUES (
        ${listing.id},
        ${provider.id},
        ${requester.id},
        ${`smoke:${listing.id}`},
        'requested',
        ${amount}
      )
      RETURNING id
    `

    await sql`
      UPDATE wallets
      SET balance = balance - ${amount},
          escrow_held = escrow_held + ${amount}
      WHERE id = ${requesterWallet.id}
    `
    await sql`
      INSERT INTO wallet_transactions (
        wallet_id,
        type,
        amount,
        description,
        exchange_id,
        operation_key
      )
      VALUES (
        ${requesterWallet.id},
        'escrow_hold',
        ${amount},
        'Credits held for smoke exchange',
        ${exchange.id},
        ${`${exchange.id}:${requesterWallet.id}:hold`}
      )
    `

    return {
      fixture: {
        exchangeId: exchange.id,
        listingId: listing.id,
        requesterWallet,
        providerWallet,
      },
      email: requester.email,
    }
  } finally {
    await sql.end()
  }
}

async function cleanupFixture(fixture: ExchangeFixture | null) {
  if (!fixture) return

  const sql = postgres(databaseUrl, { max: 1 })
  try {
    const conversations = await sql`
      SELECT id FROM conversations
      WHERE exchange_id = ${fixture.exchangeId}
    `
    const conversationIds = conversations.map((row) => row.id)

    if (conversationIds.length > 0) {
      await sql`DELETE FROM messages WHERE conversation_id IN ${sql(conversationIds)}`
      await sql`
        DELETE FROM conversation_participants
        WHERE conversation_id IN ${sql(conversationIds)}
      `
      await sql`DELETE FROM conversations WHERE id IN ${sql(conversationIds)}`
    }

    const reviewRows = await sql`
      SELECT id FROM reviews
      WHERE exchange_id = ${fixture.exchangeId}
    `
    const reviewIds = reviewRows.map((row) => row.id)
    if (reviewIds.length > 0) {
      await sql`DELETE FROM reputation_tags WHERE review_id IN ${sql(reviewIds)}`
    }

    await sql`DELETE FROM reviews WHERE exchange_id = ${fixture.exchangeId}`
    await sql`DELETE FROM bookings WHERE exchange_id = ${fixture.exchangeId}`
    await sql`DELETE FROM wallet_transactions WHERE exchange_id = ${fixture.exchangeId}`
    await sql`DELETE FROM exchanges WHERE id = ${fixture.exchangeId}`
    await sql`DELETE FROM listings WHERE id = ${fixture.listingId}`

    await sql`
      UPDATE wallets
      SET balance = ${fixture.requesterWallet.balance},
          total_earned = ${fixture.requesterWallet.total_earned},
          monthly_earned = ${fixture.requesterWallet.monthly_earned},
          escrow_held = ${fixture.requesterWallet.escrow_held}
      WHERE id = ${fixture.requesterWallet.id}
    `
    await sql`
      UPDATE wallets
      SET balance = ${fixture.providerWallet.balance},
          total_earned = ${fixture.providerWallet.total_earned},
          monthly_earned = ${fixture.providerWallet.monthly_earned},
          escrow_held = ${fixture.providerWallet.escrow_held}
      WHERE id = ${fixture.providerWallet.id}
    `
  } finally {
    await sql.end()
  }
}

async function assertLedgerIntegrity(exchangeId: string) {
  const sql = postgres(databaseUrl, { max: 1 })
  try {
    const rows = await sql`
      SELECT type, count(*)::int AS count
      FROM wallet_transactions
      WHERE exchange_id = ${exchangeId}
      GROUP BY type
    `
    const counts = new Map(rows.map((row) => [row.type, row.count]))

    expect(counts.get('escrow_hold')).toBe(1)
    expect(counts.get('escrow_release')).toBe(1)
    expect(counts.get('spent')).toBe(1)

    const duplicateOperations = await sql`
      SELECT operation_key, count(*)::int AS count
      FROM wallet_transactions
      WHERE exchange_id = ${exchangeId}
        AND operation_key IS NOT NULL
      GROUP BY operation_key
      HAVING count(*) > 1
    `
    expect(duplicateOperations).toHaveLength(0)
  } finally {
    await sql.end()
  }
}

test('manages an exchange from the room without duplicate ledger release', async ({ page }) => {
  let fixture: ExchangeFixture | null = null

  try {
    const created = await createExchangeFixture()
    fixture = created.fixture

    await signIn(page, created.email)

    await page.goto(`${baseUrl}/exchange/${fixture.exchangeId}`)
    await expect(page.getByRole('heading', { name: 'Exchange room smoke' })).toBeVisible()
    await expect(page.getByText('Credit Ledger')).toBeVisible()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowInput = tomorrow.toISOString().slice(0, 10)

    await page.getByLabel('Date', { exact: true }).fill(tomorrowInput)
    await page.getByLabel('Start', { exact: true }).fill('09:00')
    await page.getByLabel('End', { exact: true }).fill('10:00')
    await page.getByRole('button', { name: /Save Schedule/i }).click()
    await expect(page.getByRole('button', { name: /Complete/i })).toBeVisible()

    const message = `Smoke message ${crypto.randomUUID()}`
    await page.getByPlaceholder('Message...').fill(message)
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByText(message)).toBeVisible()

    await page.getByRole('button', { name: /Complete/i }).dblclick()
    await expect(page.getByText('Completed')).toBeVisible()

    await page.getByRole('button', { name: 'Reliable' }).click()
    await page.getByLabel('Private note').fill('Smooth exchange-room smoke test.')
    await page.getByRole('button', { name: /Submit Review/i }).click()
    await expect(page.getByText(/Your review for/i)).toBeVisible()

    await assertLedgerIntegrity(fixture.exchangeId)
  } finally {
    await cleanupFixture(fixture)
  }
})
