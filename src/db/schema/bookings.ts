import { pgTable, pgEnum, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { members } from './members'
import { exchanges } from './exchanges'

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
])

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  exchangeId: uuid('exchange_id').notNull().references(() => exchanges.id),
  providerId: uuid('provider_id').notNull().references(() => members.id),
  requesterId: uuid('requester_id').notNull().references(() => members.id),
  date: timestamp('date', { withTimezone: true }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(), // "10:00"
  status: bookingStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const bookingsRelations = relations(bookings, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [bookings.exchangeId],
    references: [exchanges.id],
  }),
  provider: one(members, {
    fields: [bookings.providerId],
    references: [members.id],
    relationName: 'bookingProvider',
  }),
  requester: one(members, {
    fields: [bookings.requesterId],
    references: [members.id],
    relationName: 'bookingRequester',
  }),
}))

export const availabilitySlots = pgTable('availability_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6
  startTime: varchar('start_time', { length: 5 }).notNull(), // "09:00"
  endTime: varchar('end_time', { length: 5 }).notNull(), // "17:00"
  isRecurring: boolean('is_recurring').default(true).notNull(),
})

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
  member: one(members, {
    fields: [availabilitySlots.memberId],
    references: [members.id],
  }),
}))
