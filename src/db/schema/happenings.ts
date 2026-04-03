import { pgTable, pgEnum, uuid, varchar, text, decimal, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { members } from './members'

export const happeningCategoryEnum = pgEnum('happening_category', [
  'kids',
  'food',
  'markets',
  'fitness',
  'classes',
  'social',
  'community',
  'exchange_event',
])

export const rsvpStatusEnum = pgEnum('rsvp_status', [
  'going',
  'interested',
])

export const happenings = pgTable('happenings', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id').notNull().references(() => members.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: happeningCategoryEnum('category').notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  latitude: decimal('latitude'),
  longitude: decimal('longitude'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const happeningsRelations = relations(happenings, ({ one, many }) => ({
  host: one(members, {
    fields: [happenings.hostId],
    references: [members.id],
  }),
  rsvps: many(happeningRsvps),
}))

export const happeningRsvps = pgTable('happening_rsvps', {
  id: uuid('id').primaryKey().defaultRandom(),
  happeningId: uuid('happening_id').notNull().references(() => happenings.id),
  memberId: uuid('member_id').notNull().references(() => members.id),
  status: rsvpStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const happeningRsvpsRelations = relations(happeningRsvps, ({ one }) => ({
  happening: one(happenings, {
    fields: [happeningRsvps.happeningId],
    references: [happenings.id],
  }),
  member: one(members, {
    fields: [happeningRsvps.memberId],
    references: [members.id],
  }),
}))
