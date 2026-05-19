// ---------------------------------------------------------------------------
// Exchange Engine — Application Types
// ---------------------------------------------------------------------------
// These are the clean, flat types that components consume. They decouple the
// UI from the underlying Drizzle schema so the data layer can be swapped for
// HTTP API calls when the shared microservice is built.
// ---------------------------------------------------------------------------

// ---- Enums (string unions mirroring DB enums) -----------------------------

export type MembershipType = 'standard' | 'business' | 'community_contribution'

export type MemberStatus = 'pending' | 'active' | 'paused'

export type ListingType = 'offering' | 'need'

export type ListingCategory =
  | 'food'
  | 'services'
  | 'skills'
  | 'classes'
  | 'handmade'
  | 'wellness'
  | 'tech'
  | 'home'
  | 'kids'
  | 'other'

export type BusinessCategory =
  | 'food_drink'
  | 'home_services'
  | 'health_wellness'
  | 'shopping_makers'
  | 'garden_outdoors'
  | 'moving_help'
  | 'professional'
  | 'other'

export type ExchangeStatus =
  | 'requested'
  | 'accepted'
  | 'in_escrow'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export type HappeningCategory =
  | 'kids'
  | 'food'
  | 'markets'
  | 'fitness'
  | 'classes'
  | 'social'
  | 'community'
  | 'exchange_event'

export type RsvpStatus = 'going' | 'interested'

export type ReputationTagType =
  | 'on_time'
  | 'quality'
  | 'friendly'
  | 'generous'
  | 'reliable'
  | 'great_communicator'

export type ActivityType =
  | 'new_listing'
  | 'new_member'
  | 'exchange_completed'
  | 'happening_posted'
  | 'treasury_milestone'
  | 'weekly_stats'

export type NotificationType =
  | 'matched_need'
  | 'urgent_need'
  | 'offer_received'
  | 'offer_accepted'
  | 'backup_available'
  | 'event_match'
  | 'schedule_reminder'
  | 'completion_prompt'

export type NotificationPriority = 'normal' | 'high' | 'urgent'

export type AnalyticsEventType =
  | 'need_posted'
  | 'need_viewed'
  | 'filter_applied'
  | 'helper_offer_submitted'
  | 'offer_accepted'
  | 'exchange_completed'
  | 'helper_dropped'
  | 'offer_withdrawn'
  | 'need_cancelled'
  | 'exchange_cancelled'
  | 'need_reposted'
  | 'event_rsvp'
  | 'business_fallback_clicked'

export type TransactionType =
  | 'earned'
  | 'spent'
  | 'escrow_hold'
  | 'escrow_release'
  | 'escrow_return'

export type CommunityTier = 'starting' | 'active' | 'established' | 'strong'

export type OnboardingStep =
  | 'profile_photo'
  | 'intro_vibe'
  | 'add_offerings'
  | 'post_need'
  | 'rsvp_happening'
  | 'first_exchange'
  | 'first_review'
  | 'invite_neighbor'

export type AvailabilityType = 'ongoing' | 'one_time' | 'event_only'

export type NeedStatus =
  | 'draft'
  | 'live'
  | 'offered'
  | 'assigned'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'reposted'
  | 'expired'

export type NeedWindowStatus =
  | 'open'
  | 'offered'
  | 'assigned'
  | 'completed'
  | 'cancelled'
  | 'expired'

export type NeedOfferStatus =
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired'

export type HelperDigestFrequency = 'immediate' | 'daily' | 'weekly' | 'off'

export type IntentNotificationFrequency = HelperDigestFrequency

export type CancellationReason =
  | 'schedule_conflict'
  | 'no_longer_needed'
  | 'helper_drop'
  | 'requester_cancel'
  | 'safety_concern'
  | 'other'

export type StewardFlagTarget = 'member' | 'listing' | 'exchange' | 'happening'

export type StewardFlagStatus = 'open' | 'resolved'

// ---- Core types -----------------------------------------------------------

/**
 * A community member. The fundamental identity in the Exchange Engine.
 * Every person in the network has a Member record.
 */
export interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  vibe: string | null
  communityId: string | null
  neighborhood: string
  latitude: number
  longitude: number
  isAvailable: boolean
  availabilityNote: string | null
  membershipType: MembershipType
  status: MemberStatus
  isSteward: boolean
  reviewedAt: string | null
  joinedAt: string
}

/** Local community used for membership, invites, and stewardship scope. */
export interface Community {
  id: string
  name: string
  slug: string
  city: string
  region: string
  postalCode: string | null
  status: string
  inviteOnly: boolean
}

