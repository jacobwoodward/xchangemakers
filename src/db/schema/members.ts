import { pgTable, pgEnum, uuid, varchar, text, decimal, boolean, timestamp } from 'drizzle-orm/pg-core'

export const membershipTypeEnum = pgEnum('membership_type', [
  'standard',
  'business',
  'community_contribution',
])

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: text('bio'),
  vibe: varchar('vibe', { length: 200 }),
  neighborhood: varchar('neighborhood', { length: 255 }).notNull(),
  latitude: decimal('latitude').notNull(),
  longitude: decimal('longitude').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  availabilityNote: varchar('availability_note', { length: 255 }),
  membershipType: membershipTypeEnum('membership_type').default('standard').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
