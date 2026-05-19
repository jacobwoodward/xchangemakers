import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import * as Module from 'module'
import path from 'path'
import { db, dbClient } from '../src/db'
import {
  analyticsEvents,
  happeningRsvps,
  happenings,
  helperPreferences,
  listings,
  memberIntentProfiles,
  members,
  needWindows,
  notifications,
} from '../src/db/schema'

type SmokeEngine = {
  initialize(memberId?: string): Promise<void>
  markNeedStillNeedsHelp(needId: string): Promise<{ id: string }>
  createHappening(input: {
    title: string
    description: string
    category: 'social'
    location: string
    startAt: string
    endAt: string
  }): Promise<{ id: string }>
  createListing(input: {
    type: 'need'
    title: string
    description: string
    category: 'home'
    creditPrice: number
    availabilityType: 'one_time'
    publicLocationLabel: string
    isLocationPrivate: boolean
    windows: {
      startsAt: string
      endsAt: string
      label: string
    }[]
  }): Promise<{ id: string }>
}

async function createHappening(
  engine: SmokeEngine,
  runId: string,
  title: string,
) {
  const startsAt = new Date(Date.now() + 3 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 90 * 60 * 1000)

  return await engine.createHappening({
    title: `${title} ${runId}`,
    description: 'Notification smoke test happening fixture',
    category: 'social',
    location: 'Friendswood Library',
    startAt: startsAt.toISOString(),
    endAt: endsAt.toISOString(),
  })
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function currentQuietHours(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getTime() - 60 * 60 * 1000)
  const end = new Date(now.getTime() + 60 * 60 * 1000)

  return {
    start: `${String(start.getHours()).padStart(2, '0')}:${String(
      start.getMinutes(),
    ).padStart(2, '0')}`,
    end: `${String(end.getHours()).padStart(2, '0')}:${String(
      end.getMinutes(),
    ).padStart(2, '0')}`,
  }
}

async function createNeed(engine: SmokeEngine, runId: string, title: string) {
  const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000)

  return await engine.createListing({
    type: 'need',
    title: `${title} ${runId}`,
    description: 'Notification smoke test fixture',
    category: 'home',
    creditPrice: 2,
    availabilityType: 'one_time',
    publicLocationLabel: 'Friendswood',
    isLocationPrivate: true,
    windows: [
      {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: 'Smoke window',
      },
    ],
  })
}

async function createEngine(): Promise<SmokeEngine> {
  const shimPath = path.join(
    process.cwd(),
    'scripts',
    'shims',
  )
  process.env.NODE_PATH = process.env.NODE_PATH
    ? `${shimPath}${path.delimiter}${process.env.NODE_PATH}`
    : shimPath
  ;(Module as unknown as { _initPaths: () => void })._initPaths()

  const module = await import('../src/lib/exchange-engine/client')
  return new module.ExchangeEngineClient()
}

async function countRunNotifications(helperId: string, runId: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.memberId, helperId),
        sql`${notifications.body} LIKE ${`%${runId}%`}`,
      ),
    )

  return rows.length
}

async function deleteRunData(
  runId: string,
  listingIds: string[],
  happeningIds: string[],
) {
  await db
    .delete(notifications)
    .where(sql`${notifications.body} LIKE ${`%${runId}%`}`)

  await db
    .delete(analyticsEvents)
    .where(sql`${analyticsEvents.metadata}::text LIKE ${`%${runId}%`}`)

  if (listingIds.length > 0) {
    await db.delete(needWindows).where(inArray(needWindows.needId, listingIds))
    await db.delete(listings).where(inArray(listings.id, listingIds))
  }

  if (happeningIds.length > 0) {
    await db
      .delete(happeningRsvps)
      .where(inArray(happeningRsvps.happeningId, happeningIds))
    await db.delete(happenings).where(inArray(happenings.id, happeningIds))
  }
}