/** Invite code and usage limits for a community. */
export interface CommunityInvite {
  id: string
  communityId: string
  code: string
  label: string
  maxUses: number | null
  usageCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * A member with all their associated data hydrated — listings, reputation,
 * wallet, and computed trust score. Used on profile pages and search results.
 */
export interface MemberWithDetails extends Member {
  offerings: Listing[]
  needs: Listing[]
  reputationTags: ReputationTagCount[]
  wallet: Wallet
  trustScore: number
  businessProfile?: BusinessProfile | null
}

/**
 * A member's Time Unit (TU) wallet. 1 TU ≈ 1 hour of community time.
 * Tracks balance, lifetime earnings, monthly earnings, and funds held in escrow.
 */
export interface Wallet {
  id: string
  memberId: string
  balance: number
  totalEarned: number
  monthlyEarned: number
  escrowHeld: number
}

/** A single credit/debit entry in a member's wallet ledger. */
export interface WalletTransaction {
  id: string
  walletId: string
  type: TransactionType
  amount: number
  description: string
  exchangeId: string | null
  operationKey?: string | null
  createdAt: string
}

/**
 * A listing represents something a member offers or needs. Listings are the
 * primary unit of exchange — they drive search, matching, and transactions.
 */
export interface Listing {
  id: string
  memberId: string
  type: ListingType
  title: string
  description: string
  category: ListingCategory
  creditPrice: number
  availabilityType: AvailabilityType
  needStatus: NeedStatus | null
  publicLocationLabel: string | null
  exactLocation: string | null
  isLocationPrivate: boolean
  isUrgent: boolean
  recurringNote: string | null
  imageUrls: string[]
  isActive: boolean
  refreshedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  member?: Member
}

/** A concrete time window when a need can be filled. */
export interface NeedWindow {
  id: string
  needId: string
  startsAt: string
  endsAt: string
  label: string | null
  isFlexible: boolean
  status: NeedWindowStatus
  createdAt: string
  updatedAt: string
}

/** A helper's offer to fill a timed need. */
export interface NeedOffer {
  id: string
  needId: string
  windowId: string
  helperId: string
  message: string | null
  status: NeedOfferStatus
  exchangeId: string | null
  createdAt: string
  updatedAt: string
  helper?: Member
}

/** A member's categories/radius preferences for being shown needs. */
export interface HelperPreferences {
  id: string
  memberId: string
  categories: ListingCategory[]
  radiusMiles: number
  urgentOnly: boolean
  digestFrequency: HelperDigestFrequency
  quietHoursStart: string | null
  quietHoursEnd: string | null
  createdAt: string
  updatedAt: string
}

/** Onboarding preference capture for needs, help capacity, happenings, and alerts. */
export interface MemberIntentProfile {
  id: string
  memberId: string
  canHelpCategories: ListingCategory[]
  needsHelpCategories: ListingCategory[]
  happeningInterests: HappeningCategory[]
  radiusMiles: number
  notificationFrequency: IntentNotificationFrequency
  shareAvailability: boolean
  createdAt: string
  updatedAt: string
}

/** Calendar-ready timed need view. */
export interface TimedNeed {
  listing: Listing
  requester: Member
  windows: NeedWindow[]
  offers: NeedOffer[]
  currentMemberOffer: NeedOffer | null
  distanceMiles: number | null
  isOwnedByCurrentMember: boolean
}

/** Extended local business profile attached to a business member. */
export interface BusinessProfile {
  id: string
  memberId: string
  businessName: string
  categories: BusinessCategory[]
  address: string
  serviceArea: string | null
  phone: string | null
  websiteUrl: string | null
  directionsUrl: string | null
  hours: Record<string, string>
  photoUrls: string[]
  contributionNotes: string | null
  contributionBadges: string[]
  communityHoursContributed: number
  rating: number
  reviewCount: number
  isCommunityFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface LocalBusiness {
  profile: BusinessProfile
  member: MemberWithDetails
  offerings: Listing[]
  distanceMiles: number | null
}

/**
 * An exchange is a transaction between two members — a requester asks a
 * provider for something, TUs move through escrow, and both parties review.
 */
export interface Exchange {
  id: string
  listingId: string
  providerId: string
  requesterId: string
  status: ExchangeStatus
  tuAmount: number
  scheduledAt: string | null
  completedAt: string | null
  createdAt: string
  listing?: Listing
  provider?: Member
  requester?: Member
}

/** A scheduled time block for an exchange. */
export interface Booking {
  id: string
  exchangeId: string
  providerId: string
  requesterId: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  createdAt: string
}

export type ExchangeRole = 'provider' | 'requester'

/** The single source of truth for an exchange room. */
export interface ExchangeRoom {
  exchange: Exchange
  currentMember: Member
  counterparty: Member
  currentRole: ExchangeRole
  booking: Booking | null
  conversation: Conversation
  messages: Message[]
  reviews: Review[]
  currentMemberReview: Review | null
  counterpartyReview: Review | null
  ledger: WalletTransaction[]
  can: {
    accept: boolean
    schedule: boolean
    complete: boolean
    cancel: boolean
    dispute: boolean
    review: boolean
  }
}

/** Shared queue item for steward review. */
export interface StewardFlag {
  id: string
  targetType: StewardFlagTarget
  targetId: string
  targetLabel: string
  targetHref: string | null
  reason: string
  status: StewardFlagStatus
  createdById: string | null
  createdBy?: Member
  resolvedById: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

/** A need and the nearby offers a steward can use to seed a match. */
export interface StewardMatchAssist {
  need: Listing
  matches: SuggestedListingMatch[]
}

export interface StewardCategorySignal {
  category: ListingCategory
  needs: number
  offers: number
  gap: number
}

export interface StewardIntentSignal {
  category: ListingCategory
  canHelp: number
  mayNeed: number
  gap: number
}

export interface StewardHappeningInterestSignal {
  category: HappeningCategory
  interestedMembers: number
}

export interface StewardActivationMetric {
  label: string
  count: number
}

export interface StewardEventCount {
  eventType: AnalyticsEventType
  count: number
}

export interface StewardCancellationSignal {
  member: Member
  total: number
  helperDrops: number
  offerWithdrawals: number
  requesterCancellations: number
  lastReason: CancellationReason | string | null
  lastAt: string
}

/** Operator view for keeping one community trusted, active, and current. */
export interface StewardDashboard {
  currentSteward: Member
  community: Community | null
  metrics: {
    activeMembers: number
    pendingMembers: number
    pausedMembers: number
    activeNeeds: number
    activeOffers: number
    urgentNeeds: number
    needsWithoutOffers: number
    activeExchanges: number
    disputedExchanges: number
    staleListings: number
    staleHappenings: number
    openFlags: number
    inviteUses: number
  }
  pendingMembers: Member[]
  pausedMembers: Member[]
  invites: CommunityInvite[]
  disputes: Exchange[]
  urgentNeeds: Listing[]
  needsWithoutOffers: Listing[]
  categorySignals: StewardCategorySignal[]
  intentSignals: StewardIntentSignal[]
  happeningInterestSignals: StewardHappeningInterestSignal[]
  activationFunnel: StewardActivationMetric[]
  analyticsCounts: StewardEventCount[]
  cancellationSignals: StewardCancellationSignal[]
  staleListings: Listing[]
  staleHappenings: Happening[]
  matchAssists: StewardMatchAssist[]
  openFlags: StewardFlag[]
}

/** A recurring or one-time time slot when a member is available. */
export interface AvailabilitySlot {
  id: string
  memberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
}

export interface CreateAvailabilitySlotInput {
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring?: boolean
}

/** A post-exchange review left by one member about another. */
export interface Review {
  id: string
  exchangeId: string
  reviewerId: string
  revieweeId: string
  note: string | null
  tags: ReputationTagType[]
  createdAt: string
}

/** Aggregated count of a specific reputation tag for a member. */
export interface ReputationTagCount {
  tag: ReputationTagType
  count: number
}

/**
 * A community happening — an event, market, class, or gathering that members
 * can RSVP to. Happenings build social fabric alongside exchanges.
 */
export interface Happening {
  id: string
  hostId: string
  title: string
  description: string
  category: HappeningCategory
  location: string
  latitude: number | null
  longitude: number | null
  startAt: string
  endAt: string
  imageUrl: string | null
  goingCount: number
  interestedCount: number
  host?: Member
}

/** A member's RSVP to a happening. */
export interface HappeningRsvp {
  id: string
  happeningId: string
  memberId: string
  status: RsvpStatus
  createdAt: string
}

/** A single entry in the community activity feed. */
export interface ActivityFeedItem {
  id: string
  type: ActivityType
  data: Record<string, unknown>
  createdAt: string
}

/** A member-specific in-app alert that should lead to a concrete action. */
export interface Notification {
  id: string
  memberId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  body: string
  targetPath: string
  readAt: string | null
  createdAt: string
}

export interface NotificationFilters {
  unreadOnly?: boolean
  limit?: number
}

export interface AnalyticsEvent {
  id: string
  memberId: string | null
  eventType: AnalyticsEventType
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

/**
 * The community treasury — tracks collective TU balance, community tier, and
 * aggregate exchange statistics. One record per community.
 */
export interface TreasuryInfo {
  id: string
  communityName: string
  balance: number
  tier: CommunityTier
  exchangesThisWeek: number
  totalExchanges: number
  totalMembers: number
}

/** A member's progress on a single onboarding step in the Trail. */
export interface OnboardingProgress {
  id: string
  memberId: string
  step: OnboardingStep
  completed: boolean
  tuEarned: number
  completedAt: string | null
}

/** Static info about a membership tier — pricing, features, requirements. */
export interface MembershipTierInfo {
  type: MembershipType
  name: string
  annualCost: number
  treasuryContribution: number
  hoursRequired: number | null
  features: string[]
}

/** A conversation thread between two or more members. */
export interface Conversation {
  id: string
  exchangeId: string | null
  participants: ConversationParticipant[]
  lastMessage?: Message
  updatedAt: string
}

/** A member's participation record in a conversation. */
export interface ConversationParticipant {
  memberId: string
  member?: Member
  lastReadAt: string | null
}

/** A single message within a conversation. */
export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

// ---- Search ---------------------------------------------------------------

/** Filters for searching listings and members. */
export interface SearchFilters {
  query?: string
  category?: ListingCategory
  radius?: number
  type?: ListingType
}

export type MarketplaceDistanceScope = 'community' | 'nearby' | 'all'
export type MarketplaceSort = 'newest' | 'credits_low' | 'credits_high'

export interface MarketplaceListingFilters extends SearchFilters {
  availabilityType?: AvailabilityType
  minCredits?: number
  maxCredits?: number
  trustedOnly?: boolean
  distance?: MarketplaceDistanceScope
  sort?: MarketplaceSort
  excludeCurrentMember?: boolean
  limit?: number
}

export interface SuggestedListingMatch {
  listing: Listing
  score: number
  reasons: string[]
}

/**
 * Person-first search results. `shopLocal` contains business members whose
 * listings match; `neighbors` contains standard/community members.
 */
export interface SearchResult {
  shopLocal: MemberWithDetails[]
  neighbors: MemberWithDetails[]
}

// ---- Input types for mutations --------------------------------------------

export interface CreateListingInput {
  type: ListingType
  title: string
  description: string
  category: ListingCategory
  creditPrice: number
  availabilityType?: AvailabilityType
  imageUrls?: string[]
  needStatus?: NeedStatus | null
  publicLocationLabel?: string | null
  exactLocation?: string | null
  isLocationPrivate?: boolean
  isUrgent?: boolean
  recurringNote?: string | null
  windows?: CreateNeedWindowInput[]
}

export interface CreateExchangeInput {
  listingId: string
  providerId: string
  tuAmount: number
  scheduledAt?: string
  idempotencyKey?: string
}

export interface CreateBookingInput {
  exchangeId: string
  providerId: string
  date: string
  startTime: string
  endTime: string
}

export interface ScheduleExchangeInput {
  date: string
  startTime: string
  endTime: string
}

export interface CreateReviewInput {
  exchangeId: string
  revieweeId: string
  note?: string
  tags: ReputationTagType[]
}

export interface SendMessageInput {
  conversationId: string
  content: string
}

export interface TimedNeedFilters {
  category?: ListingCategory
  timeframe?: 'today' | 'week' | 'month'
  urgentOnly?: boolean
  distance?: MarketplaceDistanceScope
  includeOwn?: boolean
  limit?: number
}

export interface HappeningFilters {
  category?: HappeningCategory
  timeframe?: 'week' | 'month'
  day?: string
  limit?: number
}

export interface LocalBusinessFilters {
  category?: BusinessCategory
  listingCategory?: ListingCategory
  query?: string
  limit?: number
}

export interface CreateHappeningInput {
  title: string
  description: string
  category: HappeningCategory
  location: string
  startAt: string
  endAt: string
  imageUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface OfferNeedHelpInput {
  needId: string
  windowId: string
  message?: string
}

export interface CreateNeedWindowInput {
  id?: string | null
  startsAt: string
  endsAt: string
  label?: string | null
  isFlexible?: boolean
}

export interface UpdateHelperPreferencesInput {
  categories?: ListingCategory[]
  radiusMiles?: number
  urgentOnly?: boolean
  digestFrequency?: HelperDigestFrequency
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

export interface UpdateMemberIntentProfileInput {
  canHelpCategories?: ListingCategory[]
  needsHelpCategories?: ListingCategory[]
  happeningInterests?: HappeningCategory[]
  radiusMiles?: number
  notificationFrequency?: IntentNotificationFrequency
  shareAvailability?: boolean
}

export interface TrackAnalyticsEventInput {
  eventType: AnalyticsEventType
  memberId?: string | null
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown>
}

export interface CancellationInput {
  reason?: CancellationReason | null
  note?: string | null
}
