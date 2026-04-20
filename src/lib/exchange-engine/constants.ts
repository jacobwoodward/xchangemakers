// ---------------------------------------------------------------------------
// Exchange Engine — Pure Constants
// ---------------------------------------------------------------------------
// These have no dependencies on the database client or Drizzle, so they are
// safe to import from client components without pulling the postgres driver
// into the browser bundle.
// ---------------------------------------------------------------------------

import type { OnboardingStep } from './types'

/**
 * TU rewards per onboarding step. 1 TU ≈ 1 hour of community time.
 * Total starter grant across all 8 steps = 12 TU.
 */
export const ONBOARDING_TU_REWARDS: Record<OnboardingStep, number> = {
  profile_photo: 1,
  intro_vibe: 1,
  add_offerings: 2,
  post_need: 1,
  rsvp_happening: 1,
  first_exchange: 2,
  first_review: 1,
  invite_neighbor: 3,
}

/** Sum of all onboarding TU rewards, used for progress UI. */
export const TOTAL_ONBOARDING_TU = Object.values(ONBOARDING_TU_REWARDS).reduce(
  (sum, n) => sum + n,
  0,
)

/** Human-readable labels for wallet transaction descriptions. */
export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  profile_photo: 'Add a photo',
  intro_vibe: 'Set your vibe',
  add_offerings: 'Add offerings',
  post_need: 'Post a need',
  rsvp_happening: 'RSVP to a happening',
  first_exchange: 'Complete first exchange',
  first_review: 'Leave first review',
  invite_neighbor: 'Invite a neighbor',
}
