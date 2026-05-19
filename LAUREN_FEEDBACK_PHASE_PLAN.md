# Lauren Feedback Phase Plan

## Inputs Reviewed

- Meeting transcript: `C:\Users\jacob\Desktop\Meeting Title lauren.txt`
- Mockups:
  - Mobile happenings and filter/detail/create screens
  - Needs calendar with helper availability and skill toggles
  - Shop Local discovery, business profile, map/list, and local fallback sheets
- Current repo shape:
  - Auth, members, communities, listings, exchanges, bookings, messages, happenings, wallets, and steward tools already exist.
  - Listings currently model needs/offers, but timing is coarse: `ongoing`, `one_time`, or `event_only`.
  - Bookings already support scheduled exchanges after a match.
  - There is no first-class timed need lifecycle, helper application/offer queue, alert system, or shop-local directory route.

## Product Direction

Lauren's feedback changes the center of gravity from "browse a marketplace" to "see timed neighbor needs I can act on now."

The core loop should become:

1. A neighbor posts a concrete need with time windows and enough details to reduce back-and-forth.
2. Nearby members whose skills, radius, and preferences match are prompted to help.
3. Helpers can say "I can help" for a specific time.
4. The requester chooses a helper if there are multiple offers.
5. The accepted offer becomes an exchange with schedule, messages, credits, completion, cancellation, and review.
6. If the helper drops, the need can be reopened or offered to backup helpers.

Happenings and Shop Local should remain important, but their job is to make the product feel like a living community instead of another gig app. They should not replace the timed-needs action loop.

## Recommended Information Architecture

For the next mobile prototype, use this structure:

- `Pulse`: personal action dashboard. Urgent alerts, nearby matches, unfinished exchanges, and community highlights.
- `Calendar`: the main working surface. Defaults to timed neighborhood needs, with a toggle for `Needs Calendar` and `Happenings`.
- Center create button: opens a create sheet with `Post a Need`, `Create an Event`, `Start a Group / Club`, and later `List an Item or Service`.
- `Exchange`: active offers, accepted exchanges, messages tied to exchange rooms, completion and cancellation states.
- `Profile`: skills, notification preferences, availability, credits, reputation, listings, and account.

Shop Local should start as a strong secondary surface inside search, Pulse, and need fallback flows. Promote it to a bottom-nav `Local` tab only after local business data is real enough to justify a dedicated tab.

## Phase 0 - Product Decisions And Scope Lock

Goal: turn Lauren's feedback into buildable rules before changing the data model.

Decisions to make:

- Launch community: change prototype content from Oak Forest/Houston to Friendswood, Texas if that is the real beta market.
- Need categories: align helper toggles with actual early demand. Recommended starter set:
  - Rides / Transportation
  - Errands / Shopping
  - Yard Work / Outdoor
  - Moving / Heavy Lifting
  - Home Help / Repairs
  - Cooking / Meal Prep
  - Childcare
  - Elder Care / Companionship
  - Tutoring / Education
  - Tech Help
  - Emotional Support
  - Pet Care
  - Other
- Event categories: keep separate from needs. Recommended starter set:
  - Book Clubs
  - Garden / Outdoors
  - Wellness / Yoga
  - Cooking / Food
  - Arts & Crafts
  - Kids & Family
  - Volunteering
  - Corporate
  - Social Mixers
  - Other
- Credits language: keep `Credits` for now, but avoid making every interaction feel transactional.
- Safety policy: decide whether childcare, elder care, rides, and home-entry tasks require special trust states, disclaimers, approvals, or steward review before beta.
- Notifications: start with in-app notification records and email-friendly architecture. True mobile push can come later.

Definition of done:

- A one-page scope decision list exists.
- Current seed data and category labels reflect Friendswood beta assumptions.
- The team agrees that the next implementation slice prioritizes timed needs over visual polish.

## Phase 1 - Timed Need Data Model

Goal: give the product enough backend shape to support the calendar Lauren described.

Add or evolve these concepts:

- `need_windows`: one need can have one or more acceptable time windows.
  - `need_id`
  - `starts_at`
  - `ends_at`
  - `label`
  - `is_flexible`
  - `status`
- `need_offers`: a helper's offer to fill a need.
  - `need_id`
  - `helper_id`
  - `window_id`
  - `message`
  - `status`: `offered`, `accepted`, `declined`, `withdrawn`, `expired`
- `helper_preferences`: member skill toggles and alert controls.
  - categories they want to see
  - radius
  - urgent-only option
  - digest frequency
  - do-not-disturb window
