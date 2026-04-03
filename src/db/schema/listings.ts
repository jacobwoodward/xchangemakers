import { pgTable, pgEnum, uuid, varchar, text, integer, boolean, timestamp, json } from 'drizzle-orm/pg-core'
import { members } from './members'

export const listingTypeEnum = pgEnum('listing_type', [
  'offering',
  'need',
])

export const listingCategoryEnum = pgEnum('listing_category', [
  'food',
  'services',
  'skills',
  'classes',
  'handmade',
  'wellness',
  'tech',
  'home',
  'kids',
  'other',
])

export const availabilityTypeEnum = pgEnum('availability_type', [
  'ongoing',
  'one_time',
  'event_only',
])

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  type: listingTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: listingCategoryEnum('category').notNull(),
  creditPrice: integer('credit_price').notNull(),
  availabilityType: availabilityTypeEnum('availability_type').default('ongoing').notNull(),
  imageUrls: json('image_urls').$type<string[]>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
