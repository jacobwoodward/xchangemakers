import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  decimal,
} from 'drizzle-orm/pg-core'

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  city: varchar('city', { length: 120 }).notNull(),
  region: varchar('region', { length: 80 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  centerLatitude: decimal('center_latitude').notNull(),
  centerLongitude: decimal('center_longitude').notNull(),
  status: varchar('status', { length: 24 }).default('active').notNull(),
  inviteOnly: boolean('invite_only').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const communityInvites = pgTable('community_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id')
    .notNull()
    .references(() => communities.id),
  code: varchar('code', { length: 64 }).notNull().unique(),
  label: varchar('label', { length: 255 }).notNull(),
  maxUses: integer('max_uses'),
  usageCount: integer('usage_count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