- `need_status`: make lifecycle explicit.
  - `draft`
  - `live`
  - `offered`
  - `assigned`
  - `confirmed`
  - `completed`
  - `cancelled`
  - `reposted`
  - `expired`
- Location privacy fields.
  - public area label
  - approximate distance
  - exact address only after acceptance when needed
- Cancellation/drop reasons.
  - helper drop
  - requester cancel
  - schedule conflict
  - no longer needed
  - other

Implementation notes:

- Do not overload the current `listings.availabilityType` enum to carry all of this. It is too coarse.
- Keep existing listings working during migration; introduce timed need tables beside them, then progressively migrate UI flows.
- Existing bookings and exchange rooms can be reused after a `need_offer` is accepted.

Definition of done:

- A need can represent multiple time windows.
- A helper can offer to fill a specific window without instantly creating an exchange.
- A requester can accept one helper and leave other helpers as declined or backup candidates.
- Tests cover status transitions and authorization.

## Phase 2 - Needs Calendar MVP

Goal: make the primary action loop visible and usable before building every community surface.

Build the Calendar screen around timed needs:

- Day/week timeline view for needs near the member.
- List view for scan-friendly browsing.
- `Live now` or `Needs help now` lane for urgent needs.
- Filter drawer or sheet:
  - categories
  - distance
  - today / this week / this month
  - urgent / right now
  - recurring needs
- Left-rail or profile-backed helper controls on wider screens:
  - "I'm available" current window
  - skill toggles
  - radius
- Mobile-first version of the same controls as a bottom sheet.

Need cards should show:

- category icon
- title
- time window
- distance
- requester name/avatar and trust signal
- urgency
- credit amount or "open"
- `I can help` CTA

Definition of done:

- A member can open Calendar and immediately answer: "Can I help with any of these today?"
- Filters change the visible need set.
- The screen works on mobile and desktop/tablet.
- Seed data includes realistic Friendswood examples like rides, yard work, grocery pickup, childcare, repairs, and recurring help.

## Phase 3 - Post A Need And I Can Help Flow

Goal: reduce the back-and-forth Lauren called out from Facebook Marketplace, Nextdoor, and TaskRabbit.

Rebuild the create need flow as a guided form:

1. What do you need? Use an email-subject-style title plus guided details.
2. Category.
3. Where does it happen?
   - public place
   - approximate area
   - exact address shared after acceptance
   - remote/phone
4. When can it happen?
   - exact time
   - multiple possible windows
   - flexible afternoons/mornings
   - recurring need
5. What should a helper know before offering?
6. Credits:
   - suggested amount
   - open to discussion
   - no-credit/community-help option only if intentionally supported
7. Publish.

Build `I can help` as its own step:

- helper selects one of the posted windows or proposes a close alternative
- helper can add a short message
- app shows what information will be shared
- requester gets an offer queue, not an automatic booking

Definition of done:

- A requester can post a need with enough details that most helpers do not need a clarification message.
- Multiple helpers can offer to help the same need.
- The requester can accept one helper.
- Accepted offers create or reuse the existing exchange room.

## Phase 4 - Drop, Repost, Backup, And Flake Handling

Goal: account for real human unreliability without making the app feel punitive.

Add operational flows:

- helper withdraws from a need before acceptance
- helper cancels after acceptance with reason
- requester cancels with reason
- requester can repost the same need without retyping it
- backup helpers can be re-notified after the accepted helper drops
- steward can see repeated cancellation patterns
- requester can mark "still need help" after a failed match

Definition of done:

- A cancelled accepted need can return to a live state or be cloned/reposted.
- Backup helpers are preserved.
- Exchange state, credits, messages, and notifications stay consistent when someone drops.

## Phase 5 - Happenings Calendar

Goal: add the community layer without confusing it with timed tasks.

Build Happenings as a separate calendar mode:

- top-level `Happenings` segment or calendar toggle
- category filter sheet matching the mockup
- date strip for the week
- event cards with image, host, location, time, distance, RSVP counts, and save/share
- event detail page with hero image, RSVP CTA, attendees, location, and share
- create event flow from the center create sheet

Recommended event types:

- book clubs
- garden/outdoors
- wellness/yoga
- cooking/food
- arts/crafts
- kids/family
- volunteering
- social mixers
- civic/community

Definition of done:

- Happenings feel social and local, not like a generic event list.
- A member can browse, filter, RSVP, share, and create an event.
- Events can optionally seed needs, but they are not required to be exchanges.

## Phase 6 - Shop Local Layer

Goal: make the product feel rooted in a real town and provide a fallback when no neighbor can help.

Build Shop Local in stages:

1. Business profile model.
   - business name
   - categories
   - address and service area
   - hours
   - phone, website, directions, message
   - photos
   - community contribution notes
   - owner/member relationship
