import { pgTable, pgEnum, uuid, integer, timestamp } from 'drizzle-orm/pg-core'
import { members } from './members'
import { listings } from './listings'

export const exchangeStatusEnum = pgEnum('exchange_status', [
  'requested',
  'accepted',
  'in_escrow',
  'completed',
  'cancelled',
  'disputed',
])

export const exchanges = pgTable('exchanges', {
  id: uuid('id').primaryKey().defaultRandom(),
  listingId: uuid('listing_id').notNull().references(() => listings.id),
  providerId: uuid('provider_id').notNull().references(() => members.id),
  requesterId: uuid('requester_id').notNull().references(() => members.id),
  status: exchangeStatusEnum('status').default('requested').notNull(),
  euAmount: integer('eu_amount').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
