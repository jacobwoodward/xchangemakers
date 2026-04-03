/**
 * Centralized relations for tables that have cross-file dependencies.
 * Tables that only reference upstream tables define their own relations
 * in their respective files (bookings, reviews, happenings, messages, onboarding).
 */
import { relations } from 'drizzle-orm'
import { members } from './members'
import { wallets, walletTransactions } from './wallets'
import { listings } from './listings'
import { exchanges } from './exchanges'
import { bookings, availabilitySlots } from './bookings'
import { reviews, reputationTags } from './reviews'
import { happenings, happeningRsvps } from './happenings'
import { onboardingProgress } from './onboarding'
import { conversationParticipants, messages } from './messages'

// ── Members ────────────────────────────────────────────────────────────
export const membersRelations = relations(members, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [members.id],
    references: [wallets.memberId],
  }),
  listings: many(listings),
  exchangesAsProvider: many(exchanges, { relationName: 'provider' }),
  exchangesAsRequester: many(exchanges, { relationName: 'requester' }),
  bookingsAsProvider: many(bookings, { relationName: 'bookingProvider' }),
  bookingsAsRequester: many(bookings, { relationName: 'bookingRequester' }),
  reviewsGiven: many(reviews, { relationName: 'reviewer' }),
  reviewsReceived: many(reviews, { relationName: 'reviewee' }),
  reputationTagsGiven: many(reputationTags, { relationName: 'tagReviewer' }),
  reputationTagsReceived: many(reputationTags, { relationName: 'tagReviewee' }),
  happenings: many(happenings),
  happeningRsvps: many(happeningRsvps),
  onboardingProgress: many(onboardingProgress),
  availabilitySlots: many(availabilitySlots),
  conversationParticipants: many(conversationParticipants),
  messagesSent: many(messages),
}))

// ── Wallets ────────────────────────────────────────────────────────────
export const walletsRelations = relations(wallets, ({ one, many }) => ({
  member: one(members, {
    fields: [wallets.memberId],
    references: [members.id],
  }),
  transactions: many(walletTransactions),
}))

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  exchange: one(exchanges, {
    fields: [walletTransactions.exchangeId],
    references: [exchanges.id],
  }),
}))

// ── Listings ───────────────────────────────────────────────────────────
export const listingsRelations = relations(listings, ({ one, many }) => ({
  member: one(members, {
    fields: [listings.memberId],
    references: [members.id],
  }),
  exchanges: many(exchanges),
}))

// ── Exchanges ──────────────────────────────────────────────────────────
export const exchangesRelations = relations(exchanges, ({ one, many }) => ({
  listing: one(listings, {
    fields: [exchanges.listingId],
    references: [listings.id],
  }),
  provider: one(members, {
    fields: [exchanges.providerId],
    references: [members.id],
    relationName: 'provider',
  }),
  requester: one(members, {
    fields: [exchanges.requesterId],
    references: [members.id],
    relationName: 'requester',
  }),
  booking: one(bookings, {
    fields: [exchanges.id],
    references: [bookings.exchangeId],
  }),
  review: one(reviews, {
    fields: [exchanges.id],
    references: [reviews.exchangeId],
  }),
  walletTransactions: many(walletTransactions),
}))
