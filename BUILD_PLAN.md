# xChangeMakers Rebuild Plan

## Purpose

xChangeMakers should become a trusted neighborhood exchange network, not a generic barter app and not a dashboard for an abstract currency system.

The product should help a person answer one practical question:

> I need help, I have something to offer, and I want a fair, trusted way to exchange with people near me.

The existing app already proves that a marketplace, wallet, booking, message, review, event, and treasury model can exist. The rebuild should make those capabilities feel obvious, useful, and trustworthy to a real member.

## Progress Tracker

- Phase 1: Implemented. The app now presents a neighborhood exchange product with Needs, Offers, Exchanges, Messages, and Me as the primary navigation.
- Phase 2: In progress. Account tables, password auth, HTTP-only sessions, sign-in, sign-up, sign-out, protected app routes, session-derived current member resolution, persisted profile edits, community selection, invite codes, auth/community smoke coverage, and browser validation for sign-in/sign-up are implemented.
- Remaining Phase 2 hardening: add deeper server-action tests for duplicate signup, invite exhaustion, expired invites, and multi-user data separation.
- Phase 3: In progress. Needs/offers boards now share marketplace filters, publish flows redirect to suggested matches, and browser smoke coverage verifies filtering plus post-need-to-matches.
- Remaining Phase 3 hardening: add direct conversation creation for responding to needs, richer guided creation prompts, and real listing expiration/refresh state beyond the current stale-listing badge.

## Product Thesis

The app succeeds only if it creates repeat local exchange behavior. The main loop is:

1. A member posts a need or finds an offer.
2. The app creates a warm, high-trust match.
3. The members agree on time, scope, and credit cost.
4. Credits are held or tracked while the exchange happens.
5. Both members close the exchange, build reputation, and see new opportunities.

Everything outside this loop is secondary until this loop is working.

## Product Principles

- Lead with the user's job, not the system model.
- Make the first successful action possible in under five minutes.
- Show concrete local activity, not generic social feed noise.
- Separate exchange credits from any cash-funded community fund.
- Make trust visible before asking a member to meet or spend credits.
- Prefer guided matching over empty marketplace browsing during early community growth.
- Keep the backend exchange engine reusable, but do not let backend abstractions dictate the user experience.

## Current Problems To Correct

- Identity is mocked. The current member is always the first seeded member.
- The first-run flow is not real. Signup, sign-in, membership selection, and profile setup do not persist a real account.
- The currency model is confused. The UI mixes Time Units, hours, wallet credits, dollar-denominated treasury progress, and membership funds.
- The home screen is a system dashboard instead of an action dashboard.
- Search is person-first after listing match, which hides the actual need or offer a user wants.
- Happenings, activity, treasury, and shop-local surfaces compete with the core exchange loop.
- Onboarding can mark steps complete without making the member actually complete the action.
- Some deployed content appears stale, which makes the community feel inactive.

## Reimagined Information Architecture

Primary mobile navigation:

- Needs: requests from neighbors, plus a fast "post a need" path.
- Offers: available help, goods, lessons, services, and local businesses.
- Exchanges: active bookings, pending requests, escrow/status, and completion.
- Messages: conversations tied to exchanges and member outreach.
- Me: profile, trust, credits, listings, availability, account.

Secondary destinations:

- Community: exchange events, community fund, member milestones, local stewardship.
- Invite: bring in a trusted neighbor or business.
- Admin or Steward Console: review members, seed matches, resolve disputes, maintain community health.

## Core User Flows

### 1. New Member Activation

Goal: help a new member get one meaningful match quickly.

Flow:

1. Choose community or accept invite.
2. Create account.
3. Tell the app one thing they need.
4. Tell the app one thing they can offer.
5. Choose availability.
6. See initial matches.
7. Send or receive the first exchange request.

Do not start by explaining every platform feature.

### 2. Post A Need

Goal: make asking for help easy and socially comfortable.

Flow:

1. Choose category.
2. Describe the outcome needed.
3. Choose urgency and preferred times.
4. Pick suggested credit range or "help me price this."
5. Publish to the local needs board.
6. Suggest members who may be able to help.

### 3. Offer Help

Goal: make supply visible without making members build a storefront.

Flow:

1. Pick what they can help with.
2. Add scope and boundaries.
3. Set availability.
4. Choose credit range.
5. Publish offer.
6. Match to open needs immediately.

### 4. Exchange Room

Goal: one place to manage the entire transaction.

Room contents:

- Member names and trust signals.
- Need or offer summary.
- Agreed scope.
- Credit amount.
- Schedule.
- Message thread.
- Status timeline.
- Complete, cancel, dispute, and review actions.

### 5. Community Exchange Events

Goal: build density and trust in early markets.

Events should not be generic happenings. They should be operational tools:

- Repair day.
- Skill swap night.
- New-member orientation.
- Neighborhood needs board session.
- Local business exchange day.

## Currency And Fund Model

Rename the member-facing exchange unit to one clear concept. Recommended:

- Use `Credits` in the UI.
- Internally keep `TU` only if needed for ledger compatibility.
- Explain the rule as: "Credits help keep exchanges fair. Most one-hour exchanges start around 1 credit, but members can agree on a different amount."

Avoid hard claims that every credit equals exactly one hour if the marketplace includes goods, classes, professional services, and local businesses.

Separate these concepts:

- Member credits: earned and spent through exchanges.
- Held credits: credits reserved for an active exchange.
- Community fund: cash or treasury balance funded by memberships, grants, or sponsors.

The treasury should be reintroduced only after the core exchange loop is working.

## UX Direction

Visual personality:

- Local, warm, practical, trusted.
- Less abstract dashboard, more living neighborhood board.
- Use real member/listing content and clear next actions.
- Avoid decorative feature explanations inside the app.

