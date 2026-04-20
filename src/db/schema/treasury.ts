import { pgTable, pgEnum, uuid, varchar, decimal, integer, timestamp } from 'drizzle-orm/pg-core'

export const communityTierEnum = pgEnum('community_tier', [
  'starting',
  'active',
  'established',
  'strong',
])

export const treasury = pgTable('treasury', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityName: varchar('community_name', { length: 255 }).notNull(),
  balance: decimal('balance').default('0').notNull(),
  tier: communityTierEnum('tier').default('starting').notNull(),
  exchangesThisWeek: integer('exchanges_this_week').default(0).notNull(),
  totalExchanges: integer('total_exchanges').default(0).notNull(),
  totalMembers: integer('total_members').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
