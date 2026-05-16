import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { members } from './members'

export const stewardFlagTargetEnum = pgEnum('steward_flag_target', [
  'member',
  'listing',
  'exchange',
  'happening',
])

export const stewardFlagStatusEnum = pgEnum('steward_flag_status', [
  'open',
  'resolved',
])

export const stewardFlags = pgTable('steward_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetType: stewardFlagTargetEnum('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  status: stewardFlagStatusEnum('status').default('open').notNull(),
  createdById: uuid('created_by_id').references(() => members.id),
  resolvedById: uuid('resolved_by_id').references(() => members.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