Home should answer:

- What needs my attention?
- What can I do now?
- Where can I get or give help?
- Is this community active?

Search should become browse plus intent:

- "I need help with..."
- "I can offer..."
- "Open needs near me"
- "Available this week"
- "Trusted by neighbors"

Profile should answer:

- Can I trust this person?
- What do they offer?
- What do they need?
- Are they available?
- How do I start a safe exchange?

## Technical Architecture Direction

Keep the existing ExchangeEngine boundary, but make the frontend consume product-oriented methods instead of database-shaped methods over time.

Near-term:

- Preserve Next.js App Router structure.
- Keep server components for data-heavy pages.
- Keep client components only for interactive filters, forms, and optimistic actions.
- Avoid a large rewrite before the first product slice is visible.

Required backend evolution:

- Real auth and current-user resolution.
- Community membership and invitation model.
- Durable member onboarding state.
- Needs and offers as first-class entities or clear listing types.
- Exchange room data shape.
- Ledger integrity checks.
- Real RSVP attendee records.
- Admin/steward controls.

Future reusable backend:

- API routes or separate service for members, listings, matches, exchanges, ledger, messages, reviews, and community fund.
- Strong authorization at every mutation.
- Idempotent ledger operations.
- Audit log for credit movement and disputes.
- Webhook/integration-ready exchange state machine.

## Build Phases

### Phase 1: Product Reset In The Existing App

Goal: make the prototype communicate the right product.

Tasks:

- Document this plan.
- Reframe nav around Needs, Offers, Exchanges, Messages, Me.
- Rebuild home as an action dashboard.
- Update copy from "barter/currency app" to "trusted neighborhood exchange network."
- Clarify Credits vs Community Fund language.
- Remove or demote generic activity and treasury prominence.
- Make search/listing/profile CTAs point toward needs/offers/exchanges.
- Replace dead-end sign-in and fake completion affordances with honest coming-soon or real routes.

Definition of done:

- A reviewer can understand the intended product from the first screen.
- A new member sees one obvious thing to do next.
- The app no longer foregrounds confusing currency/treasury language.

### Phase 2: Real Account Foundation

Goal: stop pretending every visitor is Lauren.

Tasks:

- Add authentication provider.
- Create member records on signup.
- Resolve current member from session.
- Add community invite or community selection.
- Persist profile edits.
- Protect app routes.
- Add sign-in and sign-out.

Definition of done:

- Two different users can sign in and see different profiles, wallets, messages, listings, and exchanges.

### Phase 3: Needs And Offers Marketplace

Goal: make the core marketplace useful before adding advanced features.

Tasks:

- Treat needs and offers as equally important.
- Add needs board.
- Add offer catalog.
- Add clear filters: category, distance, availability, credit range, trusted members.
- Add guided creation flows for needs/offers.
- Add suggested matches after publish.
- Add stale listing expiration or refresh prompts.

Definition of done:

- A member can post a need, see matching offers, and contact or request help.
- A member can post an offer and see matching open needs.

### Phase 4: Exchange Room And Ledger Integrity

Goal: make each exchange feel safe and clear.

Tasks:

- Build exchange room.
- Unify booking, messaging, status, completion, and review.
- Add explicit exchange state machine.
- Add credit hold/release/return operations with idempotency.
- Add cancellation and dispute paths.
- Show both members the same source of truth.

Definition of done:

- Members can request, schedule, complete, and review an exchange without leaving the exchange room.
- Ledger operations cannot double-charge or double-pay.

### Phase 5: Community Stewardship

Goal: make early communities succeed operationally.

Tasks:

- Add steward/admin console.
- Add member approval and invite tracking.
- Add match assistance.
- Add flagged content and dispute review.
- Add stale event/listing cleanup.
- Add community health metrics.

Definition of done:

- A community operator can keep the marketplace active, trusted, and current.

### Phase 6: Community Fund And Governance

Goal: reintroduce the treasury only when it has a clear role.

Tasks:

- Rename treasury to Community Fund if it represents cash.
- Separate fund accounting from member credits.
- Add fund source explanations.
- Add proposal and voting flows.
- Add public fund activity and decisions.

Definition of done:

- Members can understand what money is in the fund, where it came from, and how decisions are made.

### Phase 7: Reusable Exchange Engine

Goal: make the backend reusable for other platforms after the product loop is proven.

Tasks:

- Stabilize API contracts.
- Add integration auth.
- Add webhooks.
- Add audit logs.
- Add service-level tests.
- Document integration examples.

Definition of done:

- Another frontend can safely create members, post needs/offers, create exchanges, and receive exchange status updates.

## Immediate Engineering Slice

Start with Phase 1 because it improves product clarity without waiting on auth or a new database model.

Initial changes:

1. Add this build plan.
2. Reframe the bottom navigation.
3. Rework the home screen hierarchy toward action-oriented exchange behavior.
4. Adjust first-run and onboarding language so it does not overpromise fake signup or fake completion.
5. Run typecheck and build.

## Open Decisions

- Final name for the exchange unit: Credits, Time Credits, Energy Credits, or keep TU.
- Whether businesses can charge many credits or should be handled as a separate local-business directory.
- Whether the first launch community is invite-only.
- Which auth provider to use.
- Whether the reusable engine remains inside this Next app initially or moves to a separate service.
- What level of manual steward involvement is acceptable during the first community launch.

## Non-Goals For The First Slice

- Do not rebuild the database schema yet.
- Do not add auth until the product reset is visible.
- Do not build the full API platform before proving the exchange loop.
- Do not make treasury/fund mechanics more prominent until the core exchange loop is understandable.