async function main() {
  const runId = `NOTIFY-${Date.now()}`
  const createdListingIds: string[] = []
  const createdHappeningIds: string[] = []

  const [requester] = await db
    .select()
    .from(members)
    .where(eq(members.email, 'lauren.chen@email.com'))
    .limit(1)

  assert(requester, 'Lauren seed member is required for notification smoke')

  const [helper] = await db
    .select()
    .from(members)
    .where(and(ne(members.id, requester.id), eq(members.status, 'active')))
    .limit(1)

  assert(helper, 'An active helper seed member is required for notification smoke')

  const engine = await createEngine()
  await engine.initialize(requester.id)

  try {
    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))

    await db
      .insert(helperPreferences)
      .values({
        memberId: helper.id,
        categories: ['home'],
        radiusMiles: 25,
        urgentOnly: false,
        digestFrequency: 'daily',
        quietHoursStart: null,
        quietHoursEnd: null,
      })
      .onConflictDoUpdate({
        target: helperPreferences.memberId,
        set: {
          categories: ['home'],
          radiusMiles: 25,
          urgentOnly: false,
          digestFrequency: 'daily',
          quietHoursStart: null,
          quietHoursEnd: null,
          updatedAt: new Date(),
        },
      })

    for (let index = 0; index < 2; index += 1) {
      const need = await createNeed(engine, runId, `Daily match ${index + 1}`)
      createdListingIds.push(need.id)
    }

    assert(
      (await countRunNotifications(helper.id, runId)) === 1,
      'Daily digest should create one notification for multiple matching needs',
    )

    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))
    await db
      .update(helperPreferences)
      .set({
        digestFrequency: 'immediate',
        quietHoursStart: null,
        quietHoursEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(helperPreferences.memberId, helper.id))

    for (let index = 0; index < 4; index += 1) {
      const need = await createNeed(engine, runId, `Immediate match ${index + 1}`)
      createdListingIds.push(need.id)
    }

    assert(
      (await countRunNotifications(helper.id, runId)) === 3,
      'Immediate non-urgent matches should be capped at three per day',
    )

    const quietHours = currentQuietHours()
    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))
    await db
      .update(helperPreferences)
      .set({
        digestFrequency: 'immediate',
        quietHoursStart: quietHours.start,
        quietHoursEnd: quietHours.end,
        updatedAt: new Date(),
      })
      .where(eq(helperPreferences.memberId, helper.id))

    for (let index = 0; index < 2; index += 1) {
      const need = await createNeed(engine, runId, `Quiet match ${index + 1}`)
      createdListingIds.push(need.id)
    }

    assert(
      (await countRunNotifications(helper.id, runId)) === 1,
      'Quiet hours should batch non-urgent immediate matches',
    )

    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))
    await db
      .update(helperPreferences)
      .set({
        digestFrequency: 'immediate',
        quietHoursStart: null,
        quietHoursEnd: null,
        updatedAt: new Date(),
      })
      .where(eq(helperPreferences.memberId, helper.id))

    const stillOpenNeed = await createNeed(engine, runId, 'Still open match')
    createdListingIds.push(stillOpenNeed.id)
    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))
    await engine.markNeedStillNeedsHelp(stillOpenNeed.id)

    assert(
      (await countRunNotifications(helper.id, runId)) === 1,
      'Marking a need as still needing help should re-alert matching helpers',
    )

    await db
      .delete(notifications)
      .where(eq(notifications.memberId, helper.id))
    await db
      .insert(memberIntentProfiles)
      .values({
        memberId: helper.id,
        happeningInterests: ['social'],
        notificationFrequency: 'daily',
      })
      .onConflictDoUpdate({
        target: memberIntentProfiles.memberId,
        set: {
          happeningInterests: ['social'],
          notificationFrequency: 'daily',
          updatedAt: new Date(),
        },
      })

    for (let index = 0; index < 2; index += 1) {
      const happening = await createHappening(
        engine,
        runId,
        `Social mixer ${index + 1}`,
      )
      createdHappeningIds.push(happening.id)
    }

    assert(
      (await countRunNotifications(helper.id, runId)) === 1,
      'Daily event interest matches should be batched to one notification',
    )

    console.log('Notification rule smoke passed')
  } finally {
    await deleteRunData(runId, createdListingIds, createdHappeningIds)
    await dbClient.end({ timeout: 5 })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
