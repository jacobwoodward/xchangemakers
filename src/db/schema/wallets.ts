import { pgTable, pgEnum, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { members } from './members'

export const transactionTypeEnum = pgEnum('transaction_type', [
  'earned',
  'spent',
  'escrow_hold',
  'escrow_release',
  'escrow_return',
])

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().unique().references(() => members.id),
  balance: integer('balance').default(0).notNull(),
  totalEarned: integer('total_earned').default(0).notNull(),
  monthlyEarned: integer('monthly_earned').default(0).notNull(),
  escrowHeld: integer('escrow_held').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  exchangeId: uuid('exchange_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
