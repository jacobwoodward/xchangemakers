// ---------------------------------------------------------------------------
// Exchange Engine Client
// ---------------------------------------------------------------------------
// Prototype implementation: reads/writes directly to local Postgres via
// Drizzle ORM. When the Exchange Engine microservice is built, swap the
// method bodies for fetch() calls — the public API surface stays identical.
// ---------------------------------------------------------------------------

import { db } from '@/db'
import {
  members,
  wallets,
  walletTransactions,
  listings,
  exchanges,
  bookings,
  availabilitySlots,
  reviews,
  reputationTags,
  happenings,
  happeningRsvps,
  activityFeed,
  treasury,
  onboardingProgress,
  conversations,
  conversationParticipants,
  messages,
} from '@/db/schema'
import { eq, ilike, and, or, desc, sql, asc } from 'drizzle-orm'

import type {
  Member,
  MemberWithDetails,
  Wallet,
  WalletTransaction,
  Listing,
  Exchange,
  Booking,
  AvailabilitySlot,
  Review,
  ReputationTagCount,
  ReputationTagType,
  Happening,
  HappeningCategory,
  RsvpStatus,
  ActivityFeedItem,
  TreasuryInfo,
  OnboardingProgress,
  OnboardingStep,
  MembershipTierInfo,
  Conversation,
  Message,
  SearchFilters,
  SearchResult,
  CreateExchangeInput,
  CreateBookingInput,
  CreateReviewInput,
  SendMessageInput,
} from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a Drizzle member row to the application Member type. */
function toMember(row: typeof members.$inferSelect): Member {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    avatarUrl: row.avatarUrl ?? null,
    bio: row.bio ?? null,
    vibe: row.vibe ?? null,
    neighborhood: row.neighborhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    isAvailable: row.isAvailable,
    availabilityNote: row.availabilityNote ?? null,
    membershipType: row.membershipType,
    joinedAt: row.joinedAt.toISOString(),
  }
}

/** Map a Drizzle wallet row to the application Wallet type. */
function toWallet(row: typeof wallets.$inferSelect): Wallet {
  return {
    id: row.id,
    memberId: row.memberId,
    balance: row.balance,
    totalEarned: row.totalEarned,
    monthlyEarned: row.monthlyEarned,
    escrowHeld: row.escrowHeld,
  }
}

