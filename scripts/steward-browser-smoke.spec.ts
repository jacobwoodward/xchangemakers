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

interface StewardFixture {
  stewardEmail: string
  pendingMemberId: string
  pendingMemberEmail: string
  staleListingId: string
  staleListingTitle: string
  flaggedListingId: string
  flagId: string
  flagReason: string
  pastHappeningId: string
  pastHappeningTitle: string
  disputeExchangeId: string
  disputeListingId: string
  disputeTitle: string
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

async function createStewardFixture(): Promise<StewardFixture> {
  const sql = postgres(databaseUrl, { max: 1 })
  const token = crypto.randomUUID()
  const pendingMemberEmail = `steward-pending-${token}@example.com`
  const staleListingTitle = `Stale steward listing ${token}`
  const flaggedListingTitle = `Flagged steward listing ${token}`
  const flagReason = `Flag reason ${token}`
  const pastHappeningTitle = `Past steward event ${token}`
  const disputeTitle = `Disputed steward exchange ${token}`
  const amount = 1

  try {
    const [steward] = await sql`
      SELECT id, email, community_id
      FROM members
      WHERE lower(email) IN ('lauren@example.com', 'lauren.chen@email.com')
      ORDER BY joined_at
      LIMIT 1
    `
    if (!steward?.id || !steward?.email) throw new Error('No Lauren steward found')

    const [provider] = await sql`
      SELECT id, community_id
      FROM members
      WHERE id <> ${steward.id}
      ORDER BY joined_at
      LIMIT 1
    `
    if (!provider?.id) throw new Error('No provider member found')

    await sql`
      UPDATE members
      SET is_steward = true,
          status = 'active',
          reviewed_at = now()
      WHERE id = ${steward.id}
    `
    if (steward.community_id) {
      await sql`
        UPDATE members
        SET community_id = ${steward.community_id}
        WHERE id = ${provider.id}
      `
    }

    const [pendingMember] = await sql`
      INSERT INTO members (
        first_name,
        last_name,
        email,
        bio,
        vibe,
        community_id,
        neighborhood,
        latitude,
        longitude,
        membership_type,
        status,
        is_steward
      )
      VALUES (
        'Steward',
        'Pending',
        ${pendingMemberEmail},
        'Created by steward smoke coverage.',
        'Ready to join',
        ${steward.community_id},
        'Oak Forest',
        29.8105,
        -95.4100,
        'standard',
        'pending',
        false
      )
      RETURNING id
    `

    const [staleListing] = await sql`
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
        ${steward.id},
        'offering',
        ${staleListingTitle},
        'Old listing created by steward smoke coverage.',
        'services',
        1,
        'one_time',
        now() - interval '60 days',
        now() - interval '1 day'
      )
      RETURNING id
    `

    const [flaggedListing] = await sql`
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
        ${steward.id},
        'offering',
        ${flaggedListingTitle},
        'Flagged listing created by steward smoke coverage.',
        'services',
        1,
        'one_time',
        now(),
        now() + interval '45 days'
      )
      RETURNING id
    `

    const [flag] = await sql`
      INSERT INTO steward_flags (
        target_type,
        target_id,
        reason,
        status,
        created_by_id
      )
      VALUES (
        'listing',
        ${flaggedListing.id},
        ${flagReason},
        'open',
        ${steward.id}
      )
      RETURNING id
    `

    const [pastHappening] = await sql`
      INSERT INTO happenings (
        host_id,
        title,
        description,
        category,
        location,
        latitude,
        longitude,
        start_at,
        end_at
      )
      VALUES (
        ${steward.id},
        ${pastHappeningTitle},
        'Past event created by steward smoke coverage.',
        'community',
        'Oak Forest Park',
        29.8105,
        -95.4100,
        now() - interval '3 days',
        now() - interval '2 days'
      )
      RETURNING id
    `

    const [requesterWallet] = await sql<WalletSnapshot[]>`
      SELECT id, balance, total_earned, monthly_earned, escrow_held
      FROM wallets
      WHERE member_id = ${steward.id}
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

    const [disputeListing] = await sql`
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
        ${disputeTitle},
        'Disputed listing created by steward smoke coverage.',
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
        ${disputeListing.id},
        ${provider.id},
        ${steward.id},
        ${`steward-smoke:${disputeListing.id}`},
        'disputed',
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
        'Credits held for steward smoke dispute',
        ${exchange.id},
        ${`${exchange.id}:${requesterWallet.id}:hold`}
      )
    `

    return {
      stewardEmail: steward.email,
      pendingMemberId: pendingMember.id,
      pendingMemberEmail,
      staleListingId: staleListing.id,
      staleListingTitle,
      flaggedListingId: flaggedListing.id,
      flagId: flag.id,
      flagReason,
      pastHappeningId: pastHappening.id,
      pastHappeningTitle,
      disputeExchangeId: exchange.id,
      disputeListingId: disputeListing.id,
      disputeTitle,
      requesterWallet,
      providerWallet,
    }
  } finally {
    await sql.end()
  }
}

async function cleanupFixture(fixture: StewardFixture | null) {
  if (!fixture) return

  const sql = postgres(databaseUrl, { max: 1 })
  try {
    await sql`DELETE FROM steward_flags WHERE id = ${fixture.flagId}`
    await sql`
      DELETE FROM happening_rsvps
      WHERE happening_id = ${fixture.pastHappeningId}
    `
    await sql`DELETE FROM happenings WHERE id = ${fixture.pastHappeningId}`
    await sql`DELETE FROM wallet_transactions WHERE exchange_id = ${fixture.disputeExchangeId}`
    await sql`DELETE FROM bookings WHERE exchange_id = ${fixture.disputeExchangeId}`
    await sql`DELETE FROM exchanges WHERE id = ${fixture.disputeExchangeId}`
    await sql`
      DELETE FROM listings
      WHERE id IN (${fixture.staleListingId}, ${fixture.flaggedListingId}, ${fixture.disputeListingId})
    `
    await sql`DELETE FROM wallets WHERE member_id = ${fixture.pendingMemberId}`
    await sql`DELETE FROM members WHERE id = ${fixture.pendingMemberId}`

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

test('lets a steward operate member, dispute, cleanup, match, and flag queues', async ({ page }) => {
  let fixture: StewardFixture | null = null

  try {
    fixture = await createStewardFixture()
    await signIn(page, fixture.stewardEmail)

    await page.goto(`${baseUrl}/steward`)
    await expect(page.getByRole('heading', { name: 'Steward Console' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Community Health' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Member Review' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Invite Tracking' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Disputes' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Match Assist' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content Cleanup' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Flagged Content' })).toBeVisible()

    const memberRow = page.locator('div').filter({ hasText: fixture.pendingMemberEmail }).first()
    await memberRow.getByRole('button', { name: 'Approve' }).click()
    await expect(page.getByText(fixture.pendingMemberEmail)).not.toBeVisible()

    const disputeRow = page.locator('div').filter({ hasText: fixture.disputeTitle }).first()
    await disputeRow.getByRole('button', { name: 'Refund' }).click()

    const listingRow = page.locator('div').filter({ hasText: fixture.staleListingTitle }).first()
    await listingRow.getByRole('button', { name: 'Archive' }).click()

    const eventRow = page.locator('div').filter({ hasText: fixture.pastHappeningTitle }).first()
    await eventRow.getByRole('button', { name: 'Remove' }).click()
    await expect(page.getByText(fixture.pastHappeningTitle)).not.toBeVisible()

    const flagRow = page.locator('div').filter({ hasText: fixture.flagReason }).first()
    await flagRow.getByRole('button', { name: 'Resolve' }).click()
    await expect(page.getByText(fixture.flagReason)).not.toBeVisible()

    const sql = postgres(databaseUrl, { max: 1 })
    try {
      const [member] = await sql`
        SELECT status FROM members WHERE id = ${fixture.pendingMemberId}
      `
      const [exchange] = await sql`
        SELECT status FROM exchanges WHERE id = ${fixture.disputeExchangeId}
      `
      const [listing] = await sql`
        SELECT is_active FROM listings WHERE id = ${fixture.staleListingId}
      `
      const [flag] = await sql`
        SELECT status FROM steward_flags WHERE id = ${fixture.flagId}
      `

      expect(member.status).toBe('active')
      expect(exchange.status).toBe('cancelled')
      expect(listing.is_active).toBe(false)
      expect(flag.status).toBe('resolved')
    } finally {
      await sql.end()
    }
  } finally {
    await cleanupFixture(fixture)
  }
})
