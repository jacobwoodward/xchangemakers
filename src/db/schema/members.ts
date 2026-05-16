import { pgTable, pgEnum, uuid, varchar, text, decimal, boolean, timestamp } from 'drizzle-orm/pg-core'
import { communities } from './communities'

export const membershipTypeEnum = pgEnum('membership_type', [
  'standard',
  'business',
  'community_contribution',
])

export const memberStatusEnum = pgEnum('member_status', [
  'pending',
  'active',
  'paused',
])

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: text('bio'),
  vibe: varchar('vibe', { length: 200 }),
  communityId: uuid('community_id').references(() => communities.id),
  neighborhood: varchar('neighborhood', { length: 255 }).notNull(),
  latitude: decimal('latitude').notNull(),
  longitude: decimal('longitude').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  availabilityNote: varchar('availability_note', { length: 255 }),
  membershipType: membershipTypeEnum('membership_type').default('standard').notNull(),
  status: memberStatusEnum('status').default('active').notNull(),
  isSteward: boolean('is_steward').default(false).notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
