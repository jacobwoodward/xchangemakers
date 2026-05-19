import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { exchanges } from './exchanges'
import { listings } from './listings'
import { members } from './members'

export const needWindowStatusEnum = pgEnum('need_window_status', [
  'open',
  'offered',
  'assigned',
  'completed',
  'cancelled',
  'expired',
])

export const needOfferStatusEnum = pgEnum('need_offer_status', [
  'offered',
  'accepted',
  'declined',
  'withdrawn',
  'expired',
])

export const helperDigestFrequencyEnum = pgEnum('helper_digest_frequency', [
  'immediate',
  'daily',
  'weekly',
  'off',
])

export const needWindows = pgTable('need_windows', {
  id: uuid('id').primaryKey().defaultRandom(),
  needId: uuid('need_id').notNull().references(() => listings.id),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  label: varchar('label', { length: 120 }),
  isFlexible: boolean('is_flexible').default(false).notNull(),
  status: needWindowStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const needOffers = pgTable('need_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  needId: uuid('need_id').notNull().references(() => listings.id),
  windowId: uuid('window_id').notNull().references(() => needWindows.id),
  helperId: uuid('helper_id').notNull().references(() => members.id),
  message: text('message'),
  status: needOfferStatusEnum('status').default('offered').notNull(),
  exchangeId: uuid('exchange_id').references(() => exchanges.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('need_offers_helper_window_unique').on(
    table.needId,
    table.windowId,
    table.helperId,
  ),
])

export const helperPreferences = pgTable('helper_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().unique().references(() => members.id),
  categories: json('categories').$type<string[]>().default([]).notNull(),
  radiusMiles: integer('radius_miles').default(10).notNull(),
  urgentOnly: boolean('urgent_only').default(false).notNull(),
  digestFrequency: helperDigestFrequencyEnum('digest_frequency')
    .default('daily')
    .notNull(),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }),
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const needWindowsRelations = relations(needWindows, ({ one, many }) => ({
  need: one(listings, {
    fields: [needWindows.needId],
    references: [listings.id],
  }),
  offers: many(needOffers),
}))

export const needOffersRelations = relations(needOffers, ({ one }) => ({
  need: one(listings, {
    fields: [needOffers.needId],
    references: [listings.id],
  }),
  window: one(needWindows, {
    fields: [needOffers.windowId],
    references: [needWindows.id],
  }),
  helper: one(members, {
    fields: [needOffers.helperId],
    references: [members.id],
  }),
  exchange: one(exchanges, {
    fields: [needOffers.exchangeId],
    references: [exchanges.id],
  }),
}))

export const helperPreferencesRelations = relations(helperPreferences, ({ one }) => ({
  member: one(members, {
    fields: [helperPreferences.memberId],
    references: [members.id],
  }),
}))
