import { pgTable, pgEnum, uuid, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { members } from './members'

export const onboardingStepEnum = pgEnum('onboarding_step', [
  'profile_photo',
  'intro_vibe',
  'add_offerings',
  'post_need',
  'rsvp_happening',
  'first_exchange',
  'first_review',
  'invite_neighbor',
])

export const onboardingProgress = pgTable('onboarding_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  step: onboardingStepEnum('step').notNull(),
  completed: boolean('completed').default(false).notNull(),
  euEarned: integer('eu_earned').default(0).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  member: one(members, {
    fields: [onboardingProgress.memberId],
    references: [members.id],
  }),
}))
