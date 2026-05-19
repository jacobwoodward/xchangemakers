import { relations } from 'drizzle-orm'
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { members } from './members'

export const notificationTypeEnum = pgEnum('notification_type', [
  'matched_need',
  'urgent_need',
  'offer_received',
  'offer_accepted',
  'backup_available',
  'event_match',
  'schedule_reminder',
  'completion_prompt',
])

export const notificationPriorityEnum = pgEnum('notification_priority', [
  'normal',
  'high',
  'urgent',
])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id),
  type: notificationTypeEnum('type').notNull(),
  priority: notificationPriorityEnum('priority').default('normal').notNull(),
  title: varchar('title', { length: 180 }).notNull(),
  body: text('body').notNull(),
  targetPath: varchar('target_path', { length: 500 }).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  member: one(members, {
    fields: [notifications.memberId],
    references: [members.id],
  }),
}))