/** Map a Drizzle wallet transaction row to the application type. */
function toWalletTransaction(
  row: typeof walletTransactions.$inferSelect,
): WalletTransaction {
  return {
    id: row.id,
    walletId: row.walletId,
    type: row.type,
    amount: row.amount,
    description: row.description,
    exchangeId: row.exchangeId ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Map a Drizzle listing row to the application Listing type. */
function toListing(
  row: typeof listings.$inferSelect,
  member?: Member,
): Listing {
  return {
    id: row.id,
    memberId: row.memberId,
    type: row.type,
    title: row.title,
    description: row.description,
    category: row.category,
    creditPrice: row.creditPrice,
    availabilityType: row.availabilityType,
    imageUrls: row.imageUrls ?? [],
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    ...(member ? { member } : {}),
  }
}

/** Map a Drizzle exchange row to the application Exchange type. */
function toExchange(
  row: typeof exchanges.$inferSelect,
  listing?: Listing,
  provider?: Member,
  requester?: Member,
): Exchange {
  return {
    id: row.id,
    listingId: row.listingId,
    providerId: row.providerId,
    requesterId: row.requesterId,
    status: row.status,
    euAmount: row.euAmount,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    ...(listing ? { listing } : {}),
    ...(provider ? { provider } : {}),
    ...(requester ? { requester } : {}),
  }
}

/** Map a Drizzle happening row to the application Happening type. */
function toHappening(
  row: typeof happenings.$inferSelect,
  goingCount: number,
  interestedCount: number,
  host?: Member,
): Happening {
  return {
    id: row.id,
    hostId: row.hostId,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    imageUrl: row.imageUrl ?? null,
    goingCount,
    interestedCount,
    ...(host ? { host } : {}),
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ExchangeEngineClient {
  private currentMemberId: string = ''

  /**
   * Initialise the client by loading the first member in the database.
   * In the prototype the "current user" is always the seed protagonist.
   */
  async initialize(): Promise<void> {
    const [first] = await db
      .select()
      .from(members)
      .orderBy(asc(members.joinedAt))
      .limit(1)

    if (!first) {
      throw new Error('No members found — has the database been seeded?')
    }
    this.currentMemberId = first.id
  }

  // ---- Members ------------------------------------------------------------

  async getMembers(): Promise<Member[]> {
    const rows = await db.select().from(members).orderBy(asc(members.firstName))
    return rows.map(toMember)
  }

  async getMember(id: string): Promise<MemberWithDetails> {
    const [row] = await db.select().from(members).where(eq(members.id, id))
    if (!row) throw new Error(`Member ${id} not found`)

    return this.hydrateMember(row)
  }

  async getCurrentMember(): Promise<MemberWithDetails> {
    if (!this.currentMemberId) await this.initialize()
    return this.getMember(this.currentMemberId)
  }

  // ---- Wallet -------------------------------------------------------------

  async getWallet(memberId: string): Promise<Wallet> {
    const [row] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.memberId, memberId))

    if (!row) throw new Error(`Wallet not found for member ${memberId}`)
    return toWallet(row)
  }

  async getTransactions(memberId: string): Promise<WalletTransaction[]> {
    const wallet = await this.getWallet(memberId)
    const rows = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(desc(walletTransactions.createdAt))

    return rows.map(toWalletTransaction)
  }

  // ---- Listings -----------------------------------------------------------

  async getListings(filters?: SearchFilters): Promise<Listing[]> {
    const conditions = [eq(listings.isActive, true)]

    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category))
    }
    if (filters?.type) {
      conditions.push(eq(listings.type, filters.type))
    }
    if (filters?.query) {
      conditions.push(
        or(
          ilike(listings.title, `%${filters.query}%`),
          ilike(listings.description, `%${filters.query}%`),
        )!,
      )
    }

    const rows = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))

    // Batch-load members for the results
    const memberIds = [...new Set(rows.map((r) => r.memberId))]
    const memberRows =
      memberIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(
              or(...memberIds.map((mid) => eq(members.id, mid)))!,
            )
        : []
    const memberMap = new Map(memberRows.map((m) => [m.id, toMember(m)]))

    return rows.map((r) => toListing(r, memberMap.get(r.memberId)))
  }

  async getListing(id: string): Promise<Listing> {
    const [row] = await db.select().from(listings).where(eq(listings.id, id))
    if (!row) throw new Error(`Listing ${id} not found`)

    const [memberRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, row.memberId))

    return toListing(row, memberRow ? toMember(memberRow) : undefined)
  }

  // ---- Search (person-first) ----------------------------------------------

  /**
   * Search listings by query text, then return the *members* who own those
   * listings. Business members go in `shopLocal`, everyone else in `neighbors`.
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const conditions = [eq(listings.isActive, true)]

    if (query) {
      conditions.push(
        or(
          ilike(listings.title, `%${query}%`),
          ilike(listings.description, `%${query}%`),
        )!,
      )
    }
    if (filters?.category) {
      conditions.push(eq(listings.category, filters.category))
    }
    if (filters?.type) {
      conditions.push(eq(listings.type, filters.type))
    }

    const matchingListings = await db
      .select()
      .from(listings)
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt))

    // Group listings by member
    const memberIdSet = new Set(matchingListings.map((l) => l.memberId))
    if (memberIdSet.size === 0) {
      return { shopLocal: [], neighbors: [] }
    }

    const memberIds = [...memberIdSet]
    const memberRows = await db
      .select()
      .from(members)
      .where(or(...memberIds.map((mid) => eq(members.id, mid)))!)

    // Hydrate each member
    const hydrated = await Promise.all(
      memberRows.map((row) => this.hydrateMember(row)),
    )

    const shopLocal: MemberWithDetails[] = []
    const neighbors: MemberWithDetails[] = []

    for (const m of hydrated) {
      if (m.membershipType === 'business') {
        shopLocal.push(m)
      } else {
        neighbors.push(m)
      }
    }

    return { shopLocal, neighbors }
  }

  // ---- Exchanges ----------------------------------------------------------

  async getExchanges(memberId: string): Promise<Exchange[]> {
    const rows = await db
      .select()
      .from(exchanges)
      .where(
        or(
          eq(exchanges.providerId, memberId),
          eq(exchanges.requesterId, memberId),
        ),
      )
      .orderBy(desc(exchanges.createdAt))

    // Batch-load listings, providers, and requesters
    const listingIds = [...new Set(rows.map((r) => r.listingId))]
    const providerIds = [...new Set(rows.map((r) => r.providerId))]
    const requesterIds = [...new Set(rows.map((r) => r.requesterId))]
    const allMemberIds = [...new Set([...providerIds, ...requesterIds])]

    const [listingRows, memberRows] = await Promise.all([
      listingIds.length > 0
        ? db
            .select()
            .from(listings)
            .where(or(...listingIds.map((lid) => eq(listings.id, lid)))!)
        : Promise.resolve([]),
      allMemberIds.length > 0
        ? db
            .select()
            .from(members)
            .where(or(...allMemberIds.map((mid) => eq(members.id, mid)))!)
        : Promise.resolve([]),
    ])

    const listingMap = new Map(
      listingRows.map((l) => [l.id, toListing(l)]),
    )
    const memberMap = new Map(memberRows.map((m) => [m.id, toMember(m)]))

    return rows.map((r) =>
      toExchange(
        r,
        listingMap.get(r.listingId),
        memberMap.get(r.providerId),
        memberMap.get(r.requesterId),
      ),
    )
  }

  /**
   * Create a new exchange request. Places the EU amount in escrow by
   * debiting the requester's wallet and recording an escrow_hold transaction.
   */
  async createExchange(input: CreateExchangeInput): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    // When a scheduledAt is provided (booking flow), go straight to in_escrow
    const initialStatus = input.scheduledAt ? 'in_escrow' : 'requested'

    return await db.transaction(async (tx) => {
      // Create the exchange row
      const [exchangeRow] = await tx
        .insert(exchanges)
        .values({
          listingId: input.listingId,
          providerId: input.providerId,
          requesterId: this.currentMemberId,
          status: initialStatus,
          euAmount: input.euAmount,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        })
        .returning()

      // Escrow: debit requester wallet, record transaction
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, this.currentMemberId))

      if (!wallet) throw new Error(`Wallet not found for member ${this.currentMemberId}`)

      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${input.euAmount}`,
          escrowHeld: sql`${wallets.escrowHeld} + ${input.euAmount}`,
        })
        .where(eq(wallets.id, wallet.id))

      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type: 'escrow_hold',
        amount: input.euAmount,
        description: `Escrow hold for exchange`,
        exchangeId: exchangeRow.id,
      })

      return toExchange(exchangeRow)
    })
  }

  async acceptExchange(id: string): Promise<Exchange> {
    const [row] = await db
      .update(exchanges)
      .set({ status: 'accepted' })
      .where(eq(exchanges.id, id))
      .returning()

    if (!row) throw new Error(`Exchange ${id} not found`)
    return toExchange(row)
  }

  /**
   * Complete an exchange. Releases escrow funds to the provider's wallet
   * and marks the exchange as completed.
   */
  async completeExchange(id: string): Promise<Exchange> {
    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)

    // Idempotent: if already completed, return as-is
    if (exchangeRow.status === 'completed') return toExchange(exchangeRow)

    // Only allow completion from valid pre-completion states
    if (exchangeRow.status === 'cancelled' || exchangeRow.status === 'disputed') {
      throw new Error(
        `Cannot complete exchange ${id} — current status is '${exchangeRow.status}'`,
      )
    }

    return await db.transaction(async (tx) => {
      // Update exchange status
      const [updated] = await tx
        .update(exchanges)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(exchanges.id, id))
        .returning()

      // Release escrow: credit provider, clear requester escrow
      const [providerWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, exchangeRow.providerId))
      const [requesterWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, exchangeRow.requesterId))

      if (!providerWallet) throw new Error(`Wallet not found for provider ${exchangeRow.providerId}`)
      if (!requesterWallet) throw new Error(`Wallet not found for requester ${exchangeRow.requesterId}`)

      await Promise.all([
        // Credit provider
        tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${exchangeRow.euAmount}`,
            totalEarned: sql`${wallets.totalEarned} + ${exchangeRow.euAmount}`,
            monthlyEarned: sql`${wallets.monthlyEarned} + ${exchangeRow.euAmount}`,
          })
          .where(eq(wallets.id, providerWallet.id)),
        // Clear requester escrow
        tx
          .update(wallets)
          .set({
            escrowHeld: sql`${wallets.escrowHeld} - ${exchangeRow.euAmount}`,
          })
          .where(eq(wallets.id, requesterWallet.id)),
        // Provider transaction
        tx.insert(walletTransactions).values({
          walletId: providerWallet.id,
          type: 'escrow_release',
          amount: exchangeRow.euAmount,
          description: `Payment received for exchange`,
          exchangeId: id,
        }),
        // Requester transaction
        tx.insert(walletTransactions).values({
          walletId: requesterWallet.id,
          type: 'spent',
          amount: exchangeRow.euAmount,
          description: `Payment for completed exchange`,
          exchangeId: id,
        }),
      ])

      return toExchange(updated)
    })
  }

  // ---- Bookings -----------------------------------------------------------

  async getAvailability(memberId: string): Promise<AvailabilitySlot[]> {
    const rows = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.memberId, memberId))
      .orderBy(asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime))

    return rows.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      isRecurring: r.isRecurring,
    }))
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    if (!this.currentMemberId) await this.initialize()

    const [row] = await db
      .insert(bookings)
      .values({
        exchangeId: input.exchangeId,
        providerId: input.providerId,
        requesterId: this.currentMemberId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'confirmed',
      })
      .returning()

    return {
      id: row.id,
      exchangeId: row.exchangeId,
      providerId: row.providerId,
      requesterId: row.requesterId,
      date: row.date.toISOString(),
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }
  }

  // ---- Reviews ------------------------------------------------------------

  async createReview(input: CreateReviewInput): Promise<Review> {
    if (!this.currentMemberId) await this.initialize()

    const [reviewRow] = await db
      .insert(reviews)
      .values({
        exchangeId: input.exchangeId,
        reviewerId: this.currentMemberId,
        revieweeId: input.revieweeId,
        note: input.note ?? null,
      })
      .returning()

    // Insert individual reputation tags
    if (input.tags.length > 0) {
      await db.insert(reputationTags).values(
        input.tags.map((tag) => ({
          reviewId: reviewRow.id,
          reviewerId: this.currentMemberId,
          revieweeId: input.revieweeId,
          tag,
        })),
      )
    }

    return {
      id: reviewRow.id,
      exchangeId: reviewRow.exchangeId,
      reviewerId: reviewRow.reviewerId,
      revieweeId: reviewRow.revieweeId,
      note: reviewRow.note ?? null,
      tags: input.tags,
      createdAt: reviewRow.createdAt.toISOString(),
    }
  }

  // ---- Happenings ---------------------------------------------------------

  async getHappenings(category?: HappeningCategory): Promise<Happening[]> {
    const conditions = category ? [eq(happenings.category, category)] : []

    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(happenings)
            .where(and(...conditions))
            .orderBy(asc(happenings.startAt))
        : await db.select().from(happenings).orderBy(asc(happenings.startAt))

    // Batch-load RSVP counts and hosts
    const happeningIds = rows.map((r) => r.id)
    const hostIds = [...new Set(rows.map((r) => r.hostId))]

    const [rsvpRows, hostRows] = await Promise.all([
      happeningIds.length > 0
        ? db
            .select()
            .from(happeningRsvps)
            .where(
              or(
                ...happeningIds.map((hid) =>
                  eq(happeningRsvps.happeningId, hid),
                ),
              )!,
            )
        : Promise.resolve([]),
      hostIds.length > 0
        ? db
            .select()
            .from(members)
            .where(or(...hostIds.map((hid) => eq(members.id, hid)))!)
        : Promise.resolve([]),
    ])

    // Aggregate RSVP counts per happening
    const rsvpCounts = new Map<
      string,
      { going: number; interested: number }
    >()
    for (const rsvp of rsvpRows) {
      const existing = rsvpCounts.get(rsvp.happeningId) ?? {
        going: 0,
        interested: 0,
      }
      if (rsvp.status === 'going') existing.going++
      else existing.interested++
      rsvpCounts.set(rsvp.happeningId, existing)
    }

    const hostMap = new Map(hostRows.map((h) => [h.id, toMember(h)]))

    return rows.map((r) => {
      const counts = rsvpCounts.get(r.id) ?? { going: 0, interested: 0 }
      return toHappening(r, counts.going, counts.interested, hostMap.get(r.hostId))
    })
  }

  async getHappening(id: string): Promise<Happening> {
    const [row] = await db
      .select()
      .from(happenings)
      .where(eq(happenings.id, id))

    if (!row) throw new Error(`Happening ${id} not found`)

    const [hostRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, row.hostId))

    const rsvpRows = await db
      .select()
      .from(happeningRsvps)
      .where(eq(happeningRsvps.happeningId, id))

    let going = 0
    let interested = 0
    for (const rsvp of rsvpRows) {
      if (rsvp.status === 'going') going++
      else interested++
    }

    return toHappening(row, going, interested, hostRow ? toMember(hostRow) : undefined)
  }

  async rsvpHappening(happeningId: string, status: RsvpStatus): Promise<void> {
    if (!this.currentMemberId) await this.initialize()

    // Upsert: delete existing RSVP then insert new one
    await db
      .delete(happeningRsvps)
      .where(
        and(
          eq(happeningRsvps.happeningId, happeningId),
          eq(happeningRsvps.memberId, this.currentMemberId),
        ),
      )

    await db.insert(happeningRsvps).values({
      happeningId,
      memberId: this.currentMemberId,
      status,
    })
  }

  // ---- Activity Feed ------------------------------------------------------

  async getActivityFeed(): Promise<{
    items: ActivityFeedItem[]
    hasMore: boolean
  }> {
    const limit = 20
    const rows = await db
      .select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map((r) => ({
      id: r.id,
      type: r.type,
      data: (r.data ?? {}) as Record<string, unknown>,
      createdAt: r.createdAt.toISOString(),
    }))

    return { items, hasMore }
  }

  // ---- Treasury -----------------------------------------------------------

  async getTreasury(): Promise<TreasuryInfo> {
    const [row] = await db.select().from(treasury).limit(1)
    if (!row) throw new Error('Treasury not found — has the database been seeded?')

    return {
      id: row.id,
      communityName: row.communityName,
      balance: Number(row.balance),
      tier: row.tier,
      exchangesThisWeek: row.exchangesThisWeek,
      totalExchanges: row.totalExchanges,
      totalMembers: row.totalMembers,
    }
  }

  // ---- Onboarding ---------------------------------------------------------

  async getOnboardingTrail(memberId: string): Promise<OnboardingProgress[]> {
    const rows = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.memberId, memberId))
      .orderBy(asc(onboardingProgress.createdAt))

    return rows.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      step: r.step,
      completed: r.completed,
      euEarned: r.euEarned,
      completedAt: r.completedAt?.toISOString() ?? null,
    }))
  }

  async completeOnboardingStep(
    memberId: string,
    step: OnboardingStep,
  ): Promise<void> {
    // EU rewards per onboarding step
    const ONBOARDING_EU_REWARDS: Record<OnboardingStep, number> = {
      profile_photo: 5,
      intro_vibe: 5,
      add_offerings: 5,
      post_need: 5,
      rsvp_happening: 5,
      first_exchange: 15,
      first_review: 5,
      invite_neighbor: 10,
    }

    const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
      profile_photo: 'Add a photo',
      intro_vibe: 'Set your vibe',
      add_offerings: 'Add offerings',
      post_need: 'Post a need',
      rsvp_happening: 'RSVP to a happening',
      first_exchange: 'Complete first exchange',
      first_review: 'Leave first review',
      invite_neighbor: 'Invite a neighbor',
    }

    const euReward = ONBOARDING_EU_REWARDS[step]

    // Mark the step complete and record EU earned
    await db
      .update(onboardingProgress)
      .set({ completed: true, completedAt: new Date(), euEarned: euReward })
      .where(
        and(
          eq(onboardingProgress.memberId, memberId),
          eq(onboardingProgress.step, step),
        ),
      )

    // Credit the member's wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.memberId, memberId))

    if (!wallet) return // No wallet yet — skip crediting

    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${euReward}`,
        totalEarned: sql`${wallets.totalEarned} + ${euReward}`,
        monthlyEarned: sql`${wallets.monthlyEarned} + ${euReward}`,
      })
      .where(eq(wallets.id, wallet.id))

    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: 'earned',
      amount: euReward,
      description: `Onboarding: ${ONBOARDING_STEP_LABELS[step]}`,
    })
  }

  // ---- Messages -----------------------------------------------------------

  async getConversations(memberId: string): Promise<Conversation[]> {
    // Get conversations this member participates in
    const participantRows = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.memberId, memberId))

    const conversationIds = participantRows.map((p) => p.conversationId)
    if (conversationIds.length === 0) return []

    // Load all conversations
    const conversationRows = await db
      .select()
      .from(conversations)
      .where(
        or(
          ...conversationIds.map((cid) => eq(conversations.id, cid)),
        )!,
      )
      .orderBy(desc(conversations.updatedAt))

    // Load all participants for these conversations
    const allParticipants = await db
      .select()
      .from(conversationParticipants)
      .where(
        or(
          ...conversationIds.map((cid) =>
            eq(conversationParticipants.conversationId, cid),
          ),
        )!,
      )

    // Load participant member data
    const participantMemberIds = [
      ...new Set(allParticipants.map((p) => p.memberId)),
    ]
    const memberRows =
      participantMemberIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(
              or(
                ...participantMemberIds.map((mid) => eq(members.id, mid)),
              )!,
            )
        : []
    const memberMap = new Map(memberRows.map((m) => [m.id, toMember(m)]))

    // Load last message for each conversation
    const lastMessages = await Promise.all(
      conversationIds.map(async (cid) => {
        const [msg] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, cid))
          .orderBy(desc(messages.createdAt))
          .limit(1)
        return { conversationId: cid, message: msg }
      }),
    )
    const lastMessageMap = new Map(
      lastMessages
        .filter((lm) => lm.message)
        .map((lm) => [lm.conversationId, lm.message!]),
    )

    return conversationRows.map((c) => {
      const cParticipants = allParticipants
        .filter((p) => p.conversationId === c.id)
        .map((p) => ({
          memberId: p.memberId,
          member: memberMap.get(p.memberId),
          lastReadAt: p.lastReadAt?.toISOString() ?? null,
        }))

      const lastMsg = lastMessageMap.get(c.id)

      return {
        id: c.id,
        participants: cParticipants,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderId: lastMsg.senderId,
              content: lastMsg.content,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : undefined,
        updatedAt: c.updatedAt.toISOString(),
      }
    })
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))

    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      senderId: r.senderId,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }))
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    if (!this.currentMemberId) await this.initialize()

    const [row] = await db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        senderId: this.currentMemberId,
        content: input.content,
      })
      .returning()

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, input.conversationId))

    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
    }
  }

  // ---- Membership tiers (static) ------------------------------------------

  getMembershipTiers(): MembershipTierInfo[] {
    return [
      {
        type: 'standard',
        name: 'Standard',
        annualCost: 120,
        treasuryContribution: 60,
        hoursRequired: null,
        features: [
          'Create listings (offerings & needs)',
          'Exchange with neighbors',
          'RSVP to happenings',
          'Direct messaging',
          'Reputation tags',
          '$60/year funds the community treasury',
        ],
      },
      {
        type: 'business',
        name: 'Shop Local Business',
        annualCost: 240,
        treasuryContribution: 120,
        hoursRequired: null,
        features: [
          'Everything in Standard',
          'Featured in Shop Local search',
          'Business badge on profile',
          'Priority listing placement',
          'Monthly analytics dashboard',
          '$120/year funds the community treasury',
        ],
      },
      {
        type: 'community_contribution',
        name: 'Community Contribution',
        annualCost: 0,
        treasuryContribution: 20,
        hoursRequired: 10,
        features: [
          'Everything in Standard',
          'Community contributor badge',
          'Free membership via 10 verified hours/year',
          'Platform funds $20 treasury deposit',
          'Treasury voting rights',
        ],
      },
    ]
  }

  // ---- Private helpers ----------------------------------------------------

  /**
   * Hydrate a raw member row into a full MemberWithDetails — loads listings,
   * reputation tags, wallet, and computes trust score.
   */
  private async hydrateMember(
    row: typeof members.$inferSelect,
  ): Promise<MemberWithDetails> {
    const member = toMember(row)

    // Load listings, wallet, exchanges, and reputation tags in parallel
    const [listingRows, walletRow, exchangeRows, tagRows] = await Promise.all([
      db
        .select()
        .from(listings)
        .where(and(eq(listings.memberId, row.id), eq(listings.isActive, true))),
      db.select().from(wallets).where(eq(wallets.memberId, row.id)),
      db
        .select()
        .from(exchanges)
        .where(
          and(
            or(
              eq(exchanges.providerId, row.id),
              eq(exchanges.requesterId, row.id),
            ),
            eq(exchanges.status, 'completed'),
          ),
        ),
      db
        .select()
        .from(reputationTags)
        .where(eq(reputationTags.revieweeId, row.id)),
    ])

    const offerings = listingRows
      .filter((l) => l.type === 'offering')
      .map((l) => toListing(l))
    const needs = listingRows
      .filter((l) => l.type === 'need')
      .map((l) => toListing(l))

    const wallet: Wallet = walletRow[0]
      ? toWallet(walletRow[0])
      : { id: '', memberId: row.id, balance: 0, totalEarned: 0, monthlyEarned: 0, escrowHeld: 0 }

    // Aggregate reputation tags
    const tagCounts = new Map<ReputationTagType, number>()
    for (const t of tagRows) {
      tagCounts.set(t.tag, (tagCounts.get(t.tag) ?? 0) + 1)
    }
    const reputationTagCounts: ReputationTagCount[] = [...tagCounts.entries()].map(
      ([tag, count]) => ({ tag, count }),
    )

    // Trust score: (completed exchanges * 10) + (total reputation tags * 5), capped at 100
    const completedExchanges = exchangeRows.length
    const totalTags = tagRows.length
    const trustScore = Math.min(completedExchanges * 10 + totalTags * 5, 100)

    return {
      ...member,
      offerings,
      needs,
      reputationTags: reputationTagCounts,
      wallet,
      trustScore,
    }
  }
}

/** Singleton instance — import this in components and stores. */
export const exchangeEngine = new ExchangeEngineClient()
