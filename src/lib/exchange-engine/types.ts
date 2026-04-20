// ---------------------------------------------------------------------------
// Exchange Engine — Application Types
// ---------------------------------------------------------------------------
// These are the clean, flat types that components consume. They decouple the
// UI from the underlying Drizzle schema so the data layer can be swapped for
// HTTP API calls when the shared microservice is built.
// ---------------------------------------------------------------------------

// ---- Enums (string unions mirroring DB enums) -----------------------------

export type MembershipType = 'standard' | 'business' | 'community_contribution'

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
  neighborhood: string
  latitude: number
  longitude: number
  isAvailable: boolean
  availabilityNote: string | null
  membershipType: MembershipType
  joinedAt: string
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
  imageUrls: string[]
  isActive: boolean
  createdAt: string
  member?: Member
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

/** A recurring or one-time time slot when a member is available. */
export interface AvailabilitySlot {
  id: string
  memberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
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
}

export interface CreateExchangeInput {
  listingId: string
  providerId: string
  tuAmount: number
  scheduledAt?: string
}

export interface CreateBookingInput {
  exchangeId: string
  providerId: string
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
