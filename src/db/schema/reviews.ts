import { pgTable, pgEnum, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { members } from './members'
import { exchanges } from './exchanges'

export const reputationTagEnum = pgEnum('reputation_tag', [
  'on_time',
  'quality',
  'friendly',
  'generous',
  'reliable',
  'great_communicator',
])

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  exchangeId: uuid('exchange_id').notNull().references(() => exchanges.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => members.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => members.id),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique('reviews_exchange_reviewer_unique').on(table.exchangeId, table.reviewerId),
])

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  exchange: one(exchanges, {
    fields: [reviews.exchangeId],
    references: [exchanges.id],
  }),
  reviewer: one(members, {
    fields: [reviews.reviewerId],
    references: [members.id],
    relationName: 'reviewer',
  }),
  reviewee: one(members, {
    fields: [reviews.revieweeId],
    references: [members.id],
    relationName: 'reviewee',
  }),
  tags: many(reputationTags),
}))

export const reputationTags = pgTable('reputation_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => members.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => members.id),
  tag: reputationTagEnum('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const reputationTagsRelations = relations(reputationTags, ({ one }) => ({
  review: one(reviews, {
    fields: [reputationTags.reviewId],
    references: [reviews.id],
  }),
  reviewer: one(members, {
    fields: [reputationTags.reviewerId],
    references: [members.id],
    relationName: 'tagReviewer',
  }),
  reviewee: one(members, {
    fields: [reputationTags.revieweeId],
    references: [members.id],
    relationName: 'tagReviewee',
  }),
}))
