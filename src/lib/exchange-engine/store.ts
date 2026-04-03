// ---------------------------------------------------------------------------
// Exchange Engine — Zustand Store
// ---------------------------------------------------------------------------
// Wraps the ExchangeEngineClient with reactive state so React components can
// subscribe to data changes without managing async loading themselves.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { exchangeEngine } from './client'

import type {
  MemberWithDetails,
  Wallet,
  Member,
  Happening,
  ActivityFeedItem,
  TreasuryInfo,
  SearchResult,
  SearchFilters,
  RsvpStatus,
} from './types'

interface ExchangeStore {
  // State
  initialized: boolean
  currentMember: MemberWithDetails | null
  wallet: Wallet | null
  members: Member[]
  happenings: Happening[]
  activityFeed: ActivityFeedItem[]
  treasury: TreasuryInfo | null
  searchResults: SearchResult | null
  isLoading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  search: (query: string, filters?: SearchFilters) => Promise<void>
  clearSearch: () => void
  rsvpHappening: (id: string, status: RsvpStatus) => Promise<void>
  refreshWallet: () => Promise<void>
  refreshFeed: () => Promise<void>
  refreshHappenings: () => Promise<void>
  refreshMembers: () => Promise<void>
}

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  // ---- Initial state ------------------------------------------------------
  initialized: false,
  currentMember: null,
  wallet: null,
  members: [],
  happenings: [],
  activityFeed: [],
  treasury: null,
  searchResults: null,
  isLoading: false,
  error: null,

  // ---- Actions ------------------------------------------------------------

  /**
   * Bootstrap the store: initialise the engine client, then load all primary
   * data in parallel. Call this once at app mount.
   */
  initialize: async () => {
    if (get().initialized) return

    set({ isLoading: true, error: null })

    try {
      await exchangeEngine.initialize()

      const [currentMember, allMembers, happeningsList, feed, treasuryInfo] =
        await Promise.all([
          exchangeEngine.getCurrentMember(),
          exchangeEngine.getMembers(),
          exchangeEngine.getHappenings(),
          exchangeEngine.getActivityFeed(),
          exchangeEngine.getTreasury(),
        ])

      set({
        initialized: true,
        currentMember,
        wallet: currentMember.wallet,
        members: allMembers,
        happenings: happeningsList,
        activityFeed: feed.items,
        treasury: treasuryInfo,
        isLoading: false,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize'
      set({ isLoading: false, error: message })
      console.error('[ExchangeStore] initialize failed:', err)
    }
  },

  /**
   * Person-first search. Results are split into shopLocal (business members)
   * and neighbors (everyone else).
   */
  search: async (query: string, filters?: SearchFilters) => {
    set({ isLoading: true, error: null })

    try {
      const results = await exchangeEngine.search(query, filters)
      set({ searchResults: results, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      set({ isLoading: false, error: message })
      console.error('[ExchangeStore] search failed:', err)
    }
  },

  clearSearch: () => {
    set({ searchResults: null })
  },

  /** RSVP to a happening, then refresh the happenings list. */
  rsvpHappening: async (id: string, status: RsvpStatus) => {
    try {
      await exchangeEngine.rsvpHappening(id, status)
      const happeningsList = await exchangeEngine.getHappenings()
      set({ happenings: happeningsList })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'RSVP failed'
      set({ error: message })
      console.error('[ExchangeStore] rsvpHappening failed:', err)
    }
  },

  /** Reload the current member's wallet. */
  refreshWallet: async () => {
    const { currentMember } = get()
    if (!currentMember) return

    try {
      const wallet = await exchangeEngine.getWallet(currentMember.id)
      set({ wallet })
    } catch (err) {
      console.error('[ExchangeStore] refreshWallet failed:', err)
    }
  },

  /** Reload the activity feed. */
  refreshFeed: async () => {
    try {
      const feed = await exchangeEngine.getActivityFeed()
      set({ activityFeed: feed.items })
    } catch (err) {
      console.error('[ExchangeStore] refreshFeed failed:', err)
    }
  },

  /** Reload the happenings list. */
  refreshHappenings: async () => {
    try {
      const happeningsList = await exchangeEngine.getHappenings()
      set({ happenings: happeningsList })
    } catch (err) {
      console.error('[ExchangeStore] refreshHappenings failed:', err)
    }
  },

  /** Reload the members list. */
  refreshMembers: async () => {
    try {
      const allMembers = await exchangeEngine.getMembers()
      set({ members: allMembers })
    } catch (err) {
      console.error('[ExchangeStore] refreshMembers failed:', err)
    }
  },
}))
