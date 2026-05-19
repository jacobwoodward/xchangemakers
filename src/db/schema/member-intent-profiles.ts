import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  json,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { members } from './members'

export const memberIntentProfiles = pgTable('member_intent_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().unique().references(() => members.id),
  canHelpCategories: json('can_help_categories')
    .$type<string[]>()
    .default([])
    .notNull(),
  needsHelpCategories: json('needs_help_categories')
    .$type<string[]>()
    .default([])
    .notNull(),
  happeningInterests: json('happening_interests')
    .$type<string[]>()
    .default([])
    .notNull(),
  radiusMiles: integer('radius_miles').default(10).notNull(),
  notificationFrequency: varchar('notification_frequency', { length: 24 })
    .default('daily')
    .notNull(),
  shareAvailability: boolean('share_availability').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const memberIntentProfilesRelations = relations(
  memberIntentProfiles,
  ({ one }) => ({
    member: one(members, {
      fields: [memberIntentProfiles.memberId],
      references: [members.id],
    }),
  }),
)
