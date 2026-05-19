import { relations } from 'drizzle-orm'
import {
  boolean,
  decimal,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { members } from './members'

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().unique().references(() => members.id),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  categories: json('categories').$type<string[]>().default([]).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  serviceArea: varchar('service_area', { length: 255 }),
  phone: varchar('phone', { length: 40 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  directionsUrl: varchar('directions_url', { length: 500 }),
  hours: json('hours').$type<Record<string, string>>().default({}).notNull(),
  photoUrls: json('photo_urls').$type<string[]>().default([]).notNull(),
  contributionNotes: text('contribution_notes'),
  contributionBadges: json('contribution_badges').$type<string[]>().default([]).notNull(),
  communityHoursContributed: integer('community_hours_contributed').default(0).notNull(),
  rating: decimal('rating').default('5.0').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  isCommunityFavorite: boolean('is_community_favorite').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const businessProfilesRelations = relations(businessProfiles, ({ one }) => ({
  member: one(members, {
    fields: [businessProfiles.memberId],
    references: [members.id],
  }),
}))
