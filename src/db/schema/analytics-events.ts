import { relations } from 'drizzle-orm'
import {
  json,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { members } from './members'

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').references(() => members.id),
  eventType: varchar('event_type', { length: 80 }).notNull(),
  targetType: varchar('target_type', { length: 60 }),
  targetId: uuid('target_id'),
  metadata: json('metadata')
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  member: one(members, {
    fields: [analyticsEvents.memberId],
    references: [members.id],
  }),
}))
