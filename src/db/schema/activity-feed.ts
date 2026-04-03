import { pgTable, pgEnum, uuid, json, timestamp } from 'drizzle-orm/pg-core'

export const activityTypeEnum = pgEnum('activity_type', [
  'new_listing',
  'new_member',
  'exchange_completed',
  'happening_posted',
  'treasury_milestone',
  'weekly_stats',
])

export const activityFeed = pgTable('activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: activityTypeEnum('type').notNull(),
  data: json('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
