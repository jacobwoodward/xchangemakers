// ---------------------------------------------------------------------------
// Exchange Engine Client
// ---------------------------------------------------------------------------
// Prototype implementation: reads/writes directly to local Postgres via
// Drizzle ORM. When the Exchange Engine microservice is built, swap the
// method bodies for fetch() calls — the public API surface stays identical.
// ---------------------------------------------------------------------------

import { db } from '@/db'
import {
  communities,
  communityInvites,
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
  stewardFlags,
  helperPreferences,
  needOffers,
  needWindows,
  businessProfiles,
  notifications,
  analyticsEvents,
  memberIntentProfiles,
} from '@/db/schema'
import { eq, ilike, and, or, desc, sql, asc, gte, lte, ne, gt, inArray, isNull } from 'drizzle-orm'
import { requireCurrentMemberId } from '@/lib/auth/session'
import { formatHappeningCategory } from '@/lib/happenings'

import type {
  Member,
  MemberStatus,
  Community,
  CommunityInvite,
  MemberWithDetails,
  Wallet,
  WalletTransaction,
  Listing,
  ListingCategory,
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
  Notification,
  NotificationFilters,
  AnalyticsEvent,
  AnalyticsEventType,
  CancellationInput,
  CancellationReason,
  TreasuryInfo,
  OnboardingProgress,
  OnboardingStep,
  MembershipTierInfo,
  Conversation,
  Message,
  ExchangeRoom,
  StewardDashboard,
  StewardFlag,
  StewardFlagTarget,
  BusinessCategory,
  BusinessProfile,
  SearchFilters,
  SearchResult,
  LocalBusiness,
  LocalBusinessFilters,
  MarketplaceListingFilters,
  SuggestedListingMatch,
  CreateAvailabilitySlotInput,
  CreateExchangeInput,
  CreateBookingInput,
  CreateHappeningInput,
  ScheduleExchangeInput,
  CreateReviewInput,
  CreateListingInput,
  CreateNeedWindowInput,
  SendMessageInput,
  HelperPreferences,
  MemberIntentProfile,
  HappeningFilters,
  NeedOffer,
  NeedWindow,
  OfferNeedHelpInput,
  TimedNeed,
  TimedNeedFilters,
  TrackAnalyticsEventInput,
  UpdateHelperPreferencesInput,
  UpdateMemberIntentProfileInput,
} from './types'

import {
  ONBOARDING_TU_REWARDS,
  ONBOARDING_STEP_LABELS,
} from './constants'

const LISTING_LIFETIME_DAYS = 45
const LISTING_CATEGORY_VALUES = new Set([
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
const HELPER_DIGEST_FREQUENCY_VALUES = new Set([
  'immediate',
  'daily',
  'weekly',
  'off',
])
const NON_URGENT_MATCH_NOTIFICATION_CAP_PER_DAY = 3
const DAY_IN_MS = 24 * 60 * 60 * 1000
const WEEK_IN_MS = 7 * DAY_IN_MS
const CANCELLATION_REASON_VALUES = new Set<CancellationReason>([
  'schedule_conflict',
  'no_longer_needed',
  'helper_drop',
  'requester_cancel',
  'safety_concern',
  'other',
])
const HAPPENING_CATEGORY_VALUES = new Set([
  'kids',
  'food',
  'markets',
  'fitness',
  'classes',
  'social',
  'community',
  'exchange_event',
])
const LISTING_CATEGORY_TO_BUSINESS_CATEGORIES: Record<
  ListingCategory,
  BusinessCategory[]
> = {
  food: ['food_drink'],
  services: ['home_services', 'moving_help', 'professional'],
  skills: ['professional'],
  classes: ['professional', 'health_wellness'],
  handmade: ['shopping_makers'],
  wellness: ['health_wellness'],
  tech: ['professional', 'home_services'],
  home: ['home_services', 'garden_outdoors'],
  kids: ['professional', 'health_wellness'],
  other: ['other'],
}

function getListingExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000)
}

function normalizeCancellationInput(
  input: CancellationInput | undefined,
  fallbackReason: CancellationReason,
): { reason: CancellationReason; note: string | null } {
  const reason =
    input?.reason && CANCELLATION_REASON_VALUES.has(input.reason)
      ? input.reason
      : fallbackReason
  const note = input?.note?.trim().slice(0, 240) || null

  return { reason, note }
}

function cancellationMetadata(input: {
  reason: CancellationReason
  note: string | null
}): Record<string, unknown> {
  return input.note ? { reason: input.reason, note: input.note } : { reason: input.reason }
}

function normalizeQuietHour(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed)
  if (!match) return null

  return `${match[1]}:${match[2]}`
}

function minutesFromClock(value: string | null): number | null {
  if (!value) return null
  const [hour, minute] = value.split(':').map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

function isWithinQuietHours(
  now: Date,
  quietHoursStart: string | null,
  quietHoursEnd: string | null,
): boolean {
  const start = minutesFromClock(quietHoursStart)
  const end = minutesFromClock(quietHoursEnd)
  if (start === null || end === null || start === end) return false

  const current = now.getHours() * 60 + now.getMinutes()
  if (start < end) return current >= start && current < end
  return current >= start || current < end
}

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
    communityId: row.communityId ?? null,
    neighborhood: row.neighborhood,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    isAvailable: row.isAvailable,
    availabilityNote: row.availabilityNote ?? null,
    membershipType: row.membershipType,
    status: row.status,
    isSteward: row.isSteward,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    joinedAt: row.joinedAt.toISOString(),
  }
}

function toCommunity(row: typeof communities.$inferSelect): Community {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    region: row.region,
    postalCode: row.postalCode ?? null,
    status: row.status,
    inviteOnly: row.inviteOnly,
  }
}

function toCommunityInvite(row: typeof communityInvites.$inferSelect): CommunityInvite {
  return {
    id: row.id,
    communityId: row.communityId,
    code: row.code,
    label: row.label,
    maxUses: row.maxUses ?? null,
    usageCount: row.usageCount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    operationKey: row.operationKey ?? null,
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
    needStatus: row.needStatus ?? null,
    publicLocationLabel: row.publicLocationLabel ?? null,
    exactLocation: row.exactLocation ?? null,
    isLocationPrivate: row.isLocationPrivate,
    isUrgent: row.isUrgent,
    recurringNote: row.recurringNote ?? null,
    imageUrls: row.imageUrls ?? [],
    isActive: row.isActive,
    refreshedAt: row.refreshedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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
    tuAmount: row.tuAmount,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    ...(listing ? { listing } : {}),
    ...(provider ? { provider } : {}),
    ...(requester ? { requester } : {}),
  }
}