2. Discovery surface.
   - categories
   - nearby favorites
   - community reviews/love
   - map/list view
3. Need fallback.
   - when no neighbor can help, suggest trusted local options
   - keep wording clear: "local options", not a replacement for neighbor exchange
4. Community contribution.
   - badges such as `Community Favorite`, `Gives Back`, `Hosts Workshops`
   - hours or contributions only if the business actually participates

Definition of done:

- A member can browse local businesses separately from neighbor helpers.
- Business profiles support the key actions in the mockup: call, website, directions, message, save.
- The app can recommend local businesses when a need is unmatched.

## Phase 7 - Notifications And Re-Engagement

Goal: create Lauren's "ding, ding, ding" action energy without notification hell.

Start with an in-app notifications table:

- `matched_need`: a new need matches helper preferences
- `urgent_need`: a nearby urgent need is live
- `offer_received`: someone offered to fill your need
- `offer_accepted`: requester accepted your offer
- `backup_available`: a need reopened and you were a prior helper
- `event_match`: a happening matches interests
- `schedule_reminder`
- `completion_prompt`

Notification rules:

- urgent needs can be immediate
- non-urgent matches should batch into a digest or capped list
- users control categories, radius, quiet hours, and frequency
- unread counts should appear in header/bell
- every notification should lead to a concrete action

Definition of done:

- Members are alerted to needs they are likely to fill.
- Requesters are alerted when helpers offer.
- Notifications are preference-aware and capped.
- The app has a path to email and push later.

## Phase 8 - Beta Operations And Measurement

Goal: support Lauren's grassroots Friendswood launch and learn what the market actually does.

Build beta support:

- Friendswood seed content and launch community setup.
- Invite/flyer flow with a short landing page or invite code path.
- Onboarding asks:
  - what can you help with?
  - what might you need help with?
  - what events interest you?
  - notification/radius preferences
- Steward dashboard additions:
  - unmatched urgent needs
  - needs with no offers after X hours
  - accepted needs that were dropped
  - category demand/supply mismatch
  - top helper categories
  - user activation funnel
- Analytics events:
  - need posted
  - need viewed
  - filter applied
  - helper offer submitted
  - offer accepted
  - exchange completed
  - helper dropped
  - need reposted
  - event RSVP
  - business fallback clicked

Definition of done:

- Lauren can run a local beta without manually guessing what is happening.
- The team can see whether people post needs, offer help, complete exchanges, or only browse.
- The app can identify demand/supply imbalance by category.

## Recommended Build Order

1. Product decisions and Friendswood seed update.
2. Timed need model, helper preferences, and need offer queue.
3. Calendar MVP with live needs, filters, and `I can help`.
4. Post Need guided flow with multiple windows.
5. Offer acceptance, exchange conversion, cancellation, repost, and backup helper handling.
6. Happenings calendar and create event flow.
7. Shop Local directory and unmatched-need fallback.
8. Notifications, beta analytics, and steward operations.

## What To Avoid Next

- Do not spend the next phase only recreating the mockup visuals. The visual direction is useful, but the data model and action loop need to support the behavior first.
- Do not make users maintain a weekly availability schedule as the main way to receive work. Lauren specifically called out that TaskRabbit-style scheduling reduces engagement.
- Do not let `Offers` remain the primary supply mechanism if the real behavior is helpers browsing specific needs and opting into tasks.
- Do not make Happenings and Shop Local so prominent that timed needs become secondary.
- Do not send every matching need as a notification. Preference controls and batching are part of the product.

## Open Questions For Lauren

- Is Friendswood definitely the first beta community?
- Should help involving children, elder care, rides, or entering a home require extra trust or steward approval?
- Are credits required for every need, or can some needs be volunteer/community-only?
- Should a requester be able to accept multiple helpers for the same need?
- Should recurring needs create separate calendar instances or one reusable need template?
- What counts as a successful first beta: posted needs, completed exchanges, active helpers, event RSVPs, or community signups?
- Does Shop Local require paid business memberships in beta, or is it a curated trusted directory first?
- What notifications is Lauren comfortable sending in the first live beta: in-app only, email, SMS, or push later?

## Immediate Next Slice

The next engineering slice should be:

1. Add a timed need data model and helper preference model.
2. Update seed data to Friendswood-style timed needs.
3. Replace the current needs board with an initial Needs Calendar list/day view.
4. Add `I can help` offers without immediately creating an exchange.
5. Let the requester accept one offer and convert it into the existing exchange room.

This slice directly addresses Lauren's biggest concern: passive browsing does not create action, but timed needs with skill-matched prompts do.