function toBooking(row: typeof bookings.$inferSelect): Booking {
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

function toAvailabilitySlot(
  row: typeof availabilitySlots.$inferSelect,
): AvailabilitySlot {
  return {
    id: row.id,
    memberId: row.memberId,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    isRecurring: row.isRecurring,
  }
}

function toNeedWindow(row: typeof needWindows.$inferSelect): NeedWindow {
  return {
    id: row.id,
    needId: row.needId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    label: row.label ?? null,
    isFlexible: row.isFlexible,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function buildNeedWindowValues(
  needId: string,
  windows: CreateNeedWindowInput[],
): (typeof needWindows.$inferInsert)[] {
  return windows.map((window) => {
    const startsAt = new Date(window.startsAt)
    const endsAt = new Date(window.endsAt)

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new Error('Need windows must include valid dates')
    }
    if (endsAt <= startsAt) {
      throw new Error('Need window end time must be after start time')
    }

    return {
      needId,
      startsAt,
      endsAt,
      label: window.label ?? null,
      isFlexible: window.isFlexible ?? false,
    }
  })
}

function toNeedOffer(
  row: typeof needOffers.$inferSelect,
  helper?: Member,
): NeedOffer {
  return {
    id: row.id,
    needId: row.needId,
    windowId: row.windowId,
    helperId: row.helperId,
    message: row.message ?? null,
    status: row.status,
    exchangeId: row.exchangeId ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(helper ? { helper } : {}),
  }
}

function toHelperPreferences(
  row: typeof helperPreferences.$inferSelect,
): HelperPreferences {
  return {
    id: row.id,
    memberId: row.memberId,
    categories: row.categories as HelperPreferences['categories'],
    radiusMiles: row.radiusMiles,
    urgentOnly: row.urgentOnly,
    digestFrequency: row.digestFrequency,
    quietHoursStart: row.quietHoursStart ?? null,
    quietHoursEnd: row.quietHoursEnd ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toMemberIntentProfile(
  row: typeof memberIntentProfiles.$inferSelect,
): MemberIntentProfile {
  return {
    id: row.id,
    memberId: row.memberId,
    canHelpCategories: row.canHelpCategories as MemberIntentProfile['canHelpCategories'],
    needsHelpCategories: row.needsHelpCategories as MemberIntentProfile['needsHelpCategories'],
    happeningInterests: row.happeningInterests as MemberIntentProfile['happeningInterests'],
    radiusMiles: row.radiusMiles,
    notificationFrequency:
      row.notificationFrequency as MemberIntentProfile['notificationFrequency'],
    shareAvailability: row.shareAvailability,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toBusinessProfile(
  row: typeof businessProfiles.$inferSelect,
): BusinessProfile {
  return {
    id: row.id,
    memberId: row.memberId,
    businessName: row.businessName,
    categories: row.categories as BusinessCategory[],
    address: row.address,
    serviceArea: row.serviceArea ?? null,
    phone: row.phone ?? null,
    websiteUrl: row.websiteUrl ?? null,
    directionsUrl: row.directionsUrl ?? null,
    hours: row.hours as Record<string, string>,
    photoUrls: row.photoUrls as string[],
    contributionNotes: row.contributionNotes ?? null,
    contributionBadges: row.contributionBadges as string[],
    communityHoursContributed: row.communityHoursContributed,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    isCommunityFavorite: row.isCommunityFavorite,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    memberId: row.memberId,
    type: row.type,
    priority: row.priority,
    title: row.title,
    body: row.body,
    targetPath: row.targetPath,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}

function toAnalyticsEvent(row: typeof analyticsEvents.$inferSelect): AnalyticsEvent {
  return {
    id: row.id,
    memberId: row.memberId ?? null,
    eventType: row.eventType as AnalyticsEventType,
    targetType: row.targetType ?? null,
    targetId: row.targetId ?? null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }
}

function toReview(
  row: typeof reviews.$inferSelect,
  tags: ReputationTagType[] = [],
): Review {
  return {
    id: row.id,
    exchangeId: row.exchangeId,
    reviewerId: row.reviewerId,
    revieweeId: row.revieweeId,
    note: row.note ?? null,
    tags,
    createdAt: row.createdAt.toISOString(),
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

function toStewardFlag(
  row: typeof stewardFlags.$inferSelect,
  targetLabel: string,
  targetHref: string | null,
  createdBy?: Member,
): StewardFlag {
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    targetLabel,
    targetHref,
    reason: row.reason,
    status: row.status,
    createdById: row.createdById ?? null,
    ...(createdBy ? { createdBy } : {}),
    resolvedById: row.resolvedById ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function getDistanceMiles(from: Member, to: Member): number {
  const earthRadiusMiles = 3958.8
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLon = toRadians(to.longitude - from.longitude)
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTimeOfDay(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function getTimedNeedRange(
  timeframe: TimedNeedFilters['timeframe'] = 'week',
): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  if (timeframe === 'today') {
    end.setDate(end.getDate() + 1)
  } else if (timeframe === 'month') {
    end.setDate(end.getDate() + 31)
  } else {
    end.setDate(end.getDate() + 7)
  }

  return { start, end }
}

function normalizeHappeningFilters(
  filters?: HappeningCategory | HappeningFilters,
): HappeningFilters {
  return typeof filters === 'string' ? { category: filters } : (filters ?? {})
}

function getHappeningRange(filters: HappeningFilters = {}): {
  start: Date
  end: Date
} {
  if (filters.day && /^\d{4}-\d{2}-\d{2}$/.test(filters.day)) {
    const dayStart = new Date(`${filters.day}T00:00:00`)
    if (!Number.isNaN(dayStart.getTime())) {
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      return { start: dayStart, end: dayEnd }
    }
  }

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + (filters.timeframe === 'month' ? 31 : 7))

  return { start, end }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ExchangeEngineClient {
  private currentMemberId: string = ''

  /** Initialise the client for the signed-in member. */
  async initialize(memberId?: string): Promise<void> {
    this.currentMemberId = memberId ?? await requireCurrentMemberId()
  }

  // ---- Members ------------------------------------------------------------

  async getMembers(): Promise<Member[]> {
    const rows = await db.select().from(members).orderBy(asc(members.firstName))
    return rows.map(toMember)
  }

  async getMember(id: string): Promise<MemberWithDetails> {
    const [row] = await db.select().from(members).where(eq(members.id, id))
    if (!row) throw new Error(`Member ${id} not found`)

    return this.hydrateMember(row, id === this.currentMemberId)
  }

  async getCurrentMember(): Promise<MemberWithDetails> {
    if (!this.currentMemberId) await this.initialize()
    const [row] = await db
      .select()
      .from(members)
      .where(eq(members.id, this.currentMemberId))
    if (!row) throw new Error(`Member ${this.currentMemberId} not found`)

    return this.hydrateMember(row, true)
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
    const conditions = [
      eq(listings.isActive, true),
      gt(listings.expiresAt, new Date()),
    ]

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

  async getMarketplaceListings(
    filters: MarketplaceListingFilters = {},
  ): Promise<Listing[]> {
    if (!this.currentMemberId) await this.initialize()

    const [currentMemberRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, this.currentMemberId))
      .limit(1)
    const currentMember = currentMemberRow ? toMember(currentMemberRow) : null

    const conditions = [
      eq(listings.isActive, true),
      gt(listings.expiresAt, new Date()),
    ]
    const distanceScope = filters.distance ?? 'community'

    if (filters.category) {
      conditions.push(eq(listings.category, filters.category))
    }
    if (filters.type) {
      conditions.push(eq(listings.type, filters.type))
    }
    if (filters.availabilityType) {
      conditions.push(eq(listings.availabilityType, filters.availabilityType))
    }
    if (filters.minCredits !== undefined) {
      conditions.push(gte(listings.creditPrice, filters.minCredits))
    }
    if (filters.maxCredits !== undefined) {
      conditions.push(lte(listings.creditPrice, filters.maxCredits))
    }
    if (filters.excludeCurrentMember) {
      conditions.push(ne(listings.memberId, this.currentMemberId))
    }
    if (filters.query) {
      conditions.push(
        or(
          ilike(listings.title, `%${filters.query}%`),
          ilike(listings.description, `%${filters.query}%`),
        )!,
      )
    }
    if (distanceScope === 'community' && currentMember?.communityId) {
      conditions.push(eq(members.communityId, currentMember.communityId))
    }

    const rows = await db
      .select({ listing: listings, member: members })
      .from(listings)
      .innerJoin(members, eq(listings.memberId, members.id))
      .where(and(...conditions))

    let trustedMemberIds: Set<string> | null = null
    if (filters.trustedOnly) {
      const trustedRows = await db
        .select({ memberId: reputationTags.revieweeId })
        .from(reputationTags)
      trustedMemberIds = new Set(trustedRows.map((r) => r.memberId))
    }

    let results = rows.map(({ listing, member }) =>
      toListing(listing, toMember(member)),
    )

    if (trustedMemberIds) {
      results = results.filter(
        (listing) =>
          listing.member && trustedMemberIds?.has(listing.member.id),
      )
    }

    if (distanceScope === 'nearby' && currentMember) {
      const radius = filters.radius ?? 5
      results = results.filter(
        (listing) =>
          listing.member && getDistanceMiles(currentMember, listing.member) <= radius,
      )
    }

    results.sort((a, b) => {
      if (filters.sort === 'credits_low') return a.creditPrice - b.creditPrice
      if (filters.sort === 'credits_high') return b.creditPrice - a.creditPrice
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filters.limit ? results.slice(0, filters.limit) : results
  }

  async getHelperPreferences(memberId?: string): Promise<HelperPreferences> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    const [existing] = await db
      .select()
      .from(helperPreferences)
      .where(eq(helperPreferences.memberId, resolvedMemberId))
      .limit(1)

    if (existing) return toHelperPreferences(existing)

    const [created] = await db
      .insert(helperPreferences)
      .values({ memberId: resolvedMemberId })
      .returning()

    return toHelperPreferences(created)
  }

  async updateHelperPreferences(
    input: UpdateHelperPreferencesInput,
    memberId?: string,
  ): Promise<HelperPreferences> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for helper preferences')

    const patch: Partial<typeof helperPreferences.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (input.categories) {
      patch.categories = Array.from(new Set(input.categories)).filter((category) =>
        LISTING_CATEGORY_VALUES.has(category),
      )
    }

    if (typeof input.radiusMiles === 'number' && Number.isFinite(input.radiusMiles)) {
      patch.radiusMiles = Math.min(25, Math.max(1, Math.round(input.radiusMiles)))
    }

    if (typeof input.urgentOnly === 'boolean') {
      patch.urgentOnly = input.urgentOnly
    }

    if (
      input.digestFrequency &&
      HELPER_DIGEST_FREQUENCY_VALUES.has(input.digestFrequency)
    ) {
      patch.digestFrequency = input.digestFrequency
    }

    const quietHoursStart = normalizeQuietHour(input.quietHoursStart)
    if (quietHoursStart !== undefined) {
      patch.quietHoursStart = quietHoursStart
    }

    const quietHoursEnd = normalizeQuietHour(input.quietHoursEnd)
    if (quietHoursEnd !== undefined) {
      patch.quietHoursEnd = quietHoursEnd
    }

    const [existing] = await db
      .select()
      .from(helperPreferences)
      .where(eq(helperPreferences.memberId, resolvedMemberId))
      .limit(1)

    if (existing) {
      const [updated] = await db
        .update(helperPreferences)
        .set(patch)
        .where(eq(helperPreferences.memberId, resolvedMemberId))
        .returning()
      return toHelperPreferences(updated)
    }

    const [created] = await db
      .insert(helperPreferences)
      .values({
        memberId: resolvedMemberId,
        ...patch,
      })
      .returning()

    return toHelperPreferences(created)
  }

  async getMemberIntentProfile(memberId?: string): Promise<MemberIntentProfile> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for intent profile')

    const [existing] = await db
      .select()
      .from(memberIntentProfiles)
      .where(eq(memberIntentProfiles.memberId, resolvedMemberId))
      .limit(1)

    if (existing) return toMemberIntentProfile(existing)

    const helperPrefs = await this.getHelperPreferences(resolvedMemberId)
    const [created] = await db
      .insert(memberIntentProfiles)
      .values({
        memberId: resolvedMemberId,
        canHelpCategories: helperPrefs.categories,
        radiusMiles: helperPrefs.radiusMiles,
        notificationFrequency: helperPrefs.digestFrequency,
      })
      .returning()

    return toMemberIntentProfile(created)
  }

  async updateMemberIntentProfile(
    input: UpdateMemberIntentProfileInput,
    memberId?: string,
  ): Promise<MemberIntentProfile> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for intent profile')

    const patch: Partial<typeof memberIntentProfiles.$inferInsert> = {
      updatedAt: new Date(),
    }
    const helperPatch: UpdateHelperPreferencesInput = {}

    if (input.canHelpCategories !== undefined) {
      patch.canHelpCategories = Array.from(new Set(input.canHelpCategories)).filter(
        (category) => LISTING_CATEGORY_VALUES.has(category),
      )
      helperPatch.categories = patch.canHelpCategories as ListingCategory[]
    }

    if (input.needsHelpCategories !== undefined) {
      patch.needsHelpCategories = Array.from(
        new Set(input.needsHelpCategories),
      ).filter((category) => LISTING_CATEGORY_VALUES.has(category))
    }

    if (input.happeningInterests !== undefined) {
      patch.happeningInterests = Array.from(
        new Set(input.happeningInterests),
      ).filter((category) => HAPPENING_CATEGORY_VALUES.has(category))
    }

    if (typeof input.radiusMiles === 'number' && Number.isFinite(input.radiusMiles)) {
      patch.radiusMiles = Math.min(25, Math.max(1, Math.round(input.radiusMiles)))
      helperPatch.radiusMiles = patch.radiusMiles
    }

    if (
      input.notificationFrequency &&
      HELPER_DIGEST_FREQUENCY_VALUES.has(input.notificationFrequency)
    ) {
      patch.notificationFrequency = input.notificationFrequency
      helperPatch.digestFrequency = input.notificationFrequency
    }

    if (typeof input.shareAvailability === 'boolean') {
      patch.shareAvailability = input.shareAvailability
    }

    const [existing] = await db
      .select()
      .from(memberIntentProfiles)
      .where(eq(memberIntentProfiles.memberId, resolvedMemberId))
      .limit(1)

    const [saved] = existing
      ? await db
          .update(memberIntentProfiles)
          .set(patch)
          .where(eq(memberIntentProfiles.memberId, resolvedMemberId))
          .returning()
      : await db
          .insert(memberIntentProfiles)
          .values({
            memberId: resolvedMemberId,
            ...patch,
          })
          .returning()

    if (
      helperPatch.categories !== undefined ||
      helperPatch.radiusMiles !== undefined ||
      helperPatch.digestFrequency !== undefined
    ) {
      await this.updateHelperPreferences(helperPatch, resolvedMemberId)
    }

    return toMemberIntentProfile(saved)
  }

  async getTimedNeeds(filters: TimedNeedFilters = {}): Promise<TimedNeed[]> {
    if (!this.currentMemberId) await this.initialize()

    const [currentMemberRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, this.currentMemberId))
      .limit(1)
    if (!currentMemberRow) throw new Error(`Member ${this.currentMemberId} not found`)
    const currentMember = toMember(currentMemberRow)

    const { start, end } = getTimedNeedRange(filters.timeframe)
    const distanceScope = filters.distance ?? 'community'
    const conditions = [
      eq(listings.type, 'need'),
      eq(listings.isActive, true),
      gt(listings.expiresAt, new Date()),
    ]

    if (filters.category) {
      conditions.push(eq(listings.category, filters.category))
    }
    if (filters.urgentOnly) {
      conditions.push(eq(listings.isUrgent, true))
    }
    if (!filters.includeOwn) {
      conditions.push(ne(listings.memberId, this.currentMemberId))
    }
    if (distanceScope === 'community' && currentMember.communityId) {
      conditions.push(eq(members.communityId, currentMember.communityId))
    }

    const listingRows = await db
      .select({ listing: listings, requester: members })
      .from(listings)
      .innerJoin(members, eq(listings.memberId, members.id))
      .where(and(...conditions))

    let listingEntries = listingRows.map(({ listing, requester }) => ({
      listing: toListing(listing, toMember(requester)),
      requester: toMember(requester),
    }))

    if (distanceScope === 'nearby') {
      listingEntries = listingEntries.filter(
        ({ requester }) => getDistanceMiles(currentMember, requester) <= 5,
      )
    }

    const needIds = listingEntries.map(({ listing }) => listing.id)
    if (needIds.length === 0) return []

    const windowRows = await db
      .select()
      .from(needWindows)
      .where(
        and(
          inArray(needWindows.needId, needIds),
          gte(needWindows.endsAt, start),
          lte(needWindows.startsAt, end),
          inArray(needWindows.status, ['open', 'offered', 'assigned']),
        ),
      )

    const windowsByNeed = new Map<string, NeedWindow[]>()
    for (const row of windowRows) {
      const window = toNeedWindow(row)
      const existing = windowsByNeed.get(window.needId) ?? []
      existing.push(window)
      windowsByNeed.set(window.needId, existing)
    }

    const offerRows = await db
      .select({ offer: needOffers, helper: members })
      .from(needOffers)
      .innerJoin(members, eq(needOffers.helperId, members.id))
      .where(inArray(needOffers.needId, needIds))

    const offersByNeed = new Map<string, NeedOffer[]>()
    for (const { offer, helper } of offerRows) {
      const needOffer = toNeedOffer(offer, toMember(helper))
      const existing = offersByNeed.get(needOffer.needId) ?? []
      existing.push(needOffer)
      offersByNeed.set(needOffer.needId, existing)
    }

    const timedNeeds = listingEntries
      .map(({ listing, requester }) => {
        const windows = (windowsByNeed.get(listing.id) ?? []).sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )
        const offers = (offersByNeed.get(listing.id) ?? []).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        const currentMemberOffers = offers.filter(
          (offer) => offer.helperId === this.currentMemberId,
        )
        const currentMemberOffer =
          currentMemberOffers.find((offer) =>
            ['offered', 'accepted'].includes(offer.status),
          ) ??
          currentMemberOffers.at(-1) ??
          null
        const distanceMiles = getDistanceMiles(currentMember, requester)

        return {
          listing,
          requester,
          windows,
          offers,
          currentMemberOffer,
          distanceMiles,
          isOwnedByCurrentMember: listing.memberId === this.currentMemberId,
        }
      })
      .filter((need) => need.windows.length > 0)
      .sort((a, b) => {
        if (a.listing.isUrgent !== b.listing.isUrgent) {
          return a.listing.isUrgent ? -1 : 1
        }
        return (
          new Date(a.windows[0].startsAt).getTime() -
          new Date(b.windows[0].startsAt).getTime()
        )
      })

    return filters.limit ? timedNeeds.slice(0, filters.limit) : timedNeeds
  }

  async offerNeedHelp(input: OfferNeedHelpInput): Promise<NeedOffer> {
    if (!this.currentMemberId) await this.initialize()

    const need = await this.getListing(input.needId)
    if (need.type !== 'need') throw new Error('You can only offer help on needs')
    if (!need.isActive || new Date(need.expiresAt) <= new Date()) {
      throw new Error('This need is no longer active')
    }
    if (need.memberId === this.currentMemberId) {
      throw new Error('You cannot offer help on your own need')
    }

    const [windowRow] = await db
      .select()
      .from(needWindows)
      .where(
        and(
          eq(needWindows.id, input.windowId),
          eq(needWindows.needId, input.needId),
        ),
      )
      .limit(1)

    if (!windowRow) throw new Error('Need window not found')
    if (!['open', 'offered'].includes(windowRow.status)) {
      throw new Error('This time window is no longer open')
    }

    const message = input.message?.trim() || null
    const [existing] = await db
      .select()
      .from(needOffers)
      .where(
        and(
          eq(needOffers.needId, input.needId),
          eq(needOffers.windowId, input.windowId),
          eq(needOffers.helperId, this.currentMemberId),
        ),
      )
      .limit(1)

    const row = await db.transaction(async (tx) => {
      const [offer] = existing
        ? await tx
            .update(needOffers)
            .set({ message, status: 'offered', updatedAt: new Date() })
            .where(eq(needOffers.id, existing.id))
            .returning()
        : await tx
            .insert(needOffers)
            .values({
              needId: input.needId,
              windowId: input.windowId,
              helperId: this.currentMemberId,
              message,
            })
            .returning()

      await tx
        .update(needWindows)
        .set({ status: 'offered', updatedAt: new Date() })
        .where(eq(needWindows.id, input.windowId))

      await tx
        .update(listings)
        .set({ needStatus: 'offered', updatedAt: new Date() })
        .where(eq(listings.id, input.needId))

      await tx.insert(notifications).values({
        memberId: need.memberId,
        type: 'offer_received',
        priority: 'high',
        title: 'Someone can help',
        body: `A neighbor offered to help with ${need.title}.`,
        targetPath: '/needs',
      })

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'helper_offer_submitted',
        targetType: 'listing',
        targetId: input.needId,
        metadata: {
          category: need.category,
          windowId: input.windowId,
        },
      })

      return offer
    })

    const helper = await this.getCurrentMember()
    return toNeedOffer(row, helper)
  }

  async acceptNeedOffer(offerId: string): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    const [offerRow] = await db
      .select()
      .from(needOffers)
      .where(eq(needOffers.id, offerId))
      .limit(1)
    if (!offerRow) throw new Error(`Need offer ${offerId} not found`)

    const need = await this.getListing(offerRow.needId)
    if (need.memberId !== this.currentMemberId) {
      throw new Error('Only the requester can accept help for this need')
    }
    if (need.type !== 'need') throw new Error('This offer is not tied to a need')

    if (offerRow.status === 'accepted' && offerRow.exchangeId) {
      const [existingExchange] = await db
        .select()
        .from(exchanges)
        .where(eq(exchanges.id, offerRow.exchangeId))
        .limit(1)
      if (existingExchange) return toExchange(existingExchange, need)
    }
    if (offerRow.status !== 'offered') {
      throw new Error(`Cannot accept a need offer with status '${offerRow.status}'`)
    }

    const [windowRow] = await db
      .select()
      .from(needWindows)
      .where(
        and(
          eq(needWindows.id, offerRow.windowId),
          eq(needWindows.needId, offerRow.needId),
        ),
      )
      .limit(1)
    if (!windowRow) throw new Error('Need window not found')

    const idempotencyKey = `${this.currentMemberId}:need-offer:${offerRow.id}`.slice(
      0,
      160,
    )

    return await db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(exchanges)
        .values({
          listingId: need.id,
          providerId: offerRow.helperId,
          requesterId: this.currentMemberId,
          idempotencyKey,
          status: 'in_escrow',
          tuAmount: need.creditPrice,
          scheduledAt: windowRow.startsAt,
        })
        .onConflictDoNothing({ target: exchanges.idempotencyKey })
        .returning()

      let exchangeRow = insertedRows[0]
      if (!exchangeRow) {
        const [existingExchange] = await tx
          .select()
          .from(exchanges)
          .where(eq(exchanges.idempotencyKey, idempotencyKey))
          .limit(1)
        if (!existingExchange) throw new Error('Unable to create exchange')
        exchangeRow = existingExchange
      }

      if (need.creditPrice > 0) {
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.memberId, this.currentMemberId))

        if (!wallet) throw new Error(`Wallet not found for member ${this.currentMemberId}`)

        await this.applyLedgerOperation(tx, {
          walletId: wallet.id,
          type: 'escrow_hold',
          amount: need.creditPrice,
          description: 'Credits held for accepted need',
          exchangeId: exchangeRow.id,
          operationKey: this.ledgerOperationKey(exchangeRow.id, wallet.id, 'hold'),
        })
      }

      const [existingBooking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.exchangeId, exchangeRow.id))
        .limit(1)
      const bookingDate = new Date(windowRow.startsAt)
      const startTime = formatTimeOfDay(windowRow.startsAt)
      const endTime = formatTimeOfDay(windowRow.endsAt)

      if (existingBooking) {
        await tx
          .update(bookings)
          .set({
            providerId: offerRow.helperId,
            requesterId: this.currentMemberId,
            date: bookingDate,
            startTime,
            endTime,
            status: 'confirmed',
          })
          .where(eq(bookings.id, existingBooking.id))
      } else {
        await tx.insert(bookings).values({
          exchangeId: exchangeRow.id,
          providerId: offerRow.helperId,
          requesterId: this.currentMemberId,
          date: bookingDate,
          startTime,
          endTime,
          status: 'confirmed',
        })
      }

      await tx
        .update(needOffers)
        .set({
          status: 'accepted',
          exchangeId: exchangeRow.id,
          updatedAt: new Date(),
        })
        .where(eq(needOffers.id, offerRow.id))

      await tx
        .update(needOffers)
        .set({ status: 'declined', updatedAt: new Date() })
        .where(
          and(
            eq(needOffers.needId, offerRow.needId),
            ne(needOffers.id, offerRow.id),
            eq(needOffers.status, 'offered'),
          ),
        )

      await tx
        .update(needWindows)
        .set({ status: 'assigned', updatedAt: new Date() })
        .where(eq(needWindows.id, offerRow.windowId))

      await tx
        .update(listings)
        .set({ needStatus: 'assigned', updatedAt: new Date() })
        .where(eq(listings.id, need.id))

      await tx.insert(notifications).values({
        memberId: offerRow.helperId,
        type: 'offer_accepted',
        priority: 'high',
        title: 'Your help offer was accepted',
        body: `You are scheduled for ${need.title}.`,
        targetPath: `/exchange/${exchangeRow.id}`,
      })

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'offer_accepted',
        targetType: 'exchange',
        targetId: exchangeRow.id,
        metadata: {
          helperId: offerRow.helperId,
          needId: need.id,
        },
      })

      return toExchange(exchangeRow, need)
    })
  }

  async withdrawNeedOffer(
    offerId: string,
    input?: CancellationInput,
  ): Promise<NeedOffer> {
    if (!this.currentMemberId) await this.initialize()
    if (!this.currentMemberId) throw new Error('No current member for need offer')
    const cancellation = normalizeCancellationInput(input, 'schedule_conflict')

    const [offerRow] = await db
      .select()
      .from(needOffers)
      .where(eq(needOffers.id, offerId))
      .limit(1)
    if (!offerRow) throw new Error(`Need offer ${offerId} not found`)
    if (offerRow.helperId !== this.currentMemberId) {
      throw new Error('Only the helper can withdraw this offer')
    }
    if (offerRow.status === 'accepted') {
      throw new Error('Cancel an accepted offer from the exchange room')
    }
    if (offerRow.status === 'withdrawn') {
      const helper = await this.getCurrentMember()
      return toNeedOffer(offerRow, helper)
    }
    if (offerRow.status !== 'offered') {
      throw new Error(`Cannot withdraw a need offer with status '${offerRow.status}'`)
    }

    const need = await this.getListing(offerRow.needId)

    const updatedOffer = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(needOffers)
        .set({ status: 'withdrawn', updatedAt: new Date() })
        .where(eq(needOffers.id, offerId))
        .returning()
      if (!updated) throw new Error('Unable to withdraw offer')

      const [remainingWindowOffer] = await tx
        .select()
        .from(needOffers)
        .where(
          and(
            eq(needOffers.needId, offerRow.needId),
            eq(needOffers.windowId, offerRow.windowId),
            eq(needOffers.status, 'offered'),
          ),
        )
        .limit(1)

      if (!remainingWindowOffer) {
        await tx
          .update(needWindows)
          .set({ status: 'open', updatedAt: new Date() })
          .where(
            and(
              eq(needWindows.id, offerRow.windowId),
              eq(needWindows.status, 'offered'),
            ),
          )
      }

      const [remainingNeedOffer] = await tx
        .select()
        .from(needOffers)
        .where(
          and(
            eq(needOffers.needId, offerRow.needId),
            eq(needOffers.status, 'offered'),
          ),
        )
        .limit(1)

      if (!remainingNeedOffer) {
        await tx
          .update(listings)
          .set({ needStatus: 'live', updatedAt: new Date() })
          .where(
            and(
              eq(listings.id, offerRow.needId),
              eq(listings.needStatus, 'offered'),
            ),
          )
      }

      await tx.insert(notifications).values({
        memberId: need.memberId,
        type: 'backup_available',
        priority: 'normal',
        title: 'A helper withdrew',
        body: `A helper withdrew from ${need.title}.`,
        targetPath: `/needs?category=${need.category}`,
      })

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'offer_withdrawn',
        targetType: 'listing',
        targetId: offerRow.needId,
        metadata: {
          offerId,
          windowId: offerRow.windowId,
          ...cancellationMetadata(cancellation),
        },
      })

      return updated
    })

    const helper = await this.getCurrentMember()
    return toNeedOffer(updatedOffer, helper)
  }

  async repostTimedNeed(needId: string): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()

    const need = await this.getListing(needId)
    if (need.type !== 'need') throw new Error('Only needs can be reposted')
    if (need.memberId !== this.currentMemberId) {
      throw new Error('Only the requester can repost this need')
    }
    if (['assigned', 'confirmed', 'completed'].includes(need.needStatus ?? '')) {
      throw new Error('Repost an accepted need from the exchange room')
    }

    const [windowRows, offerRows] = await Promise.all([
      db
        .select()
        .from(needWindows)
        .where(eq(needWindows.needId, needId))
        .orderBy(asc(needWindows.startsAt)),
      db.select().from(needOffers).where(eq(needOffers.needId, needId)),
    ])

    const now = new Date()
    const nextWindows = windowRows.length > 0
      ? windowRows.map((window) => {
          const startsAt = new Date(window.startsAt)
          const endsAt = new Date(window.endsAt)
          const durationMs = endsAt.getTime() - startsAt.getTime()

          while (endsAt <= now) {
            startsAt.setDate(startsAt.getDate() + 7)
            endsAt.setTime(startsAt.getTime() + durationMs)
          }

          return {
            startsAt,
            endsAt,
            label: window.label,
            isFlexible: window.isFlexible,
          }
        })
      : [
          {
            startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            endsAt: new Date(now.getTime() + 26 * 60 * 60 * 1000),
            label: 'Reposted window',
            isFlexible: true,
          },
        ]

    const priorHelperIds = [
      ...new Set(
        offerRows
          .filter((offer) => offer.helperId !== this.currentMemberId)
          .map((offer) => offer.helperId),
      ),
    ]

    return await db.transaction(async (tx) => {
      await tx
        .update(listings)
        .set({
          isActive: false,
          needStatus: 'reposted',
          updatedAt: now,
        })
        .where(eq(listings.id, needId))

      await tx
        .update(needWindows)
        .set({ status: 'expired', updatedAt: now })
        .where(
          and(
            eq(needWindows.needId, needId),
            inArray(needWindows.status, ['open', 'offered']),
          ),
        )

      await tx
        .update(needOffers)
        .set({ status: 'expired', updatedAt: now })
        .where(
          and(
            eq(needOffers.needId, needId),
            eq(needOffers.status, 'offered'),
          ),
        )

      const [repost] = await tx
        .insert(listings)
        .values({
          memberId: need.memberId,
          type: 'need',
          title: need.title,
          description: need.description,
          category: need.category,
          creditPrice: need.creditPrice,
          availabilityType: need.availabilityType,
          needStatus: 'live',
          publicLocationLabel: need.publicLocationLabel,
          exactLocation: need.exactLocation,
          isLocationPrivate: need.isLocationPrivate,
          isUrgent: need.isUrgent,
          recurringNote: need.recurringNote,
          imageUrls: need.imageUrls,
          refreshedAt: now,
          expiresAt: getListingExpiresAt(now),
        })
        .returning()

      await tx.insert(needWindows).values(
        nextWindows.map((window) => ({
          needId: repost.id,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          label: window.label,
          isFlexible: window.isFlexible,
          status: 'open' as const,
        })),
      )

      if (priorHelperIds.length > 0) {
        await tx.insert(notifications).values(
          priorHelperIds.map((memberId) => ({
            memberId,
            type: 'backup_available' as const,
            priority: 'high' as const,
            title: 'Need reopened',
            body: `${need.title} was reposted and still needs help.`,
            targetPath: `/needs?category=${need.category}`,
          })),
        )
      }

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'need_reposted',
        targetType: 'listing',
        targetId: repost.id,
        metadata: {
          originalNeedId: needId,
          priorHelpers: priorHelperIds.length,
        },
      })

      return toListing(repost)
    })
  }

  async markNeedStillNeedsHelp(needId: string): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()

    const need = await this.getListing(needId)
    if (need.type !== 'need') throw new Error('Only needs can be refreshed')
    if (need.memberId !== this.currentMemberId) {
      throw new Error('Only the requester can refresh this need')
    }
    if (
      ['assigned', 'confirmed', 'completed', 'cancelled', 'reposted'].includes(
        need.needStatus ?? '',
      )
    ) {
      throw new Error('Only open needs can be marked as still needing help')
    }

    const offerRows = await db
      .select()
      .from(needOffers)
      .where(eq(needOffers.needId, needId))

    const activeOfferCount = offerRows.filter((offer) =>
      ['offered', 'accepted'].includes(offer.status),
    ).length
    const priorHelperIds = [
      ...new Set(
        offerRows
          .filter(
            (offer) =>
              offer.helperId !== this.currentMemberId &&
              ['declined', 'withdrawn', 'expired'].includes(offer.status),
          )
          .map((offer) => offer.helperId),
      ),
    ]

    const now = new Date()
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(listings)
        .set({
          isActive: true,
          needStatus: activeOfferCount > 0 ? 'offered' : 'live',
          refreshedAt: now,
          expiresAt: getListingExpiresAt(now),
          updatedAt: now,
        })
        .where(eq(listings.id, needId))
        .returning()

      await tx
        .update(needWindows)
        .set({ status: 'open', updatedAt: now })
        .where(
          and(
            eq(needWindows.needId, needId),
            eq(needWindows.status, 'expired'),
          ),
        )

      if (priorHelperIds.length > 0) {
        await tx.insert(notifications).values(
          priorHelperIds.map((memberId) => ({
            memberId,
            type: 'backup_available' as const,
            priority: 'high' as const,
            title: 'Still needs help',
            body: `${need.title} still needs a helper.`,
            targetPath: `/needs?category=${need.category}`,
          })),
        )
      }

      return toListing(row)
    })

    await this.notifyMatchingHelpersForNeed(updated)
    return updated
  }

  async cancelTimedNeed(
    needId: string,
    input?: CancellationInput,
  ): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()
    const cancellation = normalizeCancellationInput(input, 'no_longer_needed')

    const need = await this.getListing(needId)
    if (need.type !== 'need') throw new Error('Only needs can be cancelled')
    if (need.memberId !== this.currentMemberId) {
      throw new Error('Only the requester can cancel this need')
    }
    if (need.needStatus === 'cancelled') return need
    if (['assigned', 'confirmed', 'completed'].includes(need.needStatus ?? '')) {
      throw new Error('Cancel an accepted need from the exchange room')
    }

    const [acceptedOffer] = await db
      .select()
      .from(needOffers)
      .where(
        and(
          eq(needOffers.needId, needId),
          eq(needOffers.status, 'accepted'),
        ),
      )
      .limit(1)

    if (acceptedOffer) {
      throw new Error('Cancel an accepted need from the exchange room')
    }

    await db.transaction(async (tx) => {
      const now = new Date()
      const offeredRows = await tx
        .select()
        .from(needOffers)
        .where(
          and(
            eq(needOffers.needId, needId),
            eq(needOffers.status, 'offered'),
          ),
        )

      await tx
        .update(listings)
        .set({
          isActive: false,
          needStatus: 'cancelled',
          updatedAt: now,
        })
        .where(eq(listings.id, needId))

      await tx
        .update(needWindows)
        .set({ status: 'cancelled', updatedAt: now })
        .where(
          and(
            eq(needWindows.needId, needId),
            inArray(needWindows.status, ['open', 'offered']),
          ),
        )

      await tx
        .update(needOffers)
        .set({ status: 'expired', updatedAt: now })
        .where(
          and(
            eq(needOffers.needId, needId),
            eq(needOffers.status, 'offered'),
          ),
        )

      if (offeredRows.length > 0) {
        await tx.insert(notifications).values(
          offeredRows.map((offer) => ({
            memberId: offer.helperId,
            type: 'backup_available' as const,
            priority: 'normal' as const,
            title: 'Need cancelled',
            body: `${need.title} was cancelled by the requester.`,
            targetPath: `/needs?category=${need.category}`,
          })),
        )
      }

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'need_cancelled',
        targetType: 'listing',
        targetId: needId,
        metadata: {
          expiredOffers: offeredRows.length,
          ...cancellationMetadata(cancellation),
        },
      })
    })

    return await this.getListing(needId)
  }

  async getSuggestedMatchesForListing(
    listingId: string,
    limit = 8,
  ): Promise<SuggestedListingMatch[]> {
    if (!this.currentMemberId) await this.initialize()

    const source = await this.getListing(listingId)
    const matchType = source.type === 'need' ? 'offering' : 'need'
    const exactCategory = await this.getMarketplaceListings({
      type: matchType,
      category: source.category,
      distance: 'community',
      excludeCurrentMember: true,
      limit: limit * 2,
    })

    const fallback =
      exactCategory.length >= limit
        ? []
        : await this.getMarketplaceListings({
            type: matchType,
            distance: 'community',
            excludeCurrentMember: true,
            limit: limit * 2,
          })

    const seen = new Set<string>()
    const candidates = [...exactCategory, ...fallback].filter((candidate) => {
      if (candidate.id === source.id || seen.has(candidate.id)) return false
      seen.add(candidate.id)
      return true
    })

    return candidates
      .map((candidate) => {
        const reasons: string[] = []
        let score = 0

        if (candidate.category === source.category) {
          score += 40
          reasons.push('Same category')
        }
        if (
          source.member?.communityId &&
          candidate.member?.communityId === source.member.communityId
        ) {
          score += 25
          reasons.push('Same community')
        }
        if (
          source.creditPrice === 0 ||
          candidate.creditPrice === 0 ||
          Math.abs(candidate.creditPrice - source.creditPrice) <= 2
        ) {
          score += 20
          reasons.push('Compatible credits')
        }
        if (candidate.member?.isAvailable) {
          score += 10
          reasons.push('Member available')
        }
        if (candidate.availabilityType === source.availabilityType) {
          score += 5
          reasons.push('Similar timing')
        }

        return { listing: candidate, score, reasons }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async getLocalBusinesses(
    filters: LocalBusinessFilters = {},
  ): Promise<LocalBusiness[]> {
    if (!this.currentMemberId) await this.initialize()

    const [currentMemberRow] = this.currentMemberId
      ? await db
          .select()
          .from(members)
          .where(eq(members.id, this.currentMemberId))
          .limit(1)
      : []
    const currentMember = currentMemberRow ? toMember(currentMemberRow) : null

    const query = filters.query?.trim()
    const conditions = [
      eq(members.membershipType, 'business'),
      eq(members.status, 'active'),
    ]

    if (query) {
      conditions.push(
        or(
          ilike(businessProfiles.businessName, `%${query}%`),
          ilike(businessProfiles.address, `%${query}%`),
          ilike(businessProfiles.contributionNotes, `%${query}%`),
        )!,
      )
    }

    const rows = await db
      .select({ profile: businessProfiles, member: members })
      .from(businessProfiles)
      .innerJoin(members, eq(businessProfiles.memberId, members.id))
      .where(and(...conditions))
      .orderBy(asc(businessProfiles.businessName))

    const targetCategories = filters.category
      ? [filters.category]
      : filters.listingCategory
        ? LISTING_CATEGORY_TO_BUSINESS_CATEGORIES[filters.listingCategory]
        : []

    const filteredRows =
      targetCategories.length > 0
        ? rows.filter(({ profile }) =>
            targetCategories.some((category) =>
              (profile.categories as string[]).includes(category),
            ),
          )
        : rows

    const businesses = await Promise.all(
      filteredRows.map(async ({ profile, member }) => {
        const hydratedMember = await this.hydrateMember(member)
        const distanceMiles = currentMember
          ? getDistanceMiles(currentMember, toMember(member))
          : null

        return {
          profile: toBusinessProfile(profile),
          member: hydratedMember,
          offerings: hydratedMember.offerings,
          distanceMiles,
        }
      }),
    )

    return businesses
      .sort((a, b) => {
        if (a.profile.isCommunityFavorite !== b.profile.isCommunityFavorite) {
          return a.profile.isCommunityFavorite ? -1 : 1
        }
        if (a.distanceMiles !== null && b.distanceMiles !== null) {
          return a.distanceMiles - b.distanceMiles
        }
        return b.profile.rating - a.profile.rating
      })
      .slice(0, filters.limit ?? 50)
  }

  async getLocalBusiness(id: string): Promise<LocalBusiness> {
    if (!this.currentMemberId) await this.initialize()

    const [row] = await db
      .select({ profile: businessProfiles, member: members })
      .from(businessProfiles)
      .innerJoin(members, eq(businessProfiles.memberId, members.id))
      .where(or(eq(businessProfiles.id, id), eq(businessProfiles.memberId, id))!)
      .limit(1)

    if (!row) throw new Error(`Local business ${id} not found`)

    const [currentMemberRow] = this.currentMemberId
      ? await db
          .select()
          .from(members)
          .where(eq(members.id, this.currentMemberId))
          .limit(1)
      : []
    const currentMember = currentMemberRow ? toMember(currentMemberRow) : null
    const hydratedMember = await this.hydrateMember(row.member)

    return {
      profile: toBusinessProfile(row.profile),
      member: hydratedMember,
      offerings: hydratedMember.offerings,
      distanceMiles: currentMember
        ? getDistanceMiles(currentMember, toMember(row.member))
        : null,
    }
  }

  async getLocalBusinessFallbacks(
    category?: ListingCategory | null,
    limit = 3,
  ): Promise<LocalBusiness[]> {
    const categoryMatches = category
      ? await this.getLocalBusinesses({ listingCategory: category, limit })
      : []

    if (categoryMatches.length >= limit) return categoryMatches.slice(0, limit)

    const fallback = await this.getLocalBusinesses({ limit })
    const seen = new Set(categoryMatches.map((business) => business.profile.id))
    return [
      ...categoryMatches,
      ...fallback.filter((business) => !seen.has(business.profile.id)),
    ].slice(0, limit)
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

  async getNeedWindowsForListing(
    needId: string,
    options: { activeOnly?: boolean } = {},
  ): Promise<NeedWindow[]> {
    const conditions = [eq(needWindows.needId, needId)]
    if (options.activeOnly) {
      conditions.push(inArray(needWindows.status, ['open', 'offered', 'assigned']))
    }

    const rows = await db
      .select()
      .from(needWindows)
      .where(and(...conditions))
      .orderBy(asc(needWindows.startsAt))

    return rows.map(toNeedWindow)
  }

  /**
   * Create a new listing owned by the current member.
   * The listing is active by default.
   */
  async createListing(input: CreateListingInput): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()

    const now = new Date()

    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(listings)
        .values({
          memberId: this.currentMemberId,
          type: input.type,
          title: input.title,
          description: input.description,
          category: input.category,
          creditPrice: input.creditPrice,
          availabilityType: input.availabilityType ?? 'ongoing',
          needStatus:
            input.needStatus ?? (input.type === 'need' ? 'live' : null),
          publicLocationLabel: input.publicLocationLabel ?? null,
          exactLocation: input.exactLocation ?? null,
          isLocationPrivate: input.isLocationPrivate ?? true,
          isUrgent: input.isUrgent ?? false,
          recurringNote: input.recurringNote ?? null,
          imageUrls: input.imageUrls ?? [],
          refreshedAt: now,
          expiresAt: getListingExpiresAt(now),
        })
        .returning()

      if (input.type === 'need' && input.windows?.length) {
        await tx
          .insert(needWindows)
          .values(buildNeedWindowValues(row.id, input.windows))
      }

      if (input.type === 'need') {
        await tx.insert(analyticsEvents).values({
          memberId: this.currentMemberId,
          eventType: 'need_posted',
          targetType: 'listing',
          targetId: row.id,
          metadata: {
            category: input.category,
            isUrgent: input.isUrgent ?? false,
          },
        })
      }

      return toListing(row)
    })

    if (created.type === 'need') {
      await this.notifyMatchingHelpersForNeed(created)
    }

    return created
  }

  /**
   * Update a listing. Only the owner can update their own listings;
   * this is enforced by the current-member check.
   */
  async updateListing(
    id: string,
    input: Partial<CreateListingInput>,
  ): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()

    const [existing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
    if (!existing) throw new Error(`Listing ${id} not found`)
    if (existing.memberId !== this.currentMemberId) {
      throw new Error('Not authorized to edit this listing')
    }

    const nextType = input.type ?? existing.type
    const shouldReplaceNeedWindows = input.windows !== undefined && nextType === 'need'
    if (shouldReplaceNeedWindows && input.windows?.length === 0) {
      throw new Error('Need listings need at least one time window')
    }
    const nextWindowValues = shouldReplaceNeedWindows
      ? buildNeedWindowValues(id, input.windows ?? [])
      : []
    const now = new Date()

    return await db.transaction(async (tx) => {
      await tx
        .update(listings)
        .set({
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.creditPrice !== undefined ? { creditPrice: input.creditPrice } : {}),
          ...(input.availabilityType !== undefined ? { availabilityType: input.availabilityType } : {}),
          ...(input.needStatus !== undefined
            ? { needStatus: input.needStatus }
            : nextType === 'need' && existing.type !== 'need'
              ? { needStatus: 'live' as const }
              : nextType !== 'need'
                ? { needStatus: null }
                : {}),
          ...(input.publicLocationLabel !== undefined
            ? { publicLocationLabel: input.publicLocationLabel }
            : {}),
          ...(input.exactLocation !== undefined ? { exactLocation: input.exactLocation } : {}),
          ...(input.isLocationPrivate !== undefined
            ? { isLocationPrivate: input.isLocationPrivate }
            : {}),
          ...(input.isUrgent !== undefined ? { isUrgent: input.isUrgent } : {}),
          ...(input.recurringNote !== undefined ? { recurringNote: input.recurringNote } : {}),
          ...(input.imageUrls !== undefined ? { imageUrls: input.imageUrls } : {}),
          updatedAt: now,
        })
        .where(eq(listings.id, id))

      if (existing.type === 'need' && nextType !== 'need') {
        await tx
          .update(needOffers)
          .set({ status: 'expired', updatedAt: now })
          .where(
            and(
              eq(needOffers.needId, id),
              inArray(needOffers.status, ['offered', 'declined']),
            ),
          )
        await tx
          .update(needWindows)
          .set({ status: 'expired', updatedAt: now })
          .where(
            and(
              eq(needWindows.needId, id),
              inArray(needWindows.status, ['open', 'offered']),
            ),
          )
      }

      if (shouldReplaceNeedWindows) {
        const activeWindowRows = await tx
          .select()
          .from(needWindows)
          .where(
            and(
              eq(needWindows.needId, id),
              inArray(needWindows.status, ['open', 'offered', 'assigned']),
            ),
          )
          .orderBy(asc(needWindows.startsAt))

        const existingById = new Map(
          activeWindowRows.map((window) => [window.id, window]),
        )
        const windowsChanged =
          nextWindowValues.length !== activeWindowRows.length ||
          (input.windows ?? []).some((window, index) => {
            const existingWindow = window.id
              ? existingById.get(window.id)
              : activeWindowRows[index]
            const nextWindow = nextWindowValues[index]
            const nextStartsAt = nextWindow.startsAt as Date
            const nextEndsAt = nextWindow.endsAt as Date

            return (
              !existingWindow ||
              existingWindow.startsAt.getTime() !== nextStartsAt.getTime() ||
              existingWindow.endsAt.getTime() !== nextEndsAt.getTime() ||
              (existingWindow.label ?? null) !== (nextWindow.label ?? null) ||
              existingWindow.isFlexible !== Boolean(nextWindow.isFlexible)
            )
          })

        if (windowsChanged) {
          const [acceptedOffer] = await tx
            .select()
            .from(needOffers)
            .where(
              and(eq(needOffers.needId, id), eq(needOffers.status, 'accepted')),
            )
            .limit(1)
          if (
            acceptedOffer ||
            activeWindowRows.some((window) => window.status === 'assigned')
          ) {
            throw new Error(
              'Timing can be changed after cancelling or completing the accepted helper exchange',
            )
          }

          const pendingOfferRows = await tx
            .select()
            .from(needOffers)
            .where(
              and(eq(needOffers.needId, id), eq(needOffers.status, 'offered')),
            )

          await tx
            .update(needOffers)
            .set({ status: 'expired', updatedAt: now })
            .where(
              and(
                eq(needOffers.needId, id),
                inArray(needOffers.status, ['offered', 'declined']),
              ),
            )
          await tx
            .update(needWindows)
            .set({ status: 'expired', updatedAt: now })
            .where(
              and(
                eq(needWindows.needId, id),
                inArray(needWindows.status, ['open', 'offered']),
              ),
            )

          if (nextWindowValues.length > 0) {
            await tx.insert(needWindows).values(nextWindowValues)
          }

          await tx
            .update(listings)
            .set({
              isActive: true,
              needStatus: 'live',
              refreshedAt: now,
              expiresAt: getListingExpiresAt(now),
              updatedAt: now,
            })
            .where(eq(listings.id, id))

          const helperIds = [
            ...new Set(pendingOfferRows.map((offer) => offer.helperId)),
          ]
          if (helperIds.length > 0) {
            await tx.insert(notifications).values(
              helperIds.map((helperId) => ({
                memberId: helperId,
                type: 'schedule_reminder' as const,
                priority: 'normal' as const,
                title: 'Need timing changed',
                body: `${existing.title} has new times. Offer again if one still works for you.`,
                targetPath: `/needs?category=${existing.category}`,
              })),
            )
          }
        }
      }

      const [row] = await tx.select().from(listings).where(eq(listings.id, id))
      return toListing(row)
    })
  }

  /**
   * Soft-delete a listing by flipping isActive to false. This preserves the
   * history of exchanges that referenced it. Only the owner can delete.
   */
  async deleteListing(id: string): Promise<void> {
    if (!this.currentMemberId) await this.initialize()

    const [existing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
    if (!existing) throw new Error(`Listing ${id} not found`)
    if (existing.memberId !== this.currentMemberId) {
      throw new Error('Not authorized to delete this listing')
    }

    await db
      .update(listings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(listings.id, id))
  }

  async refreshListing(id: string): Promise<Listing> {
    if (!this.currentMemberId) await this.initialize()

    const [existing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
    if (!existing) throw new Error(`Listing ${id} not found`)
    if (existing.memberId !== this.currentMemberId) {
      throw new Error('Not authorized to refresh this listing')
    }

    const now = new Date()
    const [row] = await db
      .update(listings)
      .set({
        isActive: true,
        refreshedAt: now,
        expiresAt: getListingExpiresAt(now),
        updatedAt: now,
      })
      .where(eq(listings.id, id))
      .returning()

    return toListing(row)
  }

  // ---- Search (person-first) ----------------------------------------------

  /**
   * Search listings by query text, then return the *members* who own those
   * listings. Business members go in `shopLocal`, everyone else in `neighbors`.
   */
  async search(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const conditions = [
      eq(listings.isActive, true),
      gt(listings.expiresAt, new Date()),
    ]

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

  async getExchangeRoom(id: string): Promise<ExchangeRoom> {
    if (!this.currentMemberId) await this.initialize()

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)
    this.assertExchangeParticipant(exchangeRow)

    const conversation = await this.getOrCreateExchangeConversation(exchangeRow)

    const [listingRows, memberRows, bookingRows, messageRows, ledgerRows, reviewRows] =
      await Promise.all([
        db
          .select()
          .from(listings)
          .where(eq(listings.id, exchangeRow.listingId))
          .limit(1),
        db
          .select()
          .from(members)
          .where(
            inArray(members.id, [
              exchangeRow.providerId,
              exchangeRow.requesterId,
            ]),
          ),
        db
          .select()
          .from(bookings)
          .where(eq(bookings.exchangeId, exchangeRow.id))
          .orderBy(desc(bookings.createdAt))
          .limit(1),
        db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(asc(messages.createdAt)),
        db
          .select()
          .from(walletTransactions)
          .where(eq(walletTransactions.exchangeId, exchangeRow.id))
          .orderBy(asc(walletTransactions.createdAt)),
        db
          .select()
          .from(reviews)
          .where(eq(reviews.exchangeId, exchangeRow.id))
          .orderBy(asc(reviews.createdAt)),
      ])

    const listingRow = listingRows[0]
    if (!listingRow) throw new Error(`Listing ${exchangeRow.listingId} not found`)

    const memberMap = new Map(memberRows.map((row) => [row.id, toMember(row)]))
    const provider = memberMap.get(exchangeRow.providerId)
    const requester = memberMap.get(exchangeRow.requesterId)
    const currentMember = memberMap.get(this.currentMemberId)
    if (!provider || !requester || !currentMember) {
      throw new Error('Exchange members could not be loaded')
    }

    const reviewIds = reviewRows.map((row) => row.id)
    const tagRows =
      reviewIds.length > 0
        ? await db
            .select()
            .from(reputationTags)
            .where(inArray(reputationTags.reviewId, reviewIds))
        : []
    const tagsByReviewId = new Map<string, ReputationTagType[]>()
    for (const row of tagRows) {
      const existing = tagsByReviewId.get(row.reviewId) ?? []
      existing.push(row.tag)
      tagsByReviewId.set(row.reviewId, existing)
    }

    const roomReviews = reviewRows.map((row) =>
      toReview(row, tagsByReviewId.get(row.id) ?? []),
    )
    const currentMemberReview =
      roomReviews.find((review) => review.reviewerId === this.currentMemberId) ??
      null
    const counterpartyReview =
      roomReviews.find((review) => review.reviewerId !== this.currentMemberId) ??
      null
    const currentRole =
      this.currentMemberId === exchangeRow.providerId ? 'provider' : 'requester'
    const counterparty = currentRole === 'provider' ? requester : provider
    const exchange = toExchange(
      exchangeRow,
      toListing(listingRow, memberMap.get(listingRow.memberId)),
      provider,
      requester,
    )
    const status = exchangeRow.status

    return {
      exchange,
      currentMember,
      counterparty,
      currentRole,
      booking: bookingRows[0] ? toBooking(bookingRows[0]) : null,
      conversation,
      messages: messageRows.map((row) => ({
        id: row.id,
        conversationId: row.conversationId,
        senderId: row.senderId,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      })),
      reviews: roomReviews,
      currentMemberReview,
      counterpartyReview,
      ledger: ledgerRows.map(toWalletTransaction),
      can: {
        accept: currentRole === 'provider' && status === 'requested',
        schedule: ['requested', 'accepted', 'in_escrow'].includes(status),
        complete: ['accepted', 'in_escrow'].includes(status),
        cancel: ['requested', 'accepted', 'in_escrow'].includes(status),
        dispute: ['accepted', 'in_escrow'].includes(status),
        review: status === 'completed' && currentMemberReview === null,
      },
    }
  }

  /**
   * Create a new exchange request. Places the TU amount in escrow by
   * debiting the requester's wallet and recording an idempotent hold.
   */
  async createExchange(input: CreateExchangeInput): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    const listing = await this.getListing(input.listingId)
    if (listing.memberId !== input.providerId) {
      throw new Error('Exchange provider does not own this listing')
    }
    if (listing.memberId === this.currentMemberId) {
      throw new Error('You cannot request your own listing')
    }

    const scopedIdempotencyKey = input.idempotencyKey
      ? `${this.currentMemberId}:${input.idempotencyKey}`.slice(0, 160)
      : null

    if (scopedIdempotencyKey) {
      const [existing] = await db
        .select()
        .from(exchanges)
        .where(eq(exchanges.idempotencyKey, scopedIdempotencyKey))
        .limit(1)

      if (existing) return toExchange(existing, listing)
    }

    const initialStatus: Exchange['status'] = input.scheduledAt
      ? 'in_escrow'
      : 'requested'

    return await db.transaction(async (tx) => {
      const values = {
        listingId: input.listingId,
        providerId: input.providerId,
        requesterId: this.currentMemberId,
        idempotencyKey: scopedIdempotencyKey,
        status: initialStatus,
        tuAmount: input.tuAmount,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      }

      const insertedRows = scopedIdempotencyKey
        ? await tx
            .insert(exchanges)
            .values(values)
            .onConflictDoNothing({ target: exchanges.idempotencyKey })
            .returning()
        : await tx.insert(exchanges).values(values).returning()

      let exchangeRow = insertedRows[0]
      if (!exchangeRow && scopedIdempotencyKey) {
        const [existing] = await tx
          .select()
          .from(exchanges)
          .where(eq(exchanges.idempotencyKey, scopedIdempotencyKey))
          .limit(1)
        if (!existing) throw new Error('Unable to create exchange request')
        exchangeRow = existing
      }

      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, this.currentMemberId))

      if (!wallet) throw new Error(`Wallet not found for member ${this.currentMemberId}`)

      await this.applyLedgerOperation(tx, {
        walletId: wallet.id,
        type: 'escrow_hold',
        amount: exchangeRow.tuAmount,
        description: 'Credits held for exchange',
        exchangeId: exchangeRow.id,
        operationKey: this.ledgerOperationKey(exchangeRow.id, wallet.id, 'hold'),
      })

      return toExchange(exchangeRow, listing)
    })
  }

  async acceptExchange(id: string): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)
    this.assertExchangeProvider(exchangeRow)

    if (exchangeRow.status === 'accepted' || exchangeRow.status === 'in_escrow') {
      return toExchange(exchangeRow)
    }
    if (exchangeRow.status !== 'requested') {
      throw new Error(`Cannot accept an exchange with status '${exchangeRow.status}'`)
    }

    const [row] = await db
      .update(exchanges)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(and(eq(exchanges.id, id), eq(exchanges.status, 'requested')))
      .returning()

    if (!row) throw new Error(`Exchange ${id} not found`)
    return toExchange(row)
  }

  /**
   * Complete an exchange. Releases escrow funds to the provider's wallet
   * and marks the exchange as completed.
   */
  async completeExchange(id: string): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)
    this.assertExchangeParticipant(exchangeRow)

    if (exchangeRow.status === 'completed') return toExchange(exchangeRow)

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(exchanges)
        .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(exchanges.id, id),
            inArray(exchanges.status, ['accepted', 'in_escrow']),
          ),
        )
        .returning()

      if (!updated) {
        const [current] = await tx
          .select()
          .from(exchanges)
          .where(eq(exchanges.id, id))
          .limit(1)
        if (current?.status === 'completed') return toExchange(current)
        throw new Error(`Cannot complete an exchange with status '${current?.status}'`)
      }

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

      await this.applyLedgerOperation(tx, {
        walletId: providerWallet.id,
        type: 'escrow_release',
        amount: exchangeRow.tuAmount,
        description: 'Credits received for completed exchange',
        exchangeId: id,
        operationKey: this.ledgerOperationKey(id, providerWallet.id, 'release'),
      })
      await this.applyLedgerOperation(tx, {
        walletId: requesterWallet.id,
        type: 'spent',
        amount: exchangeRow.tuAmount,
        description: 'Held credits spent on completed exchange',
        exchangeId: id,
        operationKey: this.ledgerOperationKey(id, requesterWallet.id, 'spent'),
      })

      return toExchange(updated)
    })
  }

  async cancelExchange(
    id: string,
    input?: CancellationInput,
  ): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()
    const cancellation = normalizeCancellationInput(input, 'other')

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)
    this.assertExchangeParticipant(exchangeRow)

    if (exchangeRow.status === 'cancelled') return toExchange(exchangeRow)
    if (exchangeRow.status === 'completed' || exchangeRow.status === 'disputed') {
      throw new Error(`Cannot cancel an exchange with status '${exchangeRow.status}'`)
    }

    return await db.transaction(async (tx) => {
      const now = new Date()
      const [updated] = await tx
        .update(exchanges)
        .set({ status: 'cancelled', updatedAt: now })
        .where(
          and(
            eq(exchanges.id, id),
            inArray(exchanges.status, ['requested', 'accepted', 'in_escrow']),
          ),
        )
        .returning()

      if (!updated) {
        const [current] = await tx
          .select()
          .from(exchanges)
          .where(eq(exchanges.id, id))
          .limit(1)
        if (current?.status === 'cancelled') return toExchange(current)
        throw new Error(`Cannot cancel an exchange with status '${current?.status}'`)
      }

      const [requesterWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, exchangeRow.requesterId))
        .limit(1)

      if (!requesterWallet) {
        throw new Error(`Wallet not found for requester ${exchangeRow.requesterId}`)
      }

      const [hold] = await tx
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.exchangeId, id),
            eq(walletTransactions.walletId, requesterWallet.id),
            eq(walletTransactions.type, 'escrow_hold'),
          ),
        )
        .limit(1)

      if (hold) {
        await this.applyLedgerOperation(tx, {
          walletId: requesterWallet.id,
          type: 'escrow_return',
          amount: exchangeRow.tuAmount,
          description: 'Held credits returned after cancellation',
          exchangeId: id,
          operationKey: this.ledgerOperationKey(id, requesterWallet.id, 'return'),
        })
      }

      await tx
        .update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.exchangeId, id))

      const [acceptedNeedOffer] = await tx
        .select()
        .from(needOffers)
        .where(
          and(
            eq(needOffers.exchangeId, id),
            eq(needOffers.status, 'accepted'),
          ),
        )
        .limit(1)

      if (acceptedNeedOffer) {
        const [needRow] = await tx
          .select()
          .from(listings)
          .where(eq(listings.id, acceptedNeedOffer.needId))
          .limit(1)

        if (needRow?.type === 'need') {
          const cancelledByHelper = this.currentMemberId === exchangeRow.providerId

          if (cancelledByHelper) {
            const backupOffers = await tx
              .update(needOffers)
              .set({ status: 'offered', updatedAt: now })
              .where(
                and(
                  eq(needOffers.needId, acceptedNeedOffer.needId),
                  eq(needOffers.status, 'declined'),
                ),
              )
              .returning()

            await tx
              .update(needOffers)
              .set({ status: 'withdrawn', updatedAt: now })
              .where(eq(needOffers.id, acceptedNeedOffer.id))

            await tx
              .update(needWindows)
              .set({
                status: backupOffers.length > 0 ? 'offered' : 'open',
                updatedAt: now,
              })
              .where(eq(needWindows.id, acceptedNeedOffer.windowId))

            await tx
              .update(listings)
              .set({
                isActive: true,
                needStatus: backupOffers.length > 0 ? 'offered' : 'live',
                refreshedAt: now,
                expiresAt: getListingExpiresAt(now),
                updatedAt: now,
              })
              .where(eq(listings.id, acceptedNeedOffer.needId))

            const notificationValues: (typeof notifications.$inferInsert)[] = [
              {
                memberId: exchangeRow.requesterId,
                type: 'backup_available',
                priority: 'high',
                title: 'Need reopened',
                body:
                  backupOffers.length > 0
                    ? `${needRow.title} has backup helpers available.`
                    : `${needRow.title} is open again.`,
                targetPath: '/needs',
              },
            ]

            for (const offer of backupOffers) {
              notificationValues.push({
                memberId: offer.helperId,
                type: 'backup_available',
                priority: 'high',
                title: 'Backup spot opened',
                body: `${needRow.title} needs help again.`,
                targetPath: `/needs?category=${needRow.category}`,
              })
            }

            await tx.insert(notifications).values(notificationValues)
            await tx.insert(analyticsEvents).values({
              memberId: this.currentMemberId,
              eventType: 'helper_dropped',
              targetType: 'listing',
              targetId: acceptedNeedOffer.needId,
              metadata: {
                exchangeId: id,
                backupOffers: backupOffers.length,
                ...cancellationMetadata(cancellation),
              },
            })
          } else {
            await tx
              .update(needOffers)
              .set({ status: 'expired', updatedAt: now })
              .where(
                and(
                  eq(needOffers.needId, acceptedNeedOffer.needId),
                  inArray(needOffers.status, ['accepted', 'declined', 'offered']),
                ),
              )

            await tx
              .update(needWindows)
              .set({ status: 'cancelled', updatedAt: now })
              .where(eq(needWindows.needId, acceptedNeedOffer.needId))

            await tx
              .update(listings)
              .set({
                isActive: false,
                needStatus: 'cancelled',
                updatedAt: now,
              })
              .where(eq(listings.id, acceptedNeedOffer.needId))

            await tx.insert(notifications).values({
              memberId: exchangeRow.providerId,
              type: 'backup_available',
              priority: 'normal',
              title: 'Need cancelled',
              body: `${needRow.title} was cancelled by the requester.`,
              targetPath: `/exchange/${id}`,
            })
          }
        }
      }

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'exchange_cancelled',
        targetType: 'exchange',
        targetId: id,
        metadata: {
          listingId: exchangeRow.listingId,
          providerId: exchangeRow.providerId,
          requesterId: exchangeRow.requesterId,
          cancelledBy:
            this.currentMemberId === exchangeRow.providerId
              ? 'provider'
              : 'requester',
          ...cancellationMetadata(cancellation),
        },
      })

      return toExchange(updated)
    })
  }

  async disputeExchange(id: string): Promise<Exchange> {
    if (!this.currentMemberId) await this.initialize()

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, id))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${id} not found`)
    this.assertExchangeParticipant(exchangeRow)

    if (exchangeRow.status === 'disputed') return toExchange(exchangeRow)
    if (!['accepted', 'in_escrow'].includes(exchangeRow.status)) {
      throw new Error(`Cannot dispute an exchange with status '${exchangeRow.status}'`)
    }

    const [updated] = await db
      .update(exchanges)
      .set({ status: 'disputed', updatedAt: new Date() })
      .where(
        and(
          eq(exchanges.id, id),
          inArray(exchanges.status, ['accepted', 'in_escrow']),
        ),
      )
      .returning()

    return toExchange(updated ?? exchangeRow)
  }

  // ---- Bookings -----------------------------------------------------------

  async getAvailability(memberId: string): Promise<AvailabilitySlot[]> {
    const rows = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.memberId, memberId))
      .orderBy(asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime))

    return rows.map(toAvailabilitySlot)
  }

  async addAvailabilitySlot(
    input: CreateAvailabilitySlotInput,
    memberId?: string,
  ): Promise<AvailabilitySlot> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for availability')

    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      throw new Error('Day of week must be between 0 and 6')
    }
    if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) {
      throw new Error('Availability times must use HH:mm format')
    }
    if (input.startTime >= input.endTime) {
      throw new Error('Start time must be before end time')
    }

    const [row] = await db
      .insert(availabilitySlots)
      .values({
        memberId: resolvedMemberId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        isRecurring: input.isRecurring ?? true,
      })
      .returning()

    return toAvailabilitySlot(row)
  }

  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    if (!this.currentMemberId) await this.initialize()
    if (!this.currentMemberId) throw new Error('No current member for availability')

    await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.memberId, this.currentMemberId),
        ),
      )
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    return this.scheduleExchange(input.exchangeId, {
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
    })
  }

  async scheduleExchange(
    exchangeId: string,
    input: ScheduleExchangeInput,
  ): Promise<Booking> {
    if (!this.currentMemberId) await this.initialize()

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, exchangeId))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${exchangeId} not found`)
    this.assertExchangeParticipant(exchangeRow)

    if (['completed', 'cancelled', 'disputed'].includes(exchangeRow.status)) {
      throw new Error(`Cannot schedule an exchange with status '${exchangeRow.status}'`)
    }

    return await db.transaction(async (tx) => {
      const scheduledAt = new Date(`${input.date}T${input.startTime}:00`)
      const bookingDate = new Date(input.date)

      const [updatedExchange] = await tx
        .update(exchanges)
        .set({
          status: 'in_escrow',
          scheduledAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(exchanges.id, exchangeId),
            inArray(exchanges.status, ['requested', 'accepted', 'in_escrow']),
          ),
        )
        .returning()

      if (!updatedExchange) {
        throw new Error('Unable to schedule this exchange')
      }

      const [existingBooking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.exchangeId, exchangeId))
        .limit(1)

      if (existingBooking) {
        const [row] = await tx
          .update(bookings)
          .set({
            date: bookingDate,
            startTime: input.startTime,
            endTime: input.endTime,
            status: 'confirmed',
          })
          .where(eq(bookings.id, existingBooking.id))
          .returning()
        return toBooking(row)
      }

      const [row] = await tx
        .insert(bookings)
        .values({
          exchangeId,
          providerId: exchangeRow.providerId,
          requesterId: exchangeRow.requesterId,
          date: bookingDate,
          startTime: input.startTime,
          endTime: input.endTime,
          status: 'confirmed',
        })
        .returning()

      return toBooking(row)
    })
  }

  // ---- Reviews ------------------------------------------------------------

  async createReview(input: CreateReviewInput): Promise<Review> {
    if (!this.currentMemberId) await this.initialize()

    if (input.tags.length === 0) {
      throw new Error('Select at least one review tag')
    }

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, input.exchangeId))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${input.exchangeId} not found`)
    this.assertExchangeParticipant(exchangeRow)
    if (exchangeRow.status !== 'completed') {
      throw new Error('Reviews can only be left after completion')
    }

    const expectedReviewee =
      this.currentMemberId === exchangeRow.providerId
        ? exchangeRow.requesterId
        : exchangeRow.providerId
    if (input.revieweeId !== expectedReviewee) {
      throw new Error('Reviewee must be the other exchange member')
    }

    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.exchangeId, input.exchangeId),
          eq(reviews.reviewerId, this.currentMemberId),
        ),
      )
      .limit(1)

    if (existingReview) {
      const tagRows = await db
        .select()
        .from(reputationTags)
        .where(eq(reputationTags.reviewId, existingReview.id))
      return toReview(existingReview, tagRows.map((row) => row.tag))
    }

    const [reviewRow] = await db
      .insert(reviews)
      .values({
        exchangeId: input.exchangeId,
        reviewerId: this.currentMemberId,
        revieweeId: input.revieweeId,
        note: input.note ?? null,
      })
      .onConflictDoNothing({
        target: [reviews.exchangeId, reviews.reviewerId],
      })
      .returning()

    if (!reviewRow) {
      const [createdByRace] = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.exchangeId, input.exchangeId),
            eq(reviews.reviewerId, this.currentMemberId),
          ),
        )
        .limit(1)
      if (!createdByRace) throw new Error('Unable to create review')
      return toReview(createdByRace)
    }

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

    return toReview(reviewRow, input.tags)
  }

  // ---- Happenings ---------------------------------------------------------

  async getHappenings(
    input?: HappeningCategory | HappeningFilters,
  ): Promise<Happening[]> {
    const filters = normalizeHappeningFilters(input)
    const { start, end } = getHappeningRange(filters)
    const conditions = [
      gte(happenings.endAt, start),
      lte(happenings.startAt, end),
    ]

    if (filters.category) {
      conditions.push(eq(happenings.category, filters.category))
    }

    const rows = await db
      .select()
      .from(happenings)
      .where(and(...conditions))
      .orderBy(asc(happenings.startAt))
      .limit(filters.limit ?? 100)

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

  async createHappening(input: CreateHappeningInput): Promise<Happening> {
    if (!this.currentMemberId) await this.initialize()

    const title = input.title.trim()
    const description = input.description.trim()
    const location = input.location.trim()
    const imageUrl = input.imageUrl?.trim() || null
    const startAt = new Date(input.startAt)
    const endAt = new Date(input.endAt)

    if (!title) throw new Error('Event title is required')
    if (!description) throw new Error('Event description is required')
    if (!location) throw new Error('Event location is required')
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new Error('Event start and end must be valid dates')
    }
    if (endAt <= startAt) {
      throw new Error('Event end time must be after start time')
    }

    const [row] = await db
      .insert(happenings)
      .values({
        hostId: this.currentMemberId,
        title,
        description,
        category: input.category,
        location,
        latitude:
          input.latitude === null || input.latitude === undefined
            ? null
            : String(input.latitude),
        longitude:
          input.longitude === null || input.longitude === undefined
            ? null
            : String(input.longitude),
        startAt,
        endAt,
        imageUrl,
      })
      .returning()

    const [hostRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, this.currentMemberId))
      .limit(1)

    const happening = toHappening(
      row,
      0,
      0,
      hostRow ? toMember(hostRow) : undefined,
    )
    await this.notifyInterestedMembersForHappening(happening)

    return happening
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

  async getCurrentHappeningRsvp(happeningId: string): Promise<RsvpStatus | null> {
    if (!this.currentMemberId) await this.initialize()

    const [row] = await db
      .select()
      .from(happeningRsvps)
      .where(
        and(
          eq(happeningRsvps.happeningId, happeningId),
          eq(happeningRsvps.memberId, this.currentMemberId),
        ),
      )
      .limit(1)

    return row?.status ?? null
  }

  async rsvpHappening(happeningId: string, status: RsvpStatus): Promise<void> {
    if (!this.currentMemberId) await this.initialize()

    await db.transaction(async (tx) => {
      await tx
        .delete(happeningRsvps)
        .where(
          and(
            eq(happeningRsvps.happeningId, happeningId),
            eq(happeningRsvps.memberId, this.currentMemberId),
          ),
        )

      await tx.insert(happeningRsvps).values({
        happeningId,
        memberId: this.currentMemberId,
        status,
      })

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'event_rsvp',
        targetType: 'happening',
        targetId: happeningId,
        metadata: { status },
      })
    })
  }

  async clearHappeningRsvp(happeningId: string): Promise<void> {
    if (!this.currentMemberId) await this.initialize()

    await db.transaction(async (tx) => {
      await tx
        .delete(happeningRsvps)
        .where(
          and(
            eq(happeningRsvps.happeningId, happeningId),
            eq(happeningRsvps.memberId, this.currentMemberId),
          ),
        )

      await tx.insert(analyticsEvents).values({
        memberId: this.currentMemberId,
        eventType: 'event_rsvp',
        targetType: 'happening',
        targetId: happeningId,
        metadata: { status: null },
      })
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

  // ---- Notifications ------------------------------------------------------

  async getNotifications(
    filters: NotificationFilters = {},
    memberId?: string,
  ): Promise<Notification[]> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for notifications')

    const conditions = [eq(notifications.memberId, resolvedMemberId)]
    if (filters.unreadOnly) conditions.push(isNull(notifications.readAt))

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit ?? 50)

    return rows.map(toNotification)
  }

  async getUnreadNotificationCount(memberId?: string): Promise<number> {
    const targetMemberId = memberId ?? this.currentMemberId
    if (!targetMemberId) await this.initialize()

    const resolvedMemberId = memberId ?? this.currentMemberId
    if (!resolvedMemberId) throw new Error('No current member for notifications')

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.memberId, resolvedMemberId),
          isNull(notifications.readAt),
        ),
      )

    return row?.count ?? 0
  }

  async markNotificationRead(id: string): Promise<void> {
    if (!this.currentMemberId) await this.initialize()
    if (!this.currentMemberId) throw new Error('No current member for notifications')

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.memberId, this.currentMemberId),
        ),
      )
  }

  async markAllNotificationsRead(): Promise<void> {
    if (!this.currentMemberId) await this.initialize()
    if (!this.currentMemberId) throw new Error('No current member for notifications')

    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.memberId, this.currentMemberId),
          isNull(notifications.readAt),
        ),
      )
  }

  async trackAnalyticsEvent(
    input: TrackAnalyticsEventInput,
  ): Promise<AnalyticsEvent> {
    if (input.memberId === undefined && !this.currentMemberId) {
      await this.initialize()
    }

    const [row] = await db
      .insert(analyticsEvents)
      .values({
        memberId:
          input.memberId === undefined
            ? this.currentMemberId || null
            : input.memberId,
        eventType: input.eventType,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: input.metadata ?? {},
      })
      .returning()

    return toAnalyticsEvent(row)
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
      tuEarned: r.tuEarned,
      completedAt: r.completedAt?.toISOString() ?? null,
    }))
  }

  async completeOnboardingStep(
    memberId: string,
    step: OnboardingStep,
  ): Promise<void> {
    const tuReward = ONBOARDING_TU_REWARDS[step]

    // Mark the step complete and record TU earned
    await db
      .update(onboardingProgress)
      .set({ completed: true, completedAt: new Date(), tuEarned: tuReward })
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
        balance: sql`${wallets.balance} + ${tuReward}`,
        totalEarned: sql`${wallets.totalEarned} + ${tuReward}`,
        monthlyEarned: sql`${wallets.monthlyEarned} + ${tuReward}`,
      })
      .where(eq(wallets.id, wallet.id))

    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      type: 'earned',
      amount: tuReward,
      description: `Onboarding: ${ONBOARDING_STEP_LABELS[step]}`,
    })
  }

  // ---- Messages -----------------------------------------------------------

  async startListingConversation(listingId: string): Promise<string> {
    if (!this.currentMemberId) await this.initialize()

    const listing = await this.getListing(listingId)
    if (!listing.isActive || new Date(listing.expiresAt) <= new Date()) {
      throw new Error('This listing is no longer active')
    }
    if (listing.memberId === this.currentMemberId) {
      throw new Error('You cannot respond to your own listing')
    }

    const existingConversationId = await this.findDirectConversationId(
      this.currentMemberId,
      listing.memberId,
    )
    if (existingConversationId) return existingConversationId

    const recipientName = listing.member?.firstName ?? 'there'
    const openingLine =
      listing.type === 'need'
        ? `Hi ${recipientName} - I can help with "${listing.title}". Can we talk through timing, scope, and credits?`
        : `Hi ${recipientName} - I am interested in "${listing.title}". Can we talk through timing, scope, and credits?`

    return await db.transaction(async (tx) => {
      const now = new Date()
      const [conversation] = await tx
        .insert(conversations)
        .values({ exchangeId: null, updatedAt: now })
        .returning()

      await tx.insert(conversationParticipants).values([
        {
          conversationId: conversation.id,
          memberId: this.currentMemberId,
          lastReadAt: now,
        },
        {
          conversationId: conversation.id,
          memberId: listing.memberId,
          lastReadAt: null,
        },
      ])

      await tx.insert(messages).values({
        conversationId: conversation.id,
        senderId: this.currentMemberId,
        content: openingLine,
        createdAt: now,
      })

      return conversation.id
    })
  }

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
        exchangeId: c.exchangeId ?? null,
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
    if (!this.currentMemberId) await this.initialize()

    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.memberId, this.currentMemberId),
        ),
      )
      .limit(1)

    if (!participant) {
      throw new Error('Not authorized to read this conversation')
    }

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

    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, input.conversationId),
          eq(conversationParticipants.memberId, this.currentMemberId),
        ),
      )
      .limit(1)

    if (!participant) {
      throw new Error('Not authorized to send a message in this conversation')
    }

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

  // ---- Stewardship -------------------------------------------------------

  async getStewardDashboard(): Promise<StewardDashboard> {
    const stewardRow = await this.ensureCurrentSteward()
    const currentSteward = toMember(stewardRow)
    const communityId = stewardRow.communityId ?? null
    const now = new Date()
    const staleCutoff = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)

    const [communityRows, memberRows, inviteRows] = await Promise.all([
      communityId
        ? db.select().from(communities).where(eq(communities.id, communityId)).limit(1)
        : Promise.resolve([]),
      communityId
        ? db
            .select()
            .from(members)
            .where(eq(members.communityId, communityId))
            .orderBy(asc(members.createdAt))
        : db.select().from(members).orderBy(asc(members.createdAt)),
      communityId
        ? db
            .select()
            .from(communityInvites)
            .where(eq(communityInvites.communityId, communityId))
            .orderBy(asc(communityInvites.createdAt))
        : db.select().from(communityInvites).orderBy(asc(communityInvites.createdAt)),
    ])

    const scopedMemberIds = memberRows.map((row) => row.id)
    const [listingRows, exchangeRows, happeningRows, flagRows] = await Promise.all([
      communityId
        ? db
            .select({ listing: listings, member: members })
            .from(listings)
            .innerJoin(members, eq(listings.memberId, members.id))
            .where(eq(members.communityId, communityId))
            .orderBy(desc(listings.updatedAt))
        : db
            .select({ listing: listings, member: members })
            .from(listings)
            .innerJoin(members, eq(listings.memberId, members.id))
            .orderBy(desc(listings.updatedAt)),
      scopedMemberIds.length > 0
        ? db
            .select()
            .from(exchanges)
            .where(
              or(
                inArray(exchanges.providerId, scopedMemberIds),
                inArray(exchanges.requesterId, scopedMemberIds),
              )!,
            )
            .orderBy(desc(exchanges.createdAt))
        : Promise.resolve([]),
      scopedMemberIds.length > 0
        ? db
            .select()
            .from(happenings)
            .where(inArray(happenings.hostId, scopedMemberIds))
            .orderBy(asc(happenings.startAt))
        : Promise.resolve([]),
      db
        .select()
        .from(stewardFlags)
        .where(eq(stewardFlags.status, 'open'))
        .orderBy(desc(stewardFlags.createdAt)),
    ])

    const memberMap = new Map(memberRows.map((row) => [row.id, toMember(row)]))
    const listingItems = listingRows.map(({ listing, member }) =>
      toListing(listing, memberMap.get(member.id) ?? toMember(member)),
    )
    const listingMap = new Map(listingItems.map((listing) => [listing.id, listing]))
    const exchangeItems = exchangeRows.map((row) =>
      toExchange(
        row,
        listingMap.get(row.listingId),
        memberMap.get(row.providerId),
        memberMap.get(row.requesterId),
      ),
    )
    const happeningItems = happeningRows.map((row) =>
      toHappening(row, 0, 0, memberMap.get(row.hostId)),
    )
    const needListingIds = listingItems
      .filter((listing) => listing.type === 'need')
      .map((listing) => listing.id)
    const [needOfferRows, preferenceRows, analyticsRows, intentRows] = await Promise.all([
      needListingIds.length > 0
        ? db
            .select()
            .from(needOffers)
            .where(inArray(needOffers.needId, needListingIds))
        : Promise.resolve([]),
      scopedMemberIds.length > 0
        ? db
            .select()
            .from(helperPreferences)
            .where(inArray(helperPreferences.memberId, scopedMemberIds))
        : Promise.resolve([]),
      scopedMemberIds.length > 0
        ? db
            .select()
            .from(analyticsEvents)
            .where(inArray(analyticsEvents.memberId, scopedMemberIds))
            .orderBy(desc(analyticsEvents.createdAt))
        : Promise.resolve([]),
      scopedMemberIds.length > 0
        ? db
            .select()
            .from(memberIntentProfiles)
            .where(inArray(memberIntentProfiles.memberId, scopedMemberIds))
        : Promise.resolve([]),
    ])

    const activeListingItems = listingItems.filter(
      (listing) => listing.isActive && new Date(listing.expiresAt) > now,
    )
    const allStaleListings = listingItems.filter(
      (listing) =>
        listing.isActive &&
        (new Date(listing.expiresAt) <= now ||
          new Date(listing.refreshedAt) <= staleCutoff),
    )
    const staleListings = allStaleListings.slice(0, 12)
    const allStaleHappenings = happeningItems.filter(
      (happening) => new Date(happening.endAt) < now,
    )
    const staleHappenings = allStaleHappenings.slice(0, 8)
    const allDisputes = exchangeItems.filter(
      (exchange) => exchange.status === 'disputed',
    )
    const disputes = allDisputes.slice(0, 12)

    const needs = activeListingItems.filter((listing) => listing.type === 'need')
    const offers = activeListingItems.filter((listing) => listing.type === 'offering')
    const activeNeedIds = new Set(needs.map((need) => need.id))
    const offerCountsByNeed = new Map<string, number>()
    for (const row of needOfferRows) {
      if (!activeNeedIds.has(row.needId)) continue
      offerCountsByNeed.set(row.needId, (offerCountsByNeed.get(row.needId) ?? 0) + 1)
    }
    const allUrgentNeeds = needs.filter((need) => need.isUrgent)
    const urgentNeeds = allUrgentNeeds.slice(0, 8)
    const allNeedsWithoutOffers = needs.filter(
      (need) => !offerCountsByNeed.has(need.id),
    )
    const needsWithoutOffers = allNeedsWithoutOffers.slice(0, 8)
    const categorySignals = [...LISTING_CATEGORY_VALUES]
      .map((category) => {
        const listingCategory = category as ListingCategory
        const categoryNeeds = needs.filter(
          (need) => need.category === listingCategory,
        ).length
        const categoryOffers = offers.filter(
          (offer) => offer.category === listingCategory,
        ).length
        return {
          category: listingCategory,
          needs: categoryNeeds,
          offers: categoryOffers,
          gap: Math.max(categoryNeeds - categoryOffers, 0),
        }
      })
      .filter((signal) => signal.needs > 0 || signal.offers > 0)
      .sort((a, b) => b.gap - a.gap || b.needs - a.needs)
      .slice(0, 8)
    const intentSignals = [...LISTING_CATEGORY_VALUES]
      .map((category) => {
        const listingCategory = category as ListingCategory
        const canHelp = intentRows.filter((row) =>
          (row.canHelpCategories as string[]).includes(category),
        ).length
        const mayNeed = intentRows.filter((row) =>
          (row.needsHelpCategories as string[]).includes(category),
        ).length
        return {
          category: listingCategory,
          canHelp,
          mayNeed,
          gap: Math.max(mayNeed - canHelp, 0),
        }
      })
      .filter((signal) => signal.canHelp > 0 || signal.mayNeed > 0)
      .sort((a, b) => b.gap - a.gap || b.mayNeed - a.mayNeed)
      .slice(0, 8)
    const happeningInterestSignals = [...HAPPENING_CATEGORY_VALUES]
      .map((category) => {
        const happeningCategory = category as HappeningCategory
        const interestedMembers = intentRows.filter((row) =>
          (row.happeningInterests as string[]).includes(category),
        ).length
        return { category: happeningCategory, interestedMembers }
      })
      .filter((signal) => signal.interestedMembers > 0)
      .sort((a, b) => b.interestedMembers - a.interestedMembers)
      .slice(0, 8)
    const analyticsCounts = [
      ...analyticsRows.reduce((counts, row) => {
        const eventType = row.eventType as AnalyticsEventType
        counts.set(eventType, (counts.get(eventType) ?? 0) + 1)
        return counts
      }, new Map<AnalyticsEventType, number>()),
    ]
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
    const helperDropExchangeIds = new Set(
      analyticsRows
        .filter((row) => row.eventType === 'helper_dropped')
        .map((row) => (row.metadata as Record<string, unknown>).exchangeId)
        .filter((exchangeId): exchangeId is string => typeof exchangeId === 'string'),
    )
    const cancellationSignals = [
      ...analyticsRows.reduce((signals, row) => {
        const eventType = row.eventType as AnalyticsEventType
        const memberId = row.memberId
        const member = memberId ? memberMap.get(memberId) : undefined
        if (!memberId || !member) return signals

        const metadata = row.metadata as Record<string, unknown>
        const cancelledBy =
          typeof metadata.cancelledBy === 'string' ? metadata.cancelledBy : null
        const reason =
          typeof metadata.reason === 'string' ? metadata.reason : null

        const isHelperDrop =
          eventType === 'helper_dropped' ||
          (eventType === 'exchange_cancelled' &&
            cancelledBy === 'provider' &&
            !helperDropExchangeIds.has(row.targetId ?? ''))
        const isOfferWithdrawal = eventType === 'offer_withdrawn'
        const isRequesterCancellation =
          eventType === 'need_cancelled' ||
          (eventType === 'exchange_cancelled' && cancelledBy === 'requester')

        if (!isHelperDrop && !isOfferWithdrawal && !isRequesterCancellation) {
          return signals
        }

        const existing =
          signals.get(memberId) ?? {
            member,
            total: 0,
            helperDrops: 0,
            offerWithdrawals: 0,
            requesterCancellations: 0,
            lastReason: null as string | null,
            lastAt: row.createdAt.toISOString(),
          }

        existing.total += 1
        if (isHelperDrop) existing.helperDrops += 1
        if (isOfferWithdrawal) existing.offerWithdrawals += 1
        if (isRequesterCancellation) existing.requesterCancellations += 1
        if (!existing.lastReason && reason) existing.lastReason = reason
        if (new Date(existing.lastAt) < row.createdAt) {
          existing.lastAt = row.createdAt.toISOString()
          existing.lastReason = reason
        }

        signals.set(memberId, existing)
        return signals
      }, new Map<string, {
        member: Member
        total: number
        helperDrops: number
        offerWithdrawals: number
        requesterCancellations: number
        lastReason: string | null
        lastAt: string
      }>()),
    ]
      .map(([, signal]) => signal)
      .sort(
        (a, b) =>
          b.total - a.total ||
          new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
      )
      .slice(0, 8)
    const activationFunnel = [
      { label: 'Joined', count: memberRows.length },
      { label: 'Active members', count: memberRows.filter((row) => row.status === 'active').length },
      { label: 'Intent profiles', count: new Set(intentRows.map((row) => row.memberId)).size },
      { label: 'Helper preferences', count: new Set(preferenceRows.map((row) => row.memberId)).size },
      { label: 'Posted a need', count: new Set(needs.map((need) => need.memberId)).size },
      { label: 'Offered help', count: new Set(needOfferRows.map((row) => row.helperId)).size },
      { label: 'Accepted offers', count: needOfferRows.filter((row) => row.status === 'accepted').length },
      { label: 'Completed exchanges', count: exchangeRows.filter((row) => row.status === 'completed').length },
    ]
    const matchAssists = needs
      .map((need) => {
        const matches = offers
          .filter(
            (offer) =>
              offer.memberId !== need.memberId &&
              (offer.category === need.category ||
                Math.abs(offer.creditPrice - need.creditPrice) <= 3),
          )
          .map((offer) => this.scoreStewardMatch(need, offer))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        return { need, matches }
      })
      .filter((assist) => assist.matches.length > 0)
      .slice(0, 6)

    const resolveFlagTarget = (flag: typeof stewardFlags.$inferSelect) => {
      if (flag.targetType === 'member') {
        const member = memberMap.get(flag.targetId)
        return {
          label: member ? `${member.firstName} ${member.lastName}` : 'Member',
          href: `/member/${flag.targetId}`,
          inScope: !communityId || Boolean(member),
        }
      }
      if (flag.targetType === 'listing') {
        const listing = listingMap.get(flag.targetId)
        return {
          label: listing?.title ?? 'Listing',
          href: `/listing/${flag.targetId}`,
          inScope: !communityId || Boolean(listing),
        }
      }
      if (flag.targetType === 'exchange') {
        const exchange = exchangeItems.find((item) => item.id === flag.targetId)
        return {
          label: exchange?.listing?.title
            ? `Exchange: ${exchange.listing.title}`
            : 'Exchange',
          href: `/exchange/${flag.targetId}`,
          inScope: !communityId || Boolean(exchange),
        }
      }
      const happening = happeningItems.find((item) => item.id === flag.targetId)
      return {
        label: happening?.title ?? 'Happening',
        href: `/happenings/${flag.targetId}`,
        inScope: !communityId || Boolean(happening),
      }
    }

    const openFlags = flagRows
      .map((flag) => {
        const target = resolveFlagTarget(flag)
        if (!target.inScope) return null
        return toStewardFlag(
          flag,
          target.label,
          target.href,
          flag.createdById ? memberMap.get(flag.createdById) : undefined,
        )
      })
      .filter((flag): flag is StewardFlag => flag !== null)

    return {
      currentSteward,
      community: communityRows[0] ? toCommunity(communityRows[0]) : null,
      metrics: {
        activeMembers: memberRows.filter((row) => row.status === 'active').length,
        pendingMembers: memberRows.filter((row) => row.status === 'pending').length,
        pausedMembers: memberRows.filter((row) => row.status === 'paused').length,
        activeNeeds: needs.length,
        activeOffers: offers.length,
        urgentNeeds: allUrgentNeeds.length,
        needsWithoutOffers: allNeedsWithoutOffers.length,
        activeExchanges: exchangeRows.filter((row) =>
          ['requested', 'accepted', 'in_escrow'].includes(row.status),
        ).length,
        disputedExchanges: allDisputes.length,
        staleListings: allStaleListings.length,
        staleHappenings: allStaleHappenings.length,
        openFlags: openFlags.length,
        inviteUses: inviteRows.reduce((sum, row) => sum + row.usageCount, 0),
      },
      pendingMembers: memberRows
        .filter((row) => row.status === 'pending')
        .map(toMember),
      pausedMembers: memberRows
        .filter((row) => row.status === 'paused')
        .map(toMember),
      invites: inviteRows.map(toCommunityInvite),
      disputes,
      urgentNeeds,
      needsWithoutOffers,
      categorySignals,
      intentSignals,
      happeningInterestSignals,
      activationFunnel,
      analyticsCounts,
      cancellationSignals,
      staleListings,
      staleHappenings,
      matchAssists,
      openFlags,
    }
  }

  async setMemberStatusAsSteward(
    memberId: string,
    status: MemberStatus,
  ): Promise<Member> {
    const stewardRow = await this.ensureCurrentSteward()
    if (!['pending', 'active', 'paused'].includes(status)) {
      throw new Error('Invalid member status')
    }
    if (memberId === stewardRow.id && status !== 'active') {
      throw new Error('A steward cannot pause their own account')
    }

    const [target] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1)

    if (!target) throw new Error(`Member ${memberId} not found`)
    this.assertStewardCommunityScope(stewardRow, target.communityId, 'member')

    const [row] = await db
      .update(members)
      .set({
        status,
        reviewedAt: status === 'pending' ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning()

    return toMember(row)
  }

  async archiveListingAsSteward(listingId: string): Promise<Listing> {
    const stewardRow = await this.ensureCurrentSteward()
    const [target] = await db
      .select({ listing: listings, member: members })
      .from(listings)
      .innerJoin(members, eq(listings.memberId, members.id))
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!target) throw new Error(`Listing ${listingId} not found`)
    this.assertStewardCommunityScope(stewardRow, target.member.communityId, 'listing')

    const [row] = await db
      .update(listings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(listings.id, listingId))
      .returning()

    return toListing(row, toMember(target.member))
  }

  async refreshListingAsSteward(listingId: string): Promise<Listing> {
    const stewardRow = await this.ensureCurrentSteward()
    const [target] = await db
      .select({ listing: listings, member: members })
      .from(listings)
      .innerJoin(members, eq(listings.memberId, members.id))
      .where(eq(listings.id, listingId))
      .limit(1)

    if (!target) throw new Error(`Listing ${listingId} not found`)
    this.assertStewardCommunityScope(stewardRow, target.member.communityId, 'listing')

    const now = new Date()
    const [row] = await db
      .update(listings)
      .set({
        isActive: true,
        refreshedAt: now,
        expiresAt: getListingExpiresAt(now),
        updatedAt: now,
      })
      .where(eq(listings.id, listingId))
      .returning()

    return toListing(row, toMember(target.member))
  }

  async deletePastHappeningAsSteward(happeningId: string): Promise<void> {
    const stewardRow = await this.ensureCurrentSteward()
    const [target] = await db
      .select({ happening: happenings, host: members })
      .from(happenings)
      .innerJoin(members, eq(happenings.hostId, members.id))
      .where(eq(happenings.id, happeningId))
      .limit(1)

    if (!target) throw new Error(`Happening ${happeningId} not found`)
    this.assertStewardCommunityScope(stewardRow, target.host.communityId, 'happening')
    if (target.happening.endAt > new Date()) {
      throw new Error('Only past happenings can be removed from the cleanup queue')
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(happeningRsvps)
        .where(eq(happeningRsvps.happeningId, happeningId))
      await tx.delete(happenings).where(eq(happenings.id, happeningId))
    })
  }

  async createStewardFlagAsSteward(
    targetType: StewardFlagTarget,
    targetId: string,
    reason: string,
  ): Promise<StewardFlag> {
    const stewardRow = await this.ensureCurrentSteward()
    const trimmedReason = reason.trim()
    if (trimmedReason.length < 3) throw new Error('Flag reason is required')

    const [row] = await db
      .insert(stewardFlags)
      .values({
        targetType,
        targetId,
        reason: trimmedReason,
        createdById: stewardRow.id,
      })
      .returning()

    return toStewardFlag(row, targetType, null, toMember(stewardRow))
  }

  async resolveStewardFlag(flagId: string): Promise<StewardFlag> {
    const stewardRow = await this.ensureCurrentSteward()
    const [existing] = await db
      .select()
      .from(stewardFlags)
      .where(eq(stewardFlags.id, flagId))
      .limit(1)

    if (!existing) throw new Error(`Flag ${flagId} not found`)
    if (existing.status === 'resolved') {
      return toStewardFlag(existing, existing.targetType, null)
    }

    const [row] = await db
      .update(stewardFlags)
      .set({
        status: 'resolved',
        resolvedById: stewardRow.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stewardFlags.id, flagId))
      .returning()

    return toStewardFlag(row, row.targetType, null, toMember(stewardRow))
  }

  async resolveDisputeAsSteward(
    exchangeId: string,
    outcome: 'refund' | 'release',
  ): Promise<Exchange> {
    const stewardRow = await this.ensureCurrentSteward()
    if (!['refund', 'release'].includes(outcome)) {
      throw new Error('Invalid dispute outcome')
    }

    const [exchangeRow] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, exchangeId))
      .limit(1)

    if (!exchangeRow) throw new Error(`Exchange ${exchangeId} not found`)

    const participantRows = await db
      .select()
      .from(members)
      .where(inArray(members.id, [exchangeRow.providerId, exchangeRow.requesterId]))
    if (stewardRow.communityId) {
      const isInScope = participantRows.some(
        (participant) => participant.communityId === stewardRow.communityId,
      )
      if (!isInScope) throw new Error('Not authorized to manage this exchange')
    }

    if (exchangeRow.status === 'completed' || exchangeRow.status === 'cancelled') {
      return toExchange(exchangeRow)
    }
    if (exchangeRow.status !== 'disputed') {
      throw new Error(`Cannot resolve an exchange with status '${exchangeRow.status}'`)
    }

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(exchanges)
        .set({
          status: outcome === 'release' ? 'completed' : 'cancelled',
          completedAt: outcome === 'release' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(exchanges.id, exchangeId), eq(exchanges.status, 'disputed')))
        .returning()

      if (!updated) {
        const [current] = await tx
          .select()
          .from(exchanges)
          .where(eq(exchanges.id, exchangeId))
          .limit(1)
        if (current?.status === 'completed' || current?.status === 'cancelled') {
          return toExchange(current)
        }
        throw new Error(`Cannot resolve an exchange with status '${current?.status}'`)
      }

      const [providerWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, exchangeRow.providerId))
        .limit(1)
      const [requesterWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.memberId, exchangeRow.requesterId))
        .limit(1)

      if (!requesterWallet) {
        throw new Error(`Wallet not found for requester ${exchangeRow.requesterId}`)
      }

      const [hold] = await tx
        .select()
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.exchangeId, exchangeId),
            eq(walletTransactions.walletId, requesterWallet.id),
            eq(walletTransactions.type, 'escrow_hold'),
          ),
        )
        .limit(1)

      if (outcome === 'release') {
        if (!providerWallet) {
          throw new Error(`Wallet not found for provider ${exchangeRow.providerId}`)
        }
        if (!hold) throw new Error('Cannot release credits without an escrow hold')

        await this.applyLedgerOperation(tx, {
          walletId: providerWallet.id,
          type: 'escrow_release',
          amount: exchangeRow.tuAmount,
          description: 'Credits released by steward dispute resolution',
          exchangeId,
          operationKey: this.ledgerOperationKey(exchangeId, providerWallet.id, 'release'),
        })
        await this.applyLedgerOperation(tx, {
          walletId: requesterWallet.id,
          type: 'spent',
          amount: exchangeRow.tuAmount,
          description: 'Held credits spent after steward dispute resolution',
          exchangeId,
          operationKey: this.ledgerOperationKey(exchangeId, requesterWallet.id, 'spent'),
        })
      }

      if (outcome === 'refund' && hold) {
        await this.applyLedgerOperation(tx, {
          walletId: requesterWallet.id,
          type: 'escrow_return',
          amount: exchangeRow.tuAmount,
          description: 'Held credits returned by steward dispute resolution',
          exchangeId,
          operationKey: this.ledgerOperationKey(exchangeId, requesterWallet.id, 'return'),
        })
      }

      return toExchange(updated)
    })
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

  private async ensureCurrentSteward(): Promise<typeof members.$inferSelect> {
    if (!this.currentMemberId) await this.initialize()

    const [row] = await db
      .select()
      .from(members)
      .where(eq(members.id, this.currentMemberId))
      .limit(1)

    if (!row) throw new Error(`Member ${this.currentMemberId} not found`)
    if (!row.isSteward) throw new Error('Steward access required')

    return row
  }

  private assertStewardCommunityScope(
    stewardRow: typeof members.$inferSelect,
    targetCommunityId: string | null,
    targetName: string,
  ): void {
    if (stewardRow.communityId && targetCommunityId !== stewardRow.communityId) {
      throw new Error(`Not authorized to manage this ${targetName}`)
    }
  }

  private scoreStewardMatch(
    need: Listing,
    offer: Listing,
  ): SuggestedListingMatch {
    const reasons: string[] = []
    let score = 0

    if (need.category === offer.category) {
      score += 45
      reasons.push('Same category')
    }
    if (need.member?.communityId && offer.member?.communityId === need.member.communityId) {
      score += 25
      reasons.push('Same community')
    }
    if (
      need.creditPrice === 0 ||
      offer.creditPrice === 0 ||
      Math.abs(offer.creditPrice - need.creditPrice) <= 3
    ) {
      score += 20
      reasons.push('Compatible credits')
    }
    if (offer.member?.isAvailable) {
      score += 10
      reasons.push('Member available')
    }

    return { listing: offer, score, reasons }
  }

  private assertExchangeParticipant(row: typeof exchanges.$inferSelect): void {
    if (
      row.providerId !== this.currentMemberId &&
      row.requesterId !== this.currentMemberId
    ) {
      throw new Error('Not authorized to view this exchange')
    }
  }

  private assertExchangeProvider(row: typeof exchanges.$inferSelect): void {
    if (row.providerId !== this.currentMemberId) {
      throw new Error('Only the provider can accept this exchange')
    }
  }

  private ledgerOperationKey(
    exchangeId: string,
    walletId: string,
    operation: 'hold' | 'release' | 'spent' | 'return',
  ): string {
    return `${exchangeId}:${walletId}:${operation}`
  }

  private async applyLedgerOperation(
    tx: any,
    input: {
      walletId: string
      type: 'escrow_hold' | 'escrow_release' | 'spent' | 'escrow_return'
      amount: number
      description: string
      exchangeId: string
      operationKey: string
    },
  ): Promise<boolean> {
    const [operation] = await tx
      .insert(walletTransactions)
      .values({
        walletId: input.walletId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        exchangeId: input.exchangeId,
        operationKey: input.operationKey,
      })
      .onConflictDoNothing({ target: walletTransactions.operationKey })
      .returning()

    if (!operation) return false

    if (input.type === 'escrow_hold') {
      const [updated] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${input.amount}`,
          escrowHeld: sql`${wallets.escrowHeld} + ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.id, input.walletId), gte(wallets.balance, input.amount)))
        .returning()

      if (!updated) throw new Error('Insufficient credits for this exchange')
    }

    if (input.type === 'escrow_release') {
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${input.amount}`,
          totalEarned: sql`${wallets.totalEarned} + ${input.amount}`,
          monthlyEarned: sql`${wallets.monthlyEarned} + ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, input.walletId))
    }

    if (input.type === 'spent') {
      const [updated] = await tx
        .update(wallets)
        .set({
          escrowHeld: sql`${wallets.escrowHeld} - ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.id, input.walletId), gte(wallets.escrowHeld, input.amount)))
        .returning()

      if (!updated) throw new Error('Held credits are not available for release')
    }

    if (input.type === 'escrow_return') {
      const [updated] = await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${input.amount}`,
          escrowHeld: sql`${wallets.escrowHeld} - ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.id, input.walletId), gte(wallets.escrowHeld, input.amount)))
        .returning()

      if (!updated) throw new Error('Held credits are not available to return')
    }

    return true
  }

  private async getOrCreateExchangeConversation(
    exchangeRow: typeof exchanges.$inferSelect,
  ): Promise<Conversation> {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.exchangeId, exchangeRow.id))
      .limit(1)

    if (existing) {
      await this.ensureConversationParticipants(existing.id, exchangeRow)
      return this.hydrateConversation(existing.id)
    }

    const conversationId = await db.transaction(async (tx) => {
      const now = new Date()
      const [conversation] = await tx
        .insert(conversations)
        .values({ exchangeId: exchangeRow.id, updatedAt: now })
        .onConflictDoNothing({ target: conversations.exchangeId })
        .returning()

      if (!conversation) {
        const [createdByRace] = await tx
          .select()
          .from(conversations)
          .where(eq(conversations.exchangeId, exchangeRow.id))
          .limit(1)
        if (!createdByRace) throw new Error('Unable to create exchange conversation')
        return createdByRace.id
      }

      await tx
        .insert(conversationParticipants)
        .values([
          {
            conversationId: conversation.id,
            memberId: exchangeRow.providerId,
            lastReadAt: null,
          },
          {
            conversationId: conversation.id,
            memberId: exchangeRow.requesterId,
            lastReadAt: null,
          },
        ])
        .onConflictDoNothing({
          target: [
            conversationParticipants.conversationId,
            conversationParticipants.memberId,
          ],
        })

      return conversation.id
    })

    await this.ensureConversationParticipants(conversationId, exchangeRow)
    return this.hydrateConversation(conversationId)
  }

  private async ensureConversationParticipants(
    conversationId: string,
    exchangeRow: typeof exchanges.$inferSelect,
  ): Promise<void> {
    await db
      .insert(conversationParticipants)
      .values([
        {
          conversationId,
          memberId: exchangeRow.providerId,
          lastReadAt: null,
        },
        {
          conversationId,
          memberId: exchangeRow.requesterId,
          lastReadAt: null,
        },
      ])
      .onConflictDoNothing({
        target: [
          conversationParticipants.conversationId,
          conversationParticipants.memberId,
        ],
      })
  }

  private async hydrateConversation(conversationId: string): Promise<Conversation> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    if (!conversation) throw new Error(`Conversation ${conversationId} not found`)

    const participantRows = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId))

    const memberIds = participantRows.map((row) => row.memberId)
    const memberRows =
      memberIds.length > 0
        ? await db
            .select()
            .from(members)
            .where(inArray(members.id, memberIds))
        : []
    const memberMap = new Map(memberRows.map((row) => [row.id, toMember(row)]))

    return {
      id: conversation.id,
      exchangeId: conversation.exchangeId ?? null,
      participants: participantRows.map((row) => ({
        memberId: row.memberId,
        member: memberMap.get(row.memberId),
        lastReadAt: row.lastReadAt?.toISOString() ?? null,
      })),
      updatedAt: conversation.updatedAt.toISOString(),
    }
  }

  private async findDirectConversationId(
    memberIdA: string,
    memberIdB: string,
  ): Promise<string | null> {
    const matchingParticipantRows = await db
      .select({
        conversationId: conversationParticipants.conversationId,
      })
      .from(conversationParticipants)
      .where(
        or(
          eq(conversationParticipants.memberId, memberIdA),
          eq(conversationParticipants.memberId, memberIdB),
        )!,
      )

    const candidateIds = [
      ...new Set(matchingParticipantRows.map((row) => row.conversationId)),
    ]
    if (candidateIds.length === 0) return null

    const directConversationRows = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, candidateIds))
    const directConversationIds = new Set(
      directConversationRows
        .filter((conversation) => conversation.exchangeId === null)
        .map((conversation) => conversation.id),
    )
    if (directConversationIds.size === 0) return null

    const participantRows = await db
      .select({
        conversationId: conversationParticipants.conversationId,
        memberId: conversationParticipants.memberId,
      })
      .from(conversationParticipants)
      .where(
        or(
          ...[...directConversationIds].map((conversationId) =>
            eq(conversationParticipants.conversationId, conversationId),
          ),
        )!,
      )

    const conversationMembers = new Map<string, Set<string>>()
    for (const row of participantRows) {
      const membersForConversation =
        conversationMembers.get(row.conversationId) ?? new Set<string>()
      membersForConversation.add(row.memberId)
      conversationMembers.set(row.conversationId, membersForConversation)
    }

    for (const [conversationId, memberIds] of conversationMembers.entries()) {
      if (
        memberIds.size === 2 &&
        memberIds.has(memberIdA) &&
        memberIds.has(memberIdB)
      ) {
        return conversationId
      }
    }

    return null
  }

  private async notifyMatchingHelpersForNeed(need: Listing): Promise<void> {
    if (need.type !== 'need') return

    const [requesterRow] = await db
      .select()
      .from(members)
      .where(eq(members.id, need.memberId))
      .limit(1)
    if (!requesterRow) return

    const preferenceRows = await db
      .select()
      .from(helperPreferences)
      .where(ne(helperPreferences.memberId, need.memberId))

    if (preferenceRows.length === 0) return

    const helperMemberIds = preferenceRows.map((row) => row.memberId)
    const helperRows = await db
      .select()
      .from(members)
      .where(inArray(members.id, helperMemberIds))

    const now = new Date()
    const dailyCutoff = new Date(now.getTime() - DAY_IN_MS)
    const weeklyCutoff = new Date(now.getTime() - WEEK_IN_MS)
    const recentNotificationRows = await db
      .select({
        memberId: notifications.memberId,
        type: notifications.type,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          inArray(notifications.memberId, helperMemberIds),
          inArray(notifications.type, ['matched_need', 'urgent_need']),
          gte(notifications.createdAt, weeklyCutoff),
        ),
      )

    const dailyMatchedCounts = new Map<string, number>()
    const weeklyMatchedCounts = new Map<string, number>()
    for (const row of recentNotificationRows) {
      if (row.type !== 'matched_need') continue

      weeklyMatchedCounts.set(
        row.memberId,
        (weeklyMatchedCounts.get(row.memberId) ?? 0) + 1,
      )

      if (row.createdAt >= dailyCutoff) {
        dailyMatchedCounts.set(
          row.memberId,
          (dailyMatchedCounts.get(row.memberId) ?? 0) + 1,
        )
      }
    }

    const requester = toMember(requesterRow)
    const helperMap = new Map(
      helperRows.map((row) => [row.id, toMember(row)]),
    )
    const priority = need.isUrgent ? 'urgent' : 'normal'
    const type = need.isUrgent ? 'urgent_need' : 'matched_need'
    const values: (typeof notifications.$inferInsert)[] = []

    for (const row of preferenceRows) {
      const prefs = toHelperPreferences(row)
      const helper = helperMap.get(prefs.memberId)
      if (!helper || helper.status !== 'active') continue
      if (prefs.digestFrequency === 'off') continue
      if (prefs.categories.length > 0 && !prefs.categories.includes(need.category)) {
        continue
      }
      if (prefs.urgentOnly && !need.isUrgent) continue
      if (getDistanceMiles(requester, helper) > prefs.radiusMiles) continue

      const isQuiet = isWithinQuietHours(
        now,
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
      )

      if (!need.isUrgent) {
        const shouldBatch =
          prefs.digestFrequency === 'daily' ||
          prefs.digestFrequency === 'weekly' ||
          isQuiet

        if (shouldBatch) {
          const existingDigestCount =
            prefs.digestFrequency === 'weekly'
              ? weeklyMatchedCounts.get(prefs.memberId) ?? 0
              : dailyMatchedCounts.get(prefs.memberId) ?? 0
          if (existingDigestCount > 0) continue

          const isWeekly = prefs.digestFrequency === 'weekly'
          values.push({
            memberId: prefs.memberId,
            type,
            priority,
            title: isWeekly
              ? 'Weekly need matches'
              : isQuiet
                ? 'Need matches waiting for later'
                : 'Daily need matches',
            body: `${requester.firstName} posted ${need.title}. More matching needs may be batched here.`,
            targetPath: `/needs?category=${need.category}`,
          })

          dailyMatchedCounts.set(
            prefs.memberId,
            (dailyMatchedCounts.get(prefs.memberId) ?? 0) + 1,
          )
          weeklyMatchedCounts.set(
            prefs.memberId,
            (weeklyMatchedCounts.get(prefs.memberId) ?? 0) + 1,
          )
          continue
        }

        const dailyCount = dailyMatchedCounts.get(prefs.memberId) ?? 0
        if (dailyCount >= NON_URGENT_MATCH_NOTIFICATION_CAP_PER_DAY) {
          continue
        }
        dailyMatchedCounts.set(prefs.memberId, dailyCount + 1)
      }

      values.push({
        memberId: prefs.memberId,
        type,
        priority,
        title: need.isUrgent
          ? 'Urgent need nearby'
          : 'New need matches your skills',
        body: `${requester.firstName} posted: ${need.title}`,
        targetPath: `/needs?category=${need.category}${
          need.isUrgent ? '&urgent=1' : ''
        }`,
      })
    }

    if (values.length > 0) {
      await db.insert(notifications).values(values)
    }
  }

  private async notifyInterestedMembersForHappening(
    happening: Happening,
  ): Promise<void> {
    const intentRows = await db
      .select()
      .from(memberIntentProfiles)
      .where(ne(memberIntentProfiles.memberId, happening.hostId))

    if (intentRows.length === 0) return

    const memberIds = intentRows.map((row) => row.memberId)
    const memberRows = await db
      .select()
      .from(members)
      .where(inArray(members.id, memberIds))
    const activeMemberIds = new Set(
      memberRows.filter((row) => row.status === 'active').map((row) => row.id),
    )

    const now = new Date()
    const dailyCutoff = new Date(now.getTime() - DAY_IN_MS)
    const weeklyCutoff = new Date(now.getTime() - WEEK_IN_MS)
    const recentNotificationRows = await db
      .select({
        memberId: notifications.memberId,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          inArray(notifications.memberId, memberIds),
          eq(notifications.type, 'event_match'),
          gte(notifications.createdAt, weeklyCutoff),
        ),
      )

    const dailyCounts = new Map<string, number>()
    const weeklyCounts = new Map<string, number>()
    for (const row of recentNotificationRows) {
      weeklyCounts.set(row.memberId, (weeklyCounts.get(row.memberId) ?? 0) + 1)
      if (row.createdAt >= dailyCutoff) {
        dailyCounts.set(row.memberId, (dailyCounts.get(row.memberId) ?? 0) + 1)
      }
    }

    const values: (typeof notifications.$inferInsert)[] = []
    for (const row of intentRows) {
      if (!activeMemberIds.has(row.memberId)) continue
      const profile = toMemberIntentProfile(row)
      if (profile.notificationFrequency === 'off') continue
      if (!profile.happeningInterests.includes(happening.category)) continue

      if (profile.notificationFrequency === 'weekly') {
        const count = weeklyCounts.get(row.memberId) ?? 0
        if (count > 0) continue
        weeklyCounts.set(row.memberId, count + 1)
      } else {
        const count = dailyCounts.get(row.memberId) ?? 0
        const cap =
          profile.notificationFrequency === 'daily'
            ? 1
            : NON_URGENT_MATCH_NOTIFICATION_CAP_PER_DAY
        if (count >= cap) continue
        dailyCounts.set(row.memberId, count + 1)
      }

      values.push({
        memberId: row.memberId,
        type: 'event_match',
        priority: 'normal',
        title: 'Happening matches your interests',
        body: `${formatHappeningCategory(happening.category)}: ${happening.title}`,
        targetPath: `/happenings/${happening.id}`,
      })
    }

    if (values.length > 0) {
      await db.insert(notifications).values(values)
    }
  }

  /**
   * Hydrate a raw member row into a full MemberWithDetails — loads listings,
   * reputation tags, wallet, and computes trust score.
   */
  private async hydrateMember(
    row: typeof members.$inferSelect,
    includeExpiredListings = false,
  ): Promise<MemberWithDetails> {
    const member = toMember(row)
    const listingConditions = [
      eq(listings.memberId, row.id),
      eq(listings.isActive, true),
      ...(includeExpiredListings ? [] : [gt(listings.expiresAt, new Date())]),
    ]

    // Load listings, wallet, exchanges, and reputation tags in parallel
    const [listingRows, walletRow, exchangeRows, tagRows, businessProfileRows] =
      await Promise.all([
      db
        .select()
        .from(listings)
        .where(and(...listingConditions)),
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
      row.membershipType === 'business'
        ? db
            .select()
            .from(businessProfiles)
            .where(eq(businessProfiles.memberId, row.id))
            .limit(1)
        : Promise.resolve([]),
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
      businessProfile: businessProfileRows[0]
        ? toBusinessProfile(businessProfileRows[0])
        : null,
    }
  }
}

/** Singleton instance — import this in components and stores. */
export const exchangeEngine = new ExchangeEngineClient()
