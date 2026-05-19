/**
 * Seed script for xChangeMakers prototype.
 * Populates a local Postgres database with rich, realistic Friendswood beta data.
 *
 * Usage: npm run db:seed   (which runs: tsx src/db/seed.ts)
 */
import { scryptSync } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from './schema'

// ─── Connection ────────────────────────────────────────────────────────────
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

const client = postgres(DATABASE_URL)
const db = drizzle(client, { schema })
const DEMO_PASSWORD_HASH = hashPasswordSync('password')

function hashPasswordSync(password: string): string {
  const salt = 'local-demo-auth-salt'
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${key}`
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function hoursFromNow(n: number): Date {
  const d = new Date()
  d.setHours(d.getHours() + n)
  return d
}

function atRelativeDay(dayOffset: number, hour: number, minute = 0): Date {
  const d = daysFromNow(dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

/** Next occurrence of a given weekday (0=Sun) at the given hour */
function nextWeekday(dayOfWeek: number, hour: number): Date {
  const d = new Date()
  const currentDay = d.getDay()
  let daysUntil = dayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  d.setDate(d.getDate() + daysUntil)
  d.setHours(hour, 0, 0, 0)
  return d
}

// ─── Fixed UUIDs ───────────────────────────────────────────────────────────
// Members
const LAUREN_ID    = 'a0000000-0000-4000-8000-000000000001'
const MARIA_ID     = 'a0000000-0000-4000-8000-000000000002'
const JAKE_M_ID    = 'a0000000-0000-4000-8000-000000000003'
const PRIYA_ID     = 'a0000000-0000-4000-8000-000000000004'
const MARCUS_ID    = 'a0000000-0000-4000-8000-000000000005'
const SARAH_ID     = 'a0000000-0000-4000-8000-000000000006'
const DAVID_ID     = 'a0000000-0000-4000-8000-000000000007'
const AISHA_ID     = 'a0000000-0000-4000-8000-000000000008'
const TOM_ID       = 'a0000000-0000-4000-8000-000000000009'
const LINDA_ID     = 'a0000000-0000-4000-8000-00000000000a'
const BEN_ID       = 'a0000000-0000-4000-8000-00000000000b'
const ROSA_ID      = 'a0000000-0000-4000-8000-00000000000c'
const JAMES_ID     = 'a0000000-0000-4000-8000-00000000000d'
const FATIMA_ID    = 'a0000000-0000-4000-8000-00000000000e'
const CHRIS_ID     = 'a0000000-0000-4000-8000-00000000000f'
const DIANA_ID     = 'a0000000-0000-4000-8000-000000000010'
const OMAR_ID      = 'a0000000-0000-4000-8000-000000000011'
const ELIJAH_ID    = 'a0000000-0000-4000-8000-000000000012'

// Communities
const FRIENDSWOOD_COMMUNITY_ID = '90000000-0000-4000-8000-000000000001'
const WEST_FRIENDSWOOD_COMMUNITY_ID = '90000000-0000-4000-8000-000000000002'
const PEARLAND_COMMUNITY_ID = '90000000-0000-4000-8000-000000000003'

// Wallets
const LAUREN_WALLET  = 'b0000000-0000-4000-8000-000000000001'
const MARIA_WALLET   = 'b0000000-0000-4000-8000-000000000002'
const JAKE_M_WALLET  = 'b0000000-0000-4000-8000-000000000003'
const PRIYA_WALLET   = 'b0000000-0000-4000-8000-000000000004'
const MARCUS_WALLET  = 'b0000000-0000-4000-8000-000000000005'
const SARAH_WALLET   = 'b0000000-0000-4000-8000-000000000006'
const DAVID_WALLET   = 'b0000000-0000-4000-8000-000000000007'
const AISHA_WALLET   = 'b0000000-0000-4000-8000-000000000008'
const TOM_WALLET     = 'b0000000-0000-4000-8000-000000000009'
const LINDA_WALLET   = 'b0000000-0000-4000-8000-00000000000a'
const BEN_WALLET     = 'b0000000-0000-4000-8000-00000000000b'
const ROSA_WALLET    = 'b0000000-0000-4000-8000-00000000000c'
const JAMES_WALLET   = 'b0000000-0000-4000-8000-00000000000d'
const FATIMA_WALLET  = 'b0000000-0000-4000-8000-00000000000e'
const CHRIS_WALLET   = 'b0000000-0000-4000-8000-00000000000f'
const DIANA_WALLET   = 'b0000000-0000-4000-8000-000000000010'
const OMAR_WALLET    = 'b0000000-0000-4000-8000-000000000011'
const ELIJAH_WALLET  = 'b0000000-0000-4000-8000-000000000012'

// Listings
const L_TAMALES       = 'c0000000-0000-4000-8000-000000000001'
const L_MEAL_PREP     = 'c0000000-0000-4000-8000-000000000002'
const L_LAWN          = 'c0000000-0000-4000-8000-000000000003'
const L_HANDYMAN      = 'c0000000-0000-4000-8000-000000000004'
const L_YOGA          = 'c0000000-0000-4000-8000-000000000005'
const L_MEDITATION    = 'c0000000-0000-4000-8000-000000000006'
const L_TAX           = 'c0000000-0000-4000-8000-000000000007'
const L_FINANCE       = 'c0000000-0000-4000-8000-000000000008'
const L_SOURDOUGH_CLS = 'c0000000-0000-4000-8000-000000000009'
const L_BREAD         = 'c0000000-0000-4000-8000-00000000000a'
const L_BIKE          = 'c0000000-0000-4000-8000-00000000000b'
const L_WOODWORK      = 'c0000000-0000-4000-8000-00000000000c'
const L_TAROT         = 'c0000000-0000-4000-8000-00000000000d'
const L_ENERGY        = 'c0000000-0000-4000-8000-00000000000e'
const L_PHOTO         = 'c0000000-0000-4000-8000-00000000000f'
const L_DRONE         = 'c0000000-0000-4000-8000-000000000010'
const L_MATH_TUTOR    = 'c0000000-0000-4000-8000-000000000011'
const L_SCI_TUTOR     = 'c0000000-0000-4000-8000-000000000012'
const L_DOG_WALK      = 'c0000000-0000-4000-8000-000000000013'
const L_PET_SIT       = 'c0000000-0000-4000-8000-000000000014'
const L_HERB_KIT      = 'c0000000-0000-4000-8000-000000000015'
const L_GARDEN        = 'c0000000-0000-4000-8000-000000000016'
const L_FURNITURE     = 'c0000000-0000-4000-8000-000000000017'
const L_HANDYMAN2     = 'c0000000-0000-4000-8000-000000000018'
const L_CALLIGRAPHY   = 'c0000000-0000-4000-8000-000000000019'
const L_ARABIC        = 'c0000000-0000-4000-8000-00000000001a'
const L_GUITAR        = 'c0000000-0000-4000-8000-00000000001b'
const L_MUSIC_PROD    = 'c0000000-0000-4000-8000-00000000001c'
const L_MANICURE      = 'c0000000-0000-4000-8000-00000000001d'
const L_SKINCARE      = 'c0000000-0000-4000-8000-00000000001e'
const L_WEB_DESIGN    = 'c0000000-0000-4000-8000-00000000001f'
const L_TECH_SUPPORT  = 'c0000000-0000-4000-8000-000000000020'
const L_TRAINING      = 'c0000000-0000-4000-8000-000000000021'
const L_NUTRITION     = 'c0000000-0000-4000-8000-000000000022'
// Lauren's listings
const L_LAUREN_OFFER  = 'c0000000-0000-4000-8000-000000000023'
const L_LAUREN_NEED   = 'c0000000-0000-4000-8000-000000000024'
// Need listings
const L_NEED_MOVING   = 'c0000000-0000-4000-8000-000000000030'
const L_NEED_TUTOR    = 'c0000000-0000-4000-8000-000000000031'
const L_NEED_CAKE     = 'c0000000-0000-4000-8000-000000000032'
const L_NEED_WIFI     = 'c0000000-0000-4000-8000-000000000033'
const L_NEED_SPANISH  = 'c0000000-0000-4000-8000-000000000034'

// Timed need windows
const NW_LAUREN_MOVE  = 'e1000000-0000-4000-8000-000000000001'
const NW_FENCE_LUMBER = 'e1000000-0000-4000-8000-000000000002'
const NW_MATH_TUTOR   = 'e1000000-0000-4000-8000-000000000003'
const NW_CAKE         = 'e1000000-0000-4000-8000-000000000004'
const NW_WIFI         = 'e1000000-0000-4000-8000-000000000005'
const NW_SPANISH      = 'e1000000-0000-4000-8000-000000000006'
const NW_MATH_TUTOR_ALT = 'e1000000-0000-4000-8000-000000000007'

// Helper offers
const NO_DAVID_MOVE   = 'e2000000-0000-4000-8000-000000000001'
const NO_JAMES_MOVE   = 'e2000000-0000-4000-8000-000000000002'

// Exchanges
const EX_LAUREN_TAMALES  = 'd0000000-0000-4000-8000-000000000001'
const EX_LAUREN_YOGA     = 'd0000000-0000-4000-8000-000000000002'
const EX_BEN_GUITAR      = 'd0000000-0000-4000-8000-000000000003'
const EX_SARAH_BIKE      = 'd0000000-0000-4000-8000-000000000004'
// Reverse reviews need their own exchange (unique constraint on exchange_id)
const EX_TAMALE_REVERSE  = 'd0000000-0000-4000-8000-000000000005'
const EX_BIKE_REVERSE    = 'd0000000-0000-4000-8000-000000000006'
// Extra "past" exchanges for reputation tags
const EX_PAST_01         = 'd0000000-0000-4000-8000-000000000010'
const EX_PAST_02         = 'd0000000-0000-4000-8000-000000000011'
const EX_PAST_03         = 'd0000000-0000-4000-8000-000000000012'
const EX_PAST_04         = 'd0000000-0000-4000-8000-000000000013'
const EX_PAST_05         = 'd0000000-0000-4000-8000-000000000014'

// Bookings
const BOOKING_YOGA = 'e0000000-0000-4000-8000-000000000001'

// Reviews
const REV_LAUREN_MARIA  = 'f0000000-0000-4000-8000-000000000001'
const REV_MARIA_LAUREN  = 'f0000000-0000-4000-8000-000000000002'
const REV_SARAH_DAVID   = 'f0000000-0000-4000-8000-000000000003'
const REV_DAVID_SARAH   = 'f0000000-0000-4000-8000-000000000004'
const REV_PAST_01       = 'f0000000-0000-4000-8000-000000000010'
const REV_PAST_02       = 'f0000000-0000-4000-8000-000000000011'
const REV_PAST_03       = 'f0000000-0000-4000-8000-000000000012'
const REV_PAST_04       = 'f0000000-0000-4000-8000-000000000013'
const REV_PAST_05       = 'f0000000-0000-4000-8000-000000000014'

// Happenings
const HAP_EXCHANGE    = 'aa000000-0000-4000-8000-000000000001'
const HAP_FARMERS     = 'aa000000-0000-4000-8000-000000000002'
const HAP_YOGA        = 'aa000000-0000-4000-8000-000000000003'
const HAP_KIDS        = 'aa000000-0000-4000-8000-000000000004'
const HAP_SOURDOUGH   = 'aa000000-0000-4000-8000-000000000005'
const HAP_CLEANUP     = 'aa000000-0000-4000-8000-000000000006'
const HAP_BOOKSWAP    = 'aa000000-0000-4000-8000-000000000007'

// Conversations
const CONV_LAUREN_MARIA  = 'cc000000-0000-4000-8000-000000000001'
const CONV_LAUREN_PRIYA  = 'cc000000-0000-4000-8000-000000000002'
const CONV_LAUREN_SARAH  = 'cc000000-0000-4000-8000-000000000003'

// Treasury
const TREASURY_FRIENDSWOOD = 'dd000000-0000-4000-8000-000000000001'

// ─── Seed ──────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Clearing existing data...')

  // Delete in reverse dependency order
  await db.delete(schema.authSessions)
  await db.delete(schema.authAccounts)
  await db.delete(schema.stewardFlags)
  await db.delete(schema.reputationTags)
  await db.delete(schema.reviews)
  await db.delete(schema.onboardingProgress)
  await db.delete(schema.messages)
  await db.delete(schema.conversationParticipants)
  await db.delete(schema.conversations)
  await db.delete(schema.notifications)
  await db.delete(schema.analyticsEvents)
  await db.delete(schema.activityFeed)
  await db.delete(schema.happeningRsvps)
  await db.delete(schema.happenings)
  await db.delete(schema.needOffers)
  await db.delete(schema.walletTransactions)
  await db.delete(schema.bookings)
  await db.delete(schema.availabilitySlots)
  await db.delete(schema.exchanges)
  await db.delete(schema.needWindows)
  await db.delete(schema.helperPreferences)
  await db.delete(schema.memberIntentProfiles)
  await db.delete(schema.listings)
  await db.delete(schema.wallets)
  await db.delete(schema.treasury)
  await db.delete(schema.businessProfiles)
  await db.delete(schema.members)
  await db.delete(schema.communityInvites)
  await db.delete(schema.communities)

  console.log('All tables cleared.')

  // ── 1. Launch communities ───────────────────────────────────────────────
  console.log('Inserting Friendswood launch communities...')

  await db.insert(schema.communities).values([
    {
      id: FRIENDSWOOD_COMMUNITY_ID,
      name: 'Friendswood',
      slug: 'friendswood',
      city: 'Friendswood',
      region: 'TX',
      postalCode: '77546',
      centerLatitude: '29.5294000',
      centerLongitude: '-95.2010000',
      status: 'active',
      inviteOnly: true,
    },
    {
      id: WEST_FRIENDSWOOD_COMMUNITY_ID,
      name: 'West Friendswood',
      slug: 'west-friendswood',
      city: 'Friendswood',
      region: 'TX',
      postalCode: '77546',
      centerLatitude: '29.5308000',
      centerLongitude: '-95.2210000',
      status: 'active',
      inviteOnly: true,
    },
    {
      id: PEARLAND_COMMUNITY_ID,
      name: 'Pearland',
      slug: 'pearland',
      city: 'Pearland',
      region: 'TX',
      postalCode: '77581',
      centerLatitude: '29.5636000',
      centerLongitude: '-95.2860000',
      status: 'active',
      inviteOnly: true,
    },
  ])

  await db.insert(schema.communityInvites).values([
    {
      communityId: FRIENDSWOOD_COMMUNITY_ID,
      code: 'FRIENDSWOOD',
      label: 'Friendswood beta invite',
    },
    {
      communityId: WEST_FRIENDSWOOD_COMMUNITY_ID,
      code: 'WEST-FRIENDSWOOD',
      label: 'West Friendswood beta invite',
    },
    {
      communityId: PEARLAND_COMMUNITY_ID,
      code: 'PEARLAND',
      label: 'Pearland beta invite',
    },
  ])

  console.log('  3 communities and 3 invite codes inserted.')

  // ── 2. Members ──────────────────────────────────────────────────────────
  console.log('Inserting members...')

  await db.insert(schema.members).values([
    {
      id: LAUREN_ID,
      firstName: 'Lauren',
      lastName: 'Chen',
      email: 'lauren.chen@email.com',
      avatarUrl: null,
      bio: 'Community builder and neighborhood connector. I moved to Friendswood three years ago and fell in love with the people here. I believe the best things in life come from sharing what we have with our neighbors.',
      vibe: 'Building bridges between neighbors',
      neighborhood: 'Friendswood',
      latitude: '29.8080',
      longitude: '-95.3960',
      isAvailable: true,
      availabilityNote: 'Weekday afternoons & weekends',
      membershipType: 'standard',
      joinedAt: daysAgo(45),
    },
    {
      id: MARIA_ID,
      firstName: 'Maria',
      lastName: 'Gonzalez',
      email: 'maria.gonzalez@email.com',
      avatarUrl: null,
      bio: 'Third-generation tamale maker. My abuela taught me, and now I teach the neighborhood. I also do weekly meal prep for busy families — real home-cooked Mexican food, not fast food.',
      vibe: 'Feeding the neighborhood one tamale at a time',
      neighborhood: 'Friendswood',
      latitude: '29.8095',
      longitude: '-95.3975',
      isAvailable: true,
      availabilityNote: 'Mornings and early afternoons',
      membershipType: 'business',
      joinedAt: daysAgo(38),
    },
    {
      id: JAKE_M_ID,
      firstName: 'Jake',
      lastName: 'Mitchell',
      email: 'jake.mitchell@email.com',
      avatarUrl: null,
      bio: 'Retired firefighter turned neighborhood handyman. If it is broken, I can probably fix it. Lawn care, minor plumbing, drywall — you name it. No job too small.',
      vibe: 'Keeping Friendswood running smooth',
      neighborhood: 'Friendswood',
      latitude: '29.8110',
      longitude: '-95.3940',
      isAvailable: true,
      availabilityNote: 'Mon-Sat, flexible hours',
      membershipType: 'business',
      joinedAt: daysAgo(42),
    },
    {
      id: PRIYA_ID,
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@email.com',
      avatarUrl: null,
      bio: 'Certified yoga instructor and meditation guide. I teach vinyasa flow and mindfulness for all levels. I believe wellness should be accessible to everyone, not just people who can afford a studio membership.',
      vibe: 'Breathe, stretch, connect',
      neighborhood: 'West Friendswood',
      latitude: '29.8130',
      longitude: '-95.3985',
      isAvailable: true,
      availabilityNote: 'Early mornings and evenings',
      membershipType: 'business',
      joinedAt: daysAgo(35),
    },
    {
      id: MARCUS_ID,
      firstName: 'Marcus',
      lastName: 'Johnson',
      email: 'marcus.johnson@email.com',
      avatarUrl: null,
      bio: 'Former bank manager. I help neighbors with tax prep, budgeting, and financial literacy. Everyone deserves to understand their money — no jargon, no judgment.',
      vibe: 'Making money less scary',
      neighborhood: 'Friendswood',
      latitude: '29.8070',
      longitude: '-95.3950',
      isAvailable: true,
      availabilityNote: 'Evenings and weekends',
      membershipType: 'business',
      joinedAt: daysAgo(30),
    },
    {
      id: SARAH_ID,
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@email.com',
      avatarUrl: null,
      bio: 'Sourdough obsessive. I have been maintaining my starter for four years and baking for the neighborhood ever since. I also teach small-group bread classes from my Friendswood kitchen.',
      vibe: 'Life is better with fresh bread',
      neighborhood: 'Friendswood',
      latitude: '29.8100',
      longitude: '-95.4010',
      isAvailable: true,
      availabilityNote: 'Baking days: Tue/Thu/Sat',
      membershipType: 'business',
      joinedAt: daysAgo(40),
    },
    {
      id: DAVID_ID,
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@email.com',
      avatarUrl: null,
      bio: 'Bike mechanic and woodworker. I fix bikes in my garage in Friendswood and build custom shelves, cutting boards, and small furniture from reclaimed wood. Everything by hand.',
      vibe: 'Fix it, build it, ride it',
      neighborhood: 'Friendswood',
      latitude: '29.8060',
      longitude: '-95.3990',
      isAvailable: true,
      availabilityNote: 'Afternoons and Saturdays',
      membershipType: 'business',
      joinedAt: daysAgo(33),
    },
    {
      id: AISHA_ID,
      firstName: 'Aisha',
      lastName: 'Williams',
      email: 'aisha.williams@email.com',
      avatarUrl: null,
      bio: 'Intuitive tarot reader and energy healer. I offer 30- and 60-minute sessions to help you find clarity, release what no longer serves you, and reconnect with your inner compass.',
      vibe: 'Your energy tells the story',
      neighborhood: 'Pearland',
      latitude: '29.7980',
      longitude: '-95.3930',
      isAvailable: true,
      availabilityNote: 'By appointment',
      membershipType: 'standard',
      joinedAt: daysAgo(25),
    },
    {
      id: TOM_ID,
      firstName: 'Tom',
      lastName: 'Rodriguez',
      email: 'tom.rodriguez@email.com',
      avatarUrl: null,
      bio: 'Photographer and licensed drone pilot. Family portraits, events, real estate aerials — I do it all. Born and raised in Pearland, now shooting from above and below.',
      vibe: 'Capturing Friendswood from every angle',
      neighborhood: 'Pearland',
      latitude: '29.7990',
      longitude: '-95.3960',
      isAvailable: true,
      availabilityNote: 'Weekends preferred, weekdays possible',
      membershipType: 'standard',
      joinedAt: daysAgo(28),
    },
    {
      id: LINDA_ID,
      firstName: 'Linda',
      lastName: 'Okafor',
      email: 'linda.okafor@email.com',
      avatarUrl: null,
      bio: 'Retired high school teacher with 22 years in math and science. I tutor kids from elementary through high school — algebra, geometry, biology, chemistry. Patient and thorough.',
      vibe: 'Every kid can learn math',
      neighborhood: 'West Friendswood',
      latitude: '29.8140',
      longitude: '-95.4000',
      isAvailable: true,
      availabilityNote: 'Weekday afternoons, 3-7pm',
      membershipType: 'standard',
      joinedAt: daysAgo(20),
    },
    {
      id: BEN_ID,
      firstName: 'Ben',
      lastName: 'Nakamura',
      email: 'ben.nakamura@email.com',
      avatarUrl: null,
      bio: 'Dog lover and reliable pet sitter. I walk dogs, do overnight stays, and handle cats too. Your pets are family — I treat them that way. Fully insured.',
      vibe: 'Your pets, my priority',
      neighborhood: 'Friendswood',
      latitude: '29.8085',
      longitude: '-95.3945',
      isAvailable: true,
      availabilityNote: 'Daily, early AM and late PM walks',
      membershipType: 'standard',
      joinedAt: daysAgo(22),
    },
    {
      id: ROSA_ID,
      firstName: 'Rosa',
      lastName: 'Martinez',
      email: 'rosa.martinez@email.com',
      avatarUrl: null,
      bio: 'Master gardener and herb grower. I sell starter kits (basil, cilantro, rosemary, mint) and consult on garden setup. If you have a patch of dirt, I can make it productive.',
      vibe: 'Grow something today',
      neighborhood: 'Friendswood',
      latitude: '29.8075',
      longitude: '-95.4020',
      isAvailable: true,
      availabilityNote: 'Mornings, rain or shine',
      membershipType: 'business',
      joinedAt: daysAgo(32),
    },
    {
      id: JAMES_ID,
      firstName: 'James',
      lastName: 'Cooper',
      email: 'james.cooper@email.com',
      avatarUrl: null,
      bio: 'Handyman and furniture restorer. I bring old dressers, tables, and chairs back to life. Also do general repairs — electrical, plumbing basics, drywall. 15 years experience.',
      vibe: 'Old things made new again',
      neighborhood: 'Friendswood',
      latitude: '29.8120',
      longitude: '-95.3970',
      isAvailable: true,
      availabilityNote: 'Tue-Sat',
      membershipType: 'standard',
      joinedAt: daysAgo(27),
    },
    {
      id: FATIMA_ID,
      firstName: 'Fatima',
      lastName: 'Al-Rashid',
      email: 'fatima.alrashid@email.com',
      avatarUrl: null,
      bio: 'Arabic calligrapher and language tutor. I teach traditional calligraphy workshops and conversational Arabic for beginners. Art and language are how we keep culture alive.',
      vibe: 'Every letter is art',
      neighborhood: 'West Friendswood',
      latitude: '29.8150',
      longitude: '-95.3955',
      isAvailable: true,
      availabilityNote: 'Weekday evenings',
      membershipType: 'standard',
      joinedAt: daysAgo(18),
    },
    {
      id: CHRIS_ID,
      firstName: 'Chris',
      lastName: 'Morgan',
      email: 'chris.morgan@email.com',
      avatarUrl: null,
      bio: 'Guitar teacher and home studio producer. I teach acoustic and electric guitar for beginners through intermediate. I also record demos and help local musicians with basic production.',
      vibe: 'Making music, making neighbors',
      neighborhood: 'Pearland',
      latitude: '29.7970',
      longitude: '-95.3980',
      isAvailable: true,
      availabilityNote: 'Afternoons and evenings',
      membershipType: 'standard',
      joinedAt: daysAgo(15),
    },
    {
      id: DIANA_ID,
      firstName: 'Diana',
      lastName: 'Tran',
      email: 'diana.tran@email.com',
      avatarUrl: null,
      bio: 'Nail artist and skincare enthusiast. I do gel manicures, nail art, and basic facials from my home studio. Salon quality, neighborhood prices.',
      vibe: 'Look good, feel good',
      neighborhood: 'Friendswood',
      latitude: '29.8090',
      longitude: '-95.4005',
      isAvailable: true,
      availabilityNote: 'Wed-Sun by appointment',
      membershipType: 'business',
      joinedAt: daysAgo(12),
    },
    {
      id: OMAR_ID,
      firstName: 'Omar',
      lastName: 'Singh',
      email: 'omar.singh@email.com',
      avatarUrl: null,
      bio: 'Freelance web designer and all-around tech guy. I build simple websites, fix computers, set up smart home devices, and untangle WiFi problems. No tech question is too basic.',
      vibe: 'Tech help without the attitude',
      neighborhood: 'Friendswood',
      latitude: '29.8105',
      longitude: '-95.3935',
      isAvailable: true,
      availabilityNote: 'Flexible, just message me',
      membershipType: 'standard',
      joinedAt: daysAgo(10),
    },
    {
      id: ELIJAH_ID,
      firstName: 'Elijah',
      lastName: 'Banks',
      email: 'elijah.banks@email.com',
      avatarUrl: null,
      bio: 'NASM-certified personal trainer and nutrition coach. I do one-on-one sessions at the Friendswood Park Pavilion and build custom meal plans. Fitness should fit your life, not the other way around.',
      vibe: 'Stronger every day',
      neighborhood: 'West Friendswood',
      latitude: '29.8160',
      longitude: '-95.3990',
      isAvailable: true,
      availabilityNote: 'Early mornings (5-8am) and evenings',
      membershipType: 'standard',
      joinedAt: daysAgo(3),
    },
  ])

  await db
    .update(schema.members)
    .set({ communityId: FRIENDSWOOD_COMMUNITY_ID })
    .where(eq(schema.members.neighborhood, 'Friendswood'))

  await db
    .update(schema.members)
    .set({ communityId: WEST_FRIENDSWOOD_COMMUNITY_ID })
    .where(eq(schema.members.neighborhood, 'West Friendswood'))

  await db
    .update(schema.members)
    .set({ communityId: PEARLAND_COMMUNITY_ID })
    .where(eq(schema.members.neighborhood, 'Pearland'))

  await db
    .update(schema.members)
    .set({
      status: 'active',
      isSteward: true,
      reviewedAt: daysAgo(45),
    })
    .where(eq(schema.members.id, LAUREN_ID))

  console.log('  18 members inserted.')

  const memberAuthRows = await db
    .select({ id: schema.members.id, email: schema.members.email })
    .from(schema.members)

  await db.insert(schema.authAccounts).values(
    memberAuthRows.map((member) => ({
      memberId: member.id,
      email: member.email.toLowerCase(),
      passwordHash: DEMO_PASSWORD_HASH,
    })),
  )

  console.log('  18 demo auth accounts inserted.')

  // ── 2. Local business profiles ─────────────────────────────────────────
  console.log('Inserting local business profiles...')

  await db.insert(schema.businessProfiles).values([
    {
      memberId: MARIA_ID,
      businessName: 'The Treat House',
      categories: ['food_drink'],
      address: '1842 Cheshire Ln, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0142',
      websiteUrl: 'https://example.com/the-treat-house',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=1842+Cheshire+Ln+Friendswood+TX+77546',
      hours: {
        Mon: 'Closed',
        Tue: '9:00 AM - 3:00 PM',
        Wed: '9:00 AM - 3:00 PM',
        Thu: '9:00 AM - 3:00 PM',
        Fri: '9:00 AM - 5:00 PM',
        Sat: '8:00 AM - 1:00 PM',
        Sun: 'Closed',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Hosts monthly baking tables and donates extra bread to neighbor meal trains.',
      contributionBadges: ['Meal trains', 'Workshop host'],
      communityHoursContributed: 28,
      rating: '4.9',
      reviewCount: 36,
      isCommunityFavorite: true,
    },
    {
      memberId: JAKE_M_ID,
      businessName: 'Fix It Right Home Services',
      categories: ['home_services', 'garden_outdoors', 'moving_help'],
      address: '2206 Alba Rd, Friendswood, TX 77546',
      serviceArea: 'Friendswood and West Friendswood',
      phone: '(713) 555-0188',
      websiteUrl: 'https://example.com/fix-it-right',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=2206+Alba+Rd+Friendswood+TX+77546',
      hours: {
        Mon: '8:00 AM - 5:00 PM',
        Tue: '8:00 AM - 5:00 PM',
        Wed: '8:00 AM - 5:00 PM',
        Thu: '8:00 AM - 5:00 PM',
        Fri: '8:00 AM - 5:00 PM',
        Sat: '9:00 AM - 2:00 PM',
        Sun: 'Closed',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Keeps a few Saturday hours open each month for low-cost neighbor repairs.',
      contributionBadges: ['Repair help', 'Moving support'],
      communityHoursContributed: 34,
      rating: '4.8',
      reviewCount: 29,
      isCommunityFavorite: true,
    },
    {
      memberId: PRIYA_ID,
      businessName: 'Sunrise Yoga Studio',
      categories: ['health_wellness'],
      address: '1020 W Parkwood Ave, Friendswood, TX 77546',
      serviceArea: 'West Friendswood',
      phone: '(713) 555-0165',
      websiteUrl: 'https://example.com/sunrise-yoga',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=1020+W+Parkwood+Ave+Friendswood+TX+77546',
      hours: {
        Mon: '6:30 AM - 7:30 PM',
        Tue: '6:30 AM - 7:30 PM',
        Wed: '6:30 AM - 7:30 PM',
        Thu: '6:30 AM - 7:30 PM',
        Fri: '6:30 AM - 5:00 PM',
        Sat: '8:00 AM - 12:00 PM',
        Sun: '8:00 AM - 12:00 PM',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Offers a free community class every first Saturday in the park.',
      contributionBadges: ['Free classes', 'Wellness access'],
      communityHoursContributed: 42,
      rating: '5.0',
      reviewCount: 31,
      isCommunityFavorite: true,
    },
    {
      memberId: MARCUS_ID,
      businessName: 'Friendswood Money Help',
      categories: ['professional'],
      address: '1515 S Friendswood Dr, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0117',
      websiteUrl: 'https://example.com/friendswood-money-help',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=1515+S+Friendswood+Dr+Friendswood+TX+77546',
      hours: {
        Mon: 'By appointment',
        Tue: 'By appointment',
        Wed: 'By appointment',
        Thu: 'By appointment',
        Fri: 'By appointment',
        Sat: '10:00 AM - 1:00 PM',
        Sun: 'Closed',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Runs quarterly no-jargon budgeting sessions for neighbors.',
      contributionBadges: ['Financial coaching', 'Workshops'],
      communityHoursContributed: 19,
      rating: '4.9',
      reviewCount: 18,
      isCommunityFavorite: false,
    },
    {
      memberId: SARAH_ID,
      businessName: 'Hidden Gem Bakery',
      categories: ['food_drink', 'shopping_makers'],
      address: '1340 S Friendswood Dr, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0138',
      websiteUrl: 'https://example.com/hidden-gem-bakery',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=1340+S+Friendswood+Dr+Friendswood+TX+77546',
      hours: {
        Mon: 'Closed',
        Tue: '8:00 AM - 2:00 PM',
        Wed: 'Closed',
        Thu: '8:00 AM - 2:00 PM',
        Fri: '8:00 AM - 2:00 PM',
        Sat: '8:00 AM - 1:00 PM',
        Sun: 'Closed',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Teaches small sourdough classes and shares starter kits with new bakers.',
      contributionBadges: ['Bread classes', 'Starter kits'],
      communityHoursContributed: 24,
      rating: '4.9',
      reviewCount: 42,
      isCommunityFavorite: true,
    },
    {
      memberId: DAVID_ID,
      businessName: 'Greenleaf Workshop',
      categories: ['shopping_makers', 'home_services', 'garden_outdoors'],
      address: '2110 S Friendswood Dr, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0154',
      websiteUrl: 'https://example.com/greenleaf-workshop',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=2110+S+Friendswood+Dr+Friendswood+TX+77546',
      hours: {
        Mon: 'Closed',
        Tue: '10:00 AM - 5:00 PM',
        Wed: '10:00 AM - 5:00 PM',
        Thu: '10:00 AM - 5:00 PM',
        Fri: '10:00 AM - 5:00 PM',
        Sat: '9:00 AM - 3:00 PM',
        Sun: 'Closed',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Builds planter boxes for community gardens and repairs donated bikes.',
      contributionBadges: ['Garden builds', 'Bike repair'],
      communityHoursContributed: 38,
      rating: '5.0',
      reviewCount: 28,
      isCommunityFavorite: true,
    },
    {
      memberId: ROSA_ID,
      businessName: 'Greenleaf Nursery',
      categories: ['garden_outdoors', 'shopping_makers'],
      address: '123 Garden Way, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0172',
      websiteUrl: 'https://example.com/greenleaf-nursery',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=123+Garden+Way+Friendswood+TX+77546',
      hours: {
        Mon: '9:00 AM - 6:00 PM',
        Tue: '9:00 AM - 6:00 PM',
        Wed: '9:00 AM - 6:00 PM',
        Thu: '9:00 AM - 6:00 PM',
        Fri: '9:00 AM - 6:00 PM',
        Sat: '8:00 AM - 5:00 PM',
        Sun: '10:00 AM - 4:00 PM',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Hosts workshops and donates native plants to community gardens.',
      contributionBadges: ['Donates plants', 'Garden workshops'],
      communityHoursContributed: 46,
      rating: '5.0',
      reviewCount: 28,
      isCommunityFavorite: true,
    },
    {
      memberId: DIANA_ID,
      businessName: 'Glow & Nail Studio',
      categories: ['health_wellness'],
      address: '1704 W Parkwood Ave, Friendswood, TX 77546',
      serviceArea: 'Friendswood',
      phone: '(713) 555-0191',
      websiteUrl: 'https://example.com/glow-nail-studio',
      directionsUrl: 'https://www.google.com/maps/search/?api=1&query=1704+W+Parkwood+Ave+Friendswood+TX+77546',
      hours: {
        Mon: 'Closed',
        Tue: 'Closed',
        Wed: '11:00 AM - 6:00 PM',
        Thu: '11:00 AM - 6:00 PM',
        Fri: '11:00 AM - 6:00 PM',
        Sat: '10:00 AM - 4:00 PM',
        Sun: '12:00 PM - 4:00 PM',
      },
      photoUrls: [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
      ],
      contributionNotes:
        'Donates care packages and offers discounted appointments after community events.',
      contributionBadges: ['Care packages', 'Event support'],
      communityHoursContributed: 16,
      rating: '4.8',
      reviewCount: 22,
      isCommunityFavorite: false,
    },
  ])

  console.log('  8 business profiles inserted.')

  // ── 3. Wallets ──────────────────────────────────────────────────────────
  console.log('Inserting wallets...')

  await db.insert(schema.wallets).values([
    { id: LAUREN_WALLET,  memberId: LAUREN_ID,  balance: 120, totalEarned: 155, monthlyEarned: 35, escrowHeld: 25 },
    { id: MARIA_WALLET,   memberId: MARIA_ID,   balance: 95,  totalEarned: 130, monthlyEarned: 40, escrowHeld: 0 },
    { id: JAKE_M_WALLET,  memberId: JAKE_M_ID,  balance: 180, totalEarned: 220, monthlyEarned: 60, escrowHeld: 0 },
    { id: PRIYA_WALLET,   memberId: PRIYA_ID,   balance: 75,  totalEarned: 100, monthlyEarned: 25, escrowHeld: 25 },
    { id: MARCUS_WALLET,  memberId: MARCUS_ID,  balance: 60,  totalEarned: 90,  monthlyEarned: 30, escrowHeld: 0 },
    { id: SARAH_WALLET,   memberId: SARAH_ID,   balance: 110, totalEarned: 140, monthlyEarned: 35, escrowHeld: 0 },
    { id: DAVID_WALLET,   memberId: DAVID_ID,   balance: 145, totalEarned: 175, monthlyEarned: 45, escrowHeld: 0 },
    { id: AISHA_WALLET,   memberId: AISHA_ID,   balance: 55,  totalEarned: 80,  monthlyEarned: 20, escrowHeld: 0 },
    { id: TOM_WALLET,     memberId: TOM_ID,     balance: 85,  totalEarned: 120, monthlyEarned: 35, escrowHeld: 0 },
    { id: LINDA_WALLET,   memberId: LINDA_ID,   balance: 70,  totalEarned: 95,  monthlyEarned: 25, escrowHeld: 0 },
    { id: BEN_WALLET,     memberId: BEN_ID,     balance: 40,  totalEarned: 60,  monthlyEarned: 20, escrowHeld: 0 },
    { id: ROSA_WALLET,    memberId: ROSA_ID,    balance: 90,  totalEarned: 110, monthlyEarned: 30, escrowHeld: 0 },
    { id: JAMES_WALLET,   memberId: JAMES_ID,   balance: 160, totalEarned: 200, monthlyEarned: 50, escrowHeld: 0 },
    { id: FATIMA_WALLET,  memberId: FATIMA_ID,  balance: 35,  totalEarned: 50,  monthlyEarned: 15, escrowHeld: 0 },
    { id: CHRIS_WALLET,   memberId: CHRIS_ID,   balance: 45,  totalEarned: 70,  monthlyEarned: 25, escrowHeld: 0 },
    { id: DIANA_WALLET,   memberId: DIANA_ID,   balance: 65,  totalEarned: 85,  monthlyEarned: 20, escrowHeld: 0 },
    { id: OMAR_WALLET,    memberId: OMAR_ID,    balance: 50,  totalEarned: 75,  monthlyEarned: 25, escrowHeld: 0 },
    { id: ELIJAH_WALLET,  memberId: ELIJAH_ID,  balance: 20,  totalEarned: 20,  monthlyEarned: 0,  escrowHeld: 0 },
  ])

  console.log('  18 wallets inserted.')

  // ── 4. Listings ─────────────────────────────────────────────────────────
  console.log('Inserting listings...')

  await db.insert(schema.listings).values([
    // Maria — food
    { id: L_TAMALES, memberId: MARIA_ID, type: 'offering', title: 'Fresh Homemade Tamales (dozen)', description: 'A dozen handmade pork, chicken, or bean tamales. Made fresh with masa from scratch. My abuela\'s recipe, perfected over three generations. Order by Wednesday for weekend pickup.', category: 'food', creditPrice: 15, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_MEAL_PREP, memberId: MARIA_ID, type: 'offering', title: 'Weekly Meal Prep — Mexican Home Cooking', description: 'Five days of home-cooked meals: enchiladas, rice and beans, caldo, chile rellenos, and more. Feeds a family of four. Containers provided, just return them next week.', category: 'food', creditPrice: 40, availabilityType: 'ongoing', imageUrls: [] },

    // Jake Mitchell — home
    { id: L_LAWN, memberId: JAKE_M_ID, type: 'offering', title: 'Yard Maintenance & Lawn Care', description: 'Mowing, edging, weed-eating, and leaf blowing for standard Friendswood lots. I bring my own equipment. Weekly or one-time service available.', category: 'home', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_HANDYMAN, memberId: JAKE_M_ID, type: 'offering', title: 'General Handyman Service (2 hrs)', description: 'Two hours of handyman work: minor plumbing, drywall patching, door adjustments, shelf mounting, fixture installs. Bring your own materials or I can source them.', category: 'home', creditPrice: 30, availabilityType: 'ongoing', imageUrls: [] },

    // Priya — wellness
    { id: L_YOGA, memberId: PRIYA_ID, type: 'offering', title: 'Vinyasa Yoga Private Session', description: 'One-hour private vinyasa flow session tailored to your level. I bring mats and blocks. We can do it at your place, my studio, or outdoors at the Friendswood Park Pavilion.', category: 'wellness', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_MEDITATION, memberId: PRIYA_ID, type: 'offering', title: 'Guided Meditation (30 min)', description: 'A calming 30-minute guided meditation session. Great for stress relief, better sleep, or just a reset. Beginners absolutely welcome.', category: 'wellness', creditPrice: 12, availabilityType: 'ongoing', imageUrls: [] },

    // Marcus — services
    { id: L_TAX, memberId: MARCUS_ID, type: 'offering', title: 'Basic Tax Preparation Help', description: 'I will help you file your federal and state taxes using free e-file software. Covers W-2 income, standard deductions, and basic situations. Not a CPA, but 20 years of banking experience.', category: 'services', creditPrice: 30, availabilityType: 'one_time', imageUrls: [] },
    { id: L_FINANCE, memberId: MARCUS_ID, type: 'offering', title: 'Personal Budget Coaching (1 hr)', description: 'Sit down with me for an hour and we will build a realistic budget that actually works. I help with debt payoff strategies, savings goals, and cutting unnecessary expenses.', category: 'services', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },

    // Sarah — classes / food
    { id: L_SOURDOUGH_CLS, memberId: SARAH_ID, type: 'offering', title: 'Sourdough Bread Baking Class', description: 'Small-group class (max 4 people) in my Friendswood kitchen. You will learn to feed a starter, shape a boule, and bake in a Dutch oven. You go home with a fresh loaf and your own starter.', category: 'classes', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_BREAD, memberId: SARAH_ID, type: 'offering', title: 'Homemade Sourdough Bread (loaf)', description: 'One large sourdough boule, baked fresh. Crispy crust, chewy crumb. Available Tuesdays, Thursdays, and Saturdays. Message to reserve — they go fast.', category: 'food', creditPrice: 8, availabilityType: 'ongoing', imageUrls: [] },

    // David — services
    { id: L_BIKE, memberId: DAVID_ID, type: 'offering', title: 'Bicycle Tune-Up & Repair', description: 'Full tune-up: brakes, gears, chain, tire pressure, wheel true. I also do flat fixes, cable replacements, and brake pad swaps. Drop off at my garage in Friendswood.', category: 'services', creditPrice: 15, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_WOODWORK, memberId: DAVID_ID, type: 'offering', title: 'Custom Cutting Board (reclaimed wood)', description: 'Handmade cutting board from reclaimed oak or walnut. Each one is unique. Great as a gift or for your own kitchen. Takes about a week to complete.', category: 'handmade', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },

    // Aisha — wellness
    { id: L_TAROT, memberId: AISHA_ID, type: 'offering', title: 'Tarot Reading (30 min)', description: 'A 30-minute intuitive tarot session. We will pull cards together and explore what is showing up for you — career, relationships, personal growth. No spooky stuff, just honest reflection.', category: 'wellness', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_ENERGY, memberId: AISHA_ID, type: 'offering', title: 'Reiki Energy Healing Session', description: 'One-hour Reiki session to promote relaxation and energetic balance. Done in person at my home studio in Pearland. Comfortable clothing recommended.', category: 'wellness', creditPrice: 30, availabilityType: 'ongoing', imageUrls: [] },

    // Tom — services
    { id: L_PHOTO, memberId: TOM_ID, type: 'offering', title: 'Family Portrait Session (1 hr)', description: 'One-hour photo session at a location of your choice — your backyard, a park, or around Pearland. You get 20+ edited digital photos within a week.', category: 'services', creditPrice: 35, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_DRONE, memberId: TOM_ID, type: 'offering', title: 'Drone Aerial Photography', description: 'FAA Part 107 licensed drone pilot. Aerial photos and video for real estate, events, or just because your property looks incredible from above. Edited footage delivered in 48 hours.', category: 'services', creditPrice: 40, availabilityType: 'ongoing', imageUrls: [] },

    // Linda — skills / kids
    { id: L_MATH_TUTOR, memberId: LINDA_ID, type: 'offering', title: 'Math Tutoring (1 hour)', description: 'One-on-one math tutoring for grades 5-12. Algebra, geometry, pre-calculus. I meet kids where they are and build confidence step by step. 22 years teaching experience.', category: 'skills', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_SCI_TUTOR, memberId: LINDA_ID, type: 'offering', title: 'Science Tutoring (1 hour)', description: 'Biology and chemistry tutoring for middle and high school students. Lab report help, test prep, and concept review. Patient, thorough, and encouraging.', category: 'kids', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },

    // Ben — services
    { id: L_DOG_WALK, memberId: BEN_ID, type: 'offering', title: 'Dog Walking (per walk)', description: '30-minute walk in the Friendswood neighborhood. I pick up, walk, and return your pup. Can handle up to 2 dogs at once. Rain or shine — your dog needs exercise.', category: 'services', creditPrice: 10, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_PET_SIT, memberId: BEN_ID, type: 'offering', title: 'Pet Sitting (overnight)', description: 'Overnight pet sitting at your home. I feed, walk, play, and send photo updates. Cats, dogs, and small animals welcome. Fully insured through a pet-sitting network.', category: 'services', creditPrice: 30, availabilityType: 'ongoing', imageUrls: [] },

    // Rosa — food / home
    { id: L_HERB_KIT, memberId: ROSA_ID, type: 'offering', title: 'Fresh Herb Starter Kit', description: 'Four potted herb starters: basil, cilantro, rosemary, and mint. Grown in my garden, ready for yours. Includes care instructions and soil tips for Friendswood clay.', category: 'food', creditPrice: 10, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_GARDEN, memberId: ROSA_ID, type: 'offering', title: 'Garden Setup Consultation', description: 'I visit your yard, assess sun, soil, and space, and give you a planting plan for vegetables, herbs, or flowers. Includes a written plan and a follow-up check-in after 2 weeks.', category: 'home', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },

    // James — home
    { id: L_FURNITURE, memberId: JAMES_ID, type: 'offering', title: 'Furniture Refinishing Consultation', description: 'Bring me a photo of your piece and I will tell you what it needs — sanding, staining, reupholstering, or structural repair. If we agree on the work, I will quote TU separately.', category: 'home', creditPrice: 15, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_HANDYMAN2, memberId: JAMES_ID, type: 'offering', title: 'Handyman Half-Day (4 hrs)', description: 'Four hours of skilled labor: drywall, electrical outlets, fence repair, painting, you name it. I have been doing this for 15 years. Materials are extra (you supply or I source).', category: 'home', creditPrice: 50, availabilityType: 'ongoing', imageUrls: [] },

    // Fatima — classes
    { id: L_CALLIGRAPHY, memberId: FATIMA_ID, type: 'offering', title: 'Arabic Calligraphy Workshop', description: 'A 90-minute hands-on workshop where you learn the basics of Arabic script with traditional reed pens and ink. All materials provided. No prior experience needed.', category: 'classes', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_ARABIC, memberId: FATIMA_ID, type: 'offering', title: 'Conversational Arabic Tutoring', description: 'One-hour conversational Arabic lesson for beginners. We cover greetings, common phrases, and pronunciation. Great for travel prep or connecting with Arabic-speaking neighbors.', category: 'skills', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },

    // Chris — classes
    { id: L_GUITAR, memberId: CHRIS_ID, type: 'offering', title: 'Guitar Lessons (Beginner)', description: 'One-hour guitar lesson at my home studio in Pearland. Acoustic or electric. We start with chords, strumming patterns, and your first song. All ages welcome.', category: 'classes', creditPrice: 25, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_MUSIC_PROD, memberId: CHRIS_ID, type: 'offering', title: 'Home Recording Session (2 hrs)', description: 'Two hours in my home studio to record vocals, guitar, or a simple demo. I handle the mixing and give you a polished track within a week. Bring your song, I will bring the sound.', category: 'services', creditPrice: 35, availabilityType: 'ongoing', imageUrls: [] },

    // Diana — services
    { id: L_MANICURE, memberId: DIANA_ID, type: 'offering', title: 'Gel Manicure at Home', description: 'Full gel manicure in the comfort of your home — or mine. Includes nail shaping, cuticle care, base coat, color, and top coat. Lasts 2-3 weeks. Pick from 50+ colors.', category: 'services', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_SKINCARE, memberId: DIANA_ID, type: 'offering', title: 'Basic Facial & Skincare Routine', description: 'A 45-minute facial with cleansing, exfoliation, mask, and moisturizer. Plus personalized product recommendations for your skin type. Great for self-care days.', category: 'wellness', creditPrice: 22, availabilityType: 'ongoing', imageUrls: [] },

    // Omar — tech
    { id: L_WEB_DESIGN, memberId: OMAR_ID, type: 'offering', title: 'Website Setup & Design', description: 'I will build you a clean, professional one-page website using modern tools. Perfect for small businesses, side projects, or personal portfolios. Includes hosting setup guidance.', category: 'tech', creditPrice: 40, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_TECH_SUPPORT, memberId: OMAR_ID, type: 'offering', title: 'Home Tech Support (1 hr)', description: 'One hour of tech help: WiFi setup, printer issues, phone transfers, smart home devices, computer tune-ups. No question is too basic — I am patient and I speak human.', category: 'tech', creditPrice: 15, availabilityType: 'ongoing', imageUrls: [] },

    // Elijah — wellness
    { id: L_TRAINING, memberId: ELIJAH_ID, type: 'offering', title: 'Personal Training Session (1 hr)', description: 'One-hour personal training session at the Friendswood Park Pavilion or your home. Strength, cardio, flexibility — customized to your goals. NASM certified. All fitness levels.', category: 'wellness', creditPrice: 30, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_NUTRITION, memberId: ELIJAH_ID, type: 'offering', title: 'Custom Meal Plan & Nutrition Coaching', description: 'A personalized weekly meal plan based on your goals, preferences, and budget. Includes a 30-minute coaching call and grocery list. Friendswood grocery stores in mind.', category: 'wellness', creditPrice: 20, availabilityType: 'ongoing', imageUrls: [] },

    // Lauren — offerings and needs
    { id: L_LAUREN_OFFER, memberId: LAUREN_ID, type: 'offering', title: 'Neighborhood Welcome Package', description: 'I put together a welcome package for new Friendswood neighbors: local restaurant recommendations, park guide, school info, a hand-written note, and an intro to the xChangeMakers community.', category: 'other', creditPrice: 5, availabilityType: 'ongoing', imageUrls: [] },
    { id: L_LAUREN_NEED, memberId: LAUREN_ID, type: 'need', title: 'Looking for Someone to Help with Moving', description: 'My friend is moving into a house on Lamonte Lane next weekend. Need 2-3 strong people to help load and unload a U-Haul. Should take about 3-4 hours. Happy to provide lunch and TU.', category: 'services', creditPrice: 25, availabilityType: 'one_time', needStatus: 'offered', publicLocationLabel: 'Lamonte Lane area', isUrgent: false, imageUrls: [] },

    // Need listings from various members
    { id: L_NEED_MOVING, memberId: JAKE_M_ID, type: 'need', title: 'Need Help Hauling Old Fence Lumber', description: 'I just tore down my back fence and have a truck-bed worth of old cedar to haul to the dump. Need one more person with a truck or strong back for about 2 hours.', category: 'services', creditPrice: 20, availabilityType: 'one_time', needStatus: 'live', publicLocationLabel: 'Friendswood west side', isUrgent: true, imageUrls: [] },
    { id: L_NEED_TUTOR, memberId: TOM_ID, type: 'need', title: 'Need Math Tutor for My 8th Grader', description: 'My daughter is struggling with pre-algebra and has a big test coming up. Looking for someone patient who can make math click. Weekday afternoons preferred.', category: 'kids', creditPrice: 25, availabilityType: 'ongoing', needStatus: 'live', publicLocationLabel: 'West Friendswood / Friendswood', recurringNote: 'Weekly after school if it is a good fit.', imageUrls: [] },
    { id: L_NEED_CAKE, memberId: AISHA_ID, type: 'need', title: 'Looking for Homemade Birthday Cake', description: 'My mom turns 65 next Saturday. Looking for someone who can bake a beautiful homemade cake — vanilla or carrot cake preferred. Nothing fancy, just made with love.', category: 'food', creditPrice: 25, availabilityType: 'one_time', needStatus: 'live', publicLocationLabel: 'Pearland pickup area', imageUrls: [] },
    { id: L_NEED_WIFI, memberId: MARCUS_ID, type: 'need', title: 'Need Help Setting Up Home WiFi', description: 'Just got a new mesh WiFi system and have no idea how to set it up. Three access points, lots of dead zones to fix. Need someone who actually knows networking.', category: 'tech', creditPrice: 15, availabilityType: 'one_time', needStatus: 'live', publicLocationLabel: 'Friendswood north side', isUrgent: true, imageUrls: [] },
    { id: L_NEED_SPANISH, memberId: BEN_ID, type: 'need', title: 'Looking for Spanish Conversation Partner', description: 'I took Spanish in high school and want to practice again. Looking for a native speaker to do casual conversation over coffee once a week. I can trade dog walking or pet sitting.', category: 'skills', creditPrice: 10, availabilityType: 'ongoing', needStatus: 'live', publicLocationLabel: 'Friendswood Coffee & Books', recurringNote: 'Open to a weekly rhythm.', imageUrls: [] },
  ])

  console.log('  38 listings inserted.')

  // ── 3b. Timed Needs & Helper Preferences ────────────────────────────────
  console.log('Inserting timed needs and helper preferences...')

  const urgentFenceStart = hoursFromNow(2)
  const urgentFenceEnd = hoursFromNow(4)
  const wifiStart = hoursFromNow(1)
  const wifiEnd = hoursFromNow(2)

  await db.insert(schema.needWindows).values([
    {
      id: NW_LAUREN_MOVE,
      needId: L_LAUREN_NEED,
      startsAt: atRelativeDay(2, 14),
      endsAt: atRelativeDay(2, 17),
      label: 'Preferred moving window',
      isFlexible: false,
      status: 'offered',
    },
    {
      id: NW_FENCE_LUMBER,
      needId: L_NEED_MOVING,
      startsAt: urgentFenceStart,
      endsAt: urgentFenceEnd,
      label: 'Today before sunset',
      isFlexible: true,
      status: 'open',
    },
    {
      id: NW_MATH_TUTOR,
      needId: L_NEED_TUTOR,
      startsAt: atRelativeDay(3, 16),
      endsAt: atRelativeDay(3, 17),
      label: 'After school',
      isFlexible: true,
      status: 'open',
    },
    {
      id: NW_MATH_TUTOR_ALT,
      needId: L_NEED_TUTOR,
      startsAt: atRelativeDay(4, 18, 30),
      endsAt: atRelativeDay(4, 19, 30),
      label: 'Backup evening option',
      isFlexible: true,
      status: 'open',
    },
    {
      id: NW_CAKE,
      needId: L_NEED_CAKE,
      startsAt: atRelativeDay(5, 10),
      endsAt: atRelativeDay(5, 12),
      label: 'Pickup window',
      isFlexible: false,
      status: 'open',
    },
    {
      id: NW_WIFI,
      needId: L_NEED_WIFI,
      startsAt: wifiStart,
      endsAt: wifiEnd,
      label: 'ASAP setup help',
      isFlexible: true,
      status: 'open',
    },
    {
      id: NW_SPANISH,
      needId: L_NEED_SPANISH,
      startsAt: atRelativeDay(4, 9),
      endsAt: atRelativeDay(4, 10),
      label: 'Coffee practice',
      isFlexible: true,
      status: 'open',
    },
  ])

  await db.insert(schema.needOffers).values([
    {
      id: NO_DAVID_MOVE,
      needId: L_LAUREN_NEED,
      windowId: NW_LAUREN_MOVE,
      helperId: DAVID_ID,
      message: 'I can bring a dolly and help with loading.',
      status: 'offered',
    },
    {
      id: NO_JAMES_MOVE,
      needId: L_LAUREN_NEED,
      windowId: NW_LAUREN_MOVE,
      helperId: JAMES_ID,
      message: 'Available for the full window and can handle heavy furniture.',
      status: 'offered',
    },
  ])

  await db.insert(schema.helperPreferences).values([
    {
      memberId: LAUREN_ID,
      categories: ['services', 'kids', 'home', 'other'],
      radiusMiles: 10,
      urgentOnly: false,
      digestFrequency: 'daily',
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00',
    },
    {
      memberId: DAVID_ID,
      categories: ['services', 'home', 'tech'],
      radiusMiles: 8,
      urgentOnly: false,
      digestFrequency: 'immediate',
    },
    {
      memberId: LINDA_ID,
      categories: ['kids', 'skills', 'classes'],
      radiusMiles: 6,
      urgentOnly: false,
      digestFrequency: 'daily',
    },
    {
      memberId: MARIA_ID,
      categories: ['food', 'services'],
      radiusMiles: 5,
      urgentOnly: false,
      digestFrequency: 'weekly',
    },
    {
      memberId: OMAR_ID,
      categories: ['tech', 'services'],
      radiusMiles: 12,
      urgentOnly: true,
      digestFrequency: 'immediate',
    },
  ])

  await db.insert(schema.memberIntentProfiles).values([
    {
      memberId: LAUREN_ID,
      canHelpCategories: ['services', 'kids', 'home', 'other'],
      needsHelpCategories: ['services', 'home', 'food'],
      happeningInterests: ['community', 'social', 'exchange_event', 'food'],
      radiusMiles: 10,
      notificationFrequency: 'daily',
      shareAvailability: true,
    },
    {
      memberId: DAVID_ID,
      canHelpCategories: ['services', 'home', 'tech'],
      needsHelpCategories: ['food', 'classes'],
      happeningInterests: ['markets', 'classes', 'community'],
      radiusMiles: 5,
      notificationFrequency: 'immediate',
      shareAvailability: true,
    },
    {
      memberId: PRIYA_ID,
      canHelpCategories: ['wellness', 'classes'],
      needsHelpCategories: ['food', 'home'],
      happeningInterests: ['fitness', 'classes', 'social'],
      radiusMiles: 10,
      notificationFrequency: 'daily',
      shareAvailability: true,
    },
    {
      memberId: OMAR_ID,
      canHelpCategories: ['tech', 'services'],
      needsHelpCategories: ['home', 'services'],
      happeningInterests: ['classes', 'exchange_event'],
      radiusMiles: 10,
      notificationFrequency: 'weekly',
      shareAvailability: true,
    },
    {
      memberId: LINDA_ID,
      canHelpCategories: ['kids', 'skills', 'classes'],
      needsHelpCategories: ['tech', 'home'],
      happeningInterests: ['kids', 'community', 'classes'],
      radiusMiles: 15,
      notificationFrequency: 'daily',
      shareAvailability: true,
    },
  ])

  console.log('  7 timed need windows, 2 helper offers, 5 helper preference rows, 5 intent profiles inserted.')

  // ── 4. Exchanges ────────────────────────────────────────────────────────
  console.log('Inserting exchanges...')

  const twoDaysFromNow = daysFromNow(2)

  await db.insert(schema.exchanges).values([
    // Exchange 1: completed — Lauren got tamales from Maria
    {
      id: EX_LAUREN_TAMALES,
      listingId: L_TAMALES,
      providerId: MARIA_ID,
      requesterId: LAUREN_ID,
      status: 'completed',
      tuAmount: 15,
      scheduledAt: daysAgo(5),
      completedAt: daysAgo(4),
    },
    // Exchange 2: in_escrow — Lauren booked yoga with Priya
    {
      id: EX_LAUREN_YOGA,
      listingId: L_YOGA,
      providerId: PRIYA_ID,
      requesterId: LAUREN_ID,
      status: 'in_escrow',
      tuAmount: 25,
      scheduledAt: twoDaysFromNow,
      completedAt: null,
    },
    // Exchange 3: requested — Ben wants guitar lessons from Chris
    {
      id: EX_BEN_GUITAR,
      listingId: L_GUITAR,
      providerId: CHRIS_ID,
      requesterId: BEN_ID,
      status: 'requested',
      tuAmount: 25,
      scheduledAt: null,
      completedAt: null,
    },
    // Exchange 4: completed — Sarah got bike repair from David
    {
      id: EX_SARAH_BIKE,
      listingId: L_BIKE,
      providerId: DAVID_ID,
      requesterId: SARAH_ID,
      status: 'completed',
      tuAmount: 15,
      scheduledAt: daysAgo(10),
      completedAt: daysAgo(9),
    },
    // Reverse reviews (unique constraint: 1 review per exchange, so reverse reviewers need separate exchanges)
    {
      id: EX_TAMALE_REVERSE,
      listingId: L_LAUREN_OFFER,
      providerId: LAUREN_ID,
      requesterId: MARIA_ID,
      status: 'completed',
      tuAmount: 5,
      scheduledAt: daysAgo(5),
      completedAt: daysAgo(4),
    },
    {
      id: EX_BIKE_REVERSE,
      listingId: L_BREAD,
      providerId: SARAH_ID,
      requesterId: DAVID_ID,
      status: 'completed',
      tuAmount: 8,
      scheduledAt: daysAgo(10),
      completedAt: daysAgo(9),
    },
    // Past exchanges for reputation data
    {
      id: EX_PAST_01,
      listingId: L_LAWN,
      providerId: JAKE_M_ID,
      requesterId: MARCUS_ID,
      status: 'completed',
      tuAmount: 20,
      scheduledAt: daysAgo(20),
      completedAt: daysAgo(19),
    },
    {
      id: EX_PAST_02,
      listingId: L_DOG_WALK,
      providerId: BEN_ID,
      requesterId: ROSA_ID,
      status: 'completed',
      tuAmount: 10,
      scheduledAt: daysAgo(15),
      completedAt: daysAgo(15),
    },
    {
      id: EX_PAST_03,
      listingId: L_MANICURE,
      providerId: DIANA_ID,
      requesterId: PRIYA_ID,
      status: 'completed',
      tuAmount: 20,
      scheduledAt: daysAgo(12),
      completedAt: daysAgo(12),
    },
    {
      id: EX_PAST_04,
      listingId: L_HERB_KIT,
      providerId: ROSA_ID,
      requesterId: JAMES_ID,
      status: 'completed',
      tuAmount: 10,
      scheduledAt: daysAgo(8),
      completedAt: daysAgo(8),
    },
    {
      id: EX_PAST_05,
      listingId: L_TECH_SUPPORT,
      providerId: OMAR_ID,
      requesterId: LINDA_ID,
      status: 'completed',
      tuAmount: 15,
      scheduledAt: daysAgo(6),
      completedAt: daysAgo(6),
    },
  ])

  console.log('  11 exchanges inserted.')

  // ── 5. Bookings ─────────────────────────────────────────────────────────
  console.log('Inserting bookings...')

  await db.insert(schema.bookings).values([
    {
      id: BOOKING_YOGA,
      exchangeId: EX_LAUREN_YOGA,
      providerId: PRIYA_ID,
      requesterId: LAUREN_ID,
      date: twoDaysFromNow,
      startTime: '09:00',
      endTime: '10:00',
      status: 'confirmed',
    },
  ])

  console.log('  1 booking inserted.')

  // ── 6. Availability Slots ───────────────────────────────────────────────
  console.log('Inserting availability slots...')

  await db.insert(schema.availabilitySlots).values([
    // Lauren: beta coordinator availability
    { memberId: LAUREN_ID, dayOfWeek: 2, startTime: '14:00', endTime: '20:00', isRecurring: true },
    { memberId: LAUREN_ID, dayOfWeek: 4, startTime: '17:00', endTime: '20:00', isRecurring: true },
    { memberId: LAUREN_ID, dayOfWeek: 6, startTime: '10:00', endTime: '13:00', isRecurring: true },

    // Priya: Mon/Wed/Fri mornings, Tue/Thu evenings
    { memberId: PRIYA_ID, dayOfWeek: 1, startTime: '06:00', endTime: '09:00', isRecurring: true },
    { memberId: PRIYA_ID, dayOfWeek: 3, startTime: '06:00', endTime: '09:00', isRecurring: true },
    { memberId: PRIYA_ID, dayOfWeek: 5, startTime: '06:00', endTime: '09:00', isRecurring: true },
    { memberId: PRIYA_ID, dayOfWeek: 2, startTime: '18:00', endTime: '21:00', isRecurring: true },
    { memberId: PRIYA_ID, dayOfWeek: 4, startTime: '18:00', endTime: '21:00', isRecurring: true },

    // Maria: Mon-Fri mornings
    { memberId: MARIA_ID, dayOfWeek: 1, startTime: '08:00', endTime: '13:00', isRecurring: true },
    { memberId: MARIA_ID, dayOfWeek: 2, startTime: '08:00', endTime: '13:00', isRecurring: true },
    { memberId: MARIA_ID, dayOfWeek: 3, startTime: '08:00', endTime: '13:00', isRecurring: true },
    { memberId: MARIA_ID, dayOfWeek: 4, startTime: '08:00', endTime: '13:00', isRecurring: true },
    { memberId: MARIA_ID, dayOfWeek: 5, startTime: '08:00', endTime: '13:00', isRecurring: true },

    // Jake Mitchell: Mon-Sat daytime
    { memberId: JAKE_M_ID, dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isRecurring: true },
    { memberId: JAKE_M_ID, dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isRecurring: true },
    { memberId: JAKE_M_ID, dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isRecurring: true },
    { memberId: JAKE_M_ID, dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isRecurring: true },
    { memberId: JAKE_M_ID, dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isRecurring: true },
    { memberId: JAKE_M_ID, dayOfWeek: 6, startTime: '09:00', endTime: '14:00', isRecurring: true },

    // David: Afternoons + Saturday
    { memberId: DAVID_ID, dayOfWeek: 1, startTime: '13:00', endTime: '18:00', isRecurring: true },
    { memberId: DAVID_ID, dayOfWeek: 3, startTime: '13:00', endTime: '18:00', isRecurring: true },
    { memberId: DAVID_ID, dayOfWeek: 5, startTime: '13:00', endTime: '18:00', isRecurring: true },
    { memberId: DAVID_ID, dayOfWeek: 6, startTime: '09:00', endTime: '16:00', isRecurring: true },

    // Linda: Weekday afternoons
    { memberId: LINDA_ID, dayOfWeek: 1, startTime: '15:00', endTime: '19:00', isRecurring: true },
    { memberId: LINDA_ID, dayOfWeek: 2, startTime: '15:00', endTime: '19:00', isRecurring: true },
    { memberId: LINDA_ID, dayOfWeek: 3, startTime: '15:00', endTime: '19:00', isRecurring: true },
    { memberId: LINDA_ID, dayOfWeek: 4, startTime: '15:00', endTime: '19:00', isRecurring: true },
    { memberId: LINDA_ID, dayOfWeek: 5, startTime: '15:00', endTime: '19:00', isRecurring: true },

    // Chris: Afternoons and evenings
    { memberId: CHRIS_ID, dayOfWeek: 1, startTime: '14:00', endTime: '20:00', isRecurring: true },
    { memberId: CHRIS_ID, dayOfWeek: 2, startTime: '14:00', endTime: '20:00', isRecurring: true },
    { memberId: CHRIS_ID, dayOfWeek: 4, startTime: '14:00', endTime: '20:00', isRecurring: true },
    { memberId: CHRIS_ID, dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isRecurring: true },

    // Diana: Wed-Sun by appointment
    { memberId: DIANA_ID, dayOfWeek: 3, startTime: '10:00', endTime: '18:00', isRecurring: true },
    { memberId: DIANA_ID, dayOfWeek: 4, startTime: '10:00', endTime: '18:00', isRecurring: true },
    { memberId: DIANA_ID, dayOfWeek: 5, startTime: '10:00', endTime: '18:00', isRecurring: true },
    { memberId: DIANA_ID, dayOfWeek: 6, startTime: '10:00', endTime: '18:00', isRecurring: true },
    { memberId: DIANA_ID, dayOfWeek: 0, startTime: '12:00', endTime: '17:00', isRecurring: true },

    // Elijah: Early mornings and evenings
    { memberId: ELIJAH_ID, dayOfWeek: 1, startTime: '05:00', endTime: '08:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 2, startTime: '05:00', endTime: '08:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 3, startTime: '05:00', endTime: '08:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 4, startTime: '05:00', endTime: '08:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 5, startTime: '05:00', endTime: '08:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 1, startTime: '17:00', endTime: '20:00', isRecurring: true },
    { memberId: ELIJAH_ID, dayOfWeek: 3, startTime: '17:00', endTime: '20:00', isRecurring: true },
  ])

  console.log('  43 availability slots inserted.')

  // ── 7. Reviews ──────────────────────────────────────────────────────────
  console.log('Inserting reviews...')

  await db.insert(schema.reviews).values([
    // Lauren reviewed Maria (tamale exchange)
    { id: REV_LAUREN_MARIA, exchangeId: EX_LAUREN_TAMALES, reviewerId: LAUREN_ID, revieweeId: MARIA_ID, note: 'Best tamales in Friendswood! My family devoured them in one sitting. Maria is so warm and the quality is unbelievable.' },
    // Maria reviewed Lauren (on a separate exchange — unique constraint on exchange_id)
    { id: REV_MARIA_LAUREN, exchangeId: EX_TAMALE_REVERSE, reviewerId: MARIA_ID, revieweeId: LAUREN_ID, note: 'Lauren is the sweetest. She picked up right on time and even brought me a sourdough loaf from Sarah. Love this community.' },
    // Sarah reviewed David (bike exchange)
    { id: REV_SARAH_DAVID, exchangeId: EX_SARAH_BIKE, reviewerId: SARAH_ID, revieweeId: DAVID_ID, note: 'Bike runs like new! David found a bent spoke I did not even know about. Thorough and fast.' },
    // David reviewed Sarah (on a separate exchange — unique constraint on exchange_id)
    { id: REV_DAVID_SARAH, exchangeId: EX_BIKE_REVERSE, reviewerId: DAVID_ID, revieweeId: SARAH_ID, note: 'Sarah dropped off the bike and brought a loaf of sourdough. Generous neighbor.' },
    // Past exchange reviews
    { id: REV_PAST_01, exchangeId: EX_PAST_01, reviewerId: MARCUS_ID, revieweeId: JAKE_M_ID, note: 'Jake did a fantastic job on the yard. Showed up early, worked fast, left everything clean.' },
    { id: REV_PAST_02, exchangeId: EX_PAST_02, reviewerId: ROSA_ID, revieweeId: BEN_ID, note: 'Ben is wonderful with my dog. She was exhausted and happy when he brought her back.' },
    { id: REV_PAST_03, exchangeId: EX_PAST_03, reviewerId: PRIYA_ID, revieweeId: DIANA_ID, note: 'Beautiful manicure that lasted almost three weeks. Diana has great attention to detail.' },
    { id: REV_PAST_04, exchangeId: EX_PAST_04, reviewerId: JAMES_ID, revieweeId: ROSA_ID, note: 'Rosa brought the most beautiful herb starters. The basil is already thriving.' },
    { id: REV_PAST_05, exchangeId: EX_PAST_05, reviewerId: LINDA_ID, revieweeId: OMAR_ID, note: 'Omar fixed my WiFi dead zone in 20 minutes. Patient, clear, and did not make me feel silly for not knowing.' },
  ])

  console.log('  9 reviews inserted.')

  // ── 8. Reputation Tags ─────────────────────────────────────────────────
  console.log('Inserting reputation tags...')

  await db.insert(schema.reputationTags).values([
    // Lauren → Maria: on_time, quality, friendly
    { reviewId: REV_LAUREN_MARIA, reviewerId: LAUREN_ID, revieweeId: MARIA_ID, tag: 'on_time' },
    { reviewId: REV_LAUREN_MARIA, reviewerId: LAUREN_ID, revieweeId: MARIA_ID, tag: 'quality' },
    { reviewId: REV_LAUREN_MARIA, reviewerId: LAUREN_ID, revieweeId: MARIA_ID, tag: 'friendly' },
    // Maria → Lauren: friendly, reliable
    { reviewId: REV_MARIA_LAUREN, reviewerId: MARIA_ID, revieweeId: LAUREN_ID, tag: 'friendly' },
    { reviewId: REV_MARIA_LAUREN, reviewerId: MARIA_ID, revieweeId: LAUREN_ID, tag: 'reliable' },
    // Sarah → David: quality, on_time, reliable
    { reviewId: REV_SARAH_DAVID, reviewerId: SARAH_ID, revieweeId: DAVID_ID, tag: 'quality' },
    { reviewId: REV_SARAH_DAVID, reviewerId: SARAH_ID, revieweeId: DAVID_ID, tag: 'on_time' },
    { reviewId: REV_SARAH_DAVID, reviewerId: SARAH_ID, revieweeId: DAVID_ID, tag: 'reliable' },
    // David → Sarah: friendly, generous
    { reviewId: REV_DAVID_SARAH, reviewerId: DAVID_ID, revieweeId: SARAH_ID, tag: 'friendly' },
    { reviewId: REV_DAVID_SARAH, reviewerId: DAVID_ID, revieweeId: SARAH_ID, tag: 'generous' },
    // Marcus → Jake M: on_time, quality, reliable
    { reviewId: REV_PAST_01, reviewerId: MARCUS_ID, revieweeId: JAKE_M_ID, tag: 'on_time' },
    { reviewId: REV_PAST_01, reviewerId: MARCUS_ID, revieweeId: JAKE_M_ID, tag: 'quality' },
    { reviewId: REV_PAST_01, reviewerId: MARCUS_ID, revieweeId: JAKE_M_ID, tag: 'reliable' },
    // Rosa → Ben: friendly, reliable
    { reviewId: REV_PAST_02, reviewerId: ROSA_ID, revieweeId: BEN_ID, tag: 'friendly' },
    { reviewId: REV_PAST_02, reviewerId: ROSA_ID, revieweeId: BEN_ID, tag: 'reliable' },
    // Priya → Diana: quality, great_communicator
    { reviewId: REV_PAST_03, reviewerId: PRIYA_ID, revieweeId: DIANA_ID, tag: 'quality' },
    { reviewId: REV_PAST_03, reviewerId: PRIYA_ID, revieweeId: DIANA_ID, tag: 'great_communicator' },
    // James → Rosa: quality, friendly
    { reviewId: REV_PAST_04, reviewerId: JAMES_ID, revieweeId: ROSA_ID, tag: 'quality' },
    { reviewId: REV_PAST_04, reviewerId: JAMES_ID, revieweeId: ROSA_ID, tag: 'friendly' },
    // Linda → Omar: great_communicator, friendly, on_time
    { reviewId: REV_PAST_05, reviewerId: LINDA_ID, revieweeId: OMAR_ID, tag: 'great_communicator' },
    { reviewId: REV_PAST_05, reviewerId: LINDA_ID, revieweeId: OMAR_ID, tag: 'friendly' },
    { reviewId: REV_PAST_05, reviewerId: LINDA_ID, revieweeId: OMAR_ID, tag: 'on_time' },
  ])

  console.log('  22 reputation tags inserted.')

  // ── 9. Happenings ───────────────────────────────────────────────────────
  console.log('Inserting happenings...')

  const thisSaturday = nextWeekday(6, 10) // Saturday at 10am
  const nextSunday = nextWeekday(0, 8)    // Sunday at 8am
  const tomorrow = daysFromNow(1)
  tomorrow.setHours(7, 0, 0, 0)
  const nextSaturday = new Date(thisSaturday)
  nextSaturday.setDate(nextSaturday.getDate() + 7)
  nextSaturday.setHours(10, 0, 0, 0)
  const nextWednesday = nextWeekday(3, 18) // Wednesday at 6pm

  await db.insert(schema.happenings).values([
    {
      id: HAP_EXCHANGE,
      hostId: LAUREN_ID,
      title: 'Friendswood Exchange Event',
      description: 'Our monthly neighborhood exchange! Bring your offerings, browse what your neighbors have, and meet new faces. Tamales, bread, handmade goods, and services all welcome. Everyone gets 1 bonus TU for attending.',
      category: 'exchange_event',
      location: 'Friendswood Community Park — Friendswood, TX 77546',
      latitude: '29.8088',
      longitude: '-95.3968',
      startAt: thisSaturday,
      endAt: new Date(thisSaturday.getTime() + 3 * 60 * 60 * 1000), // +3 hours
    },
    {
      id: HAP_FARMERS,
      hostId: ROSA_ID,
      title: 'Pearland Farmers Market',
      description: 'Weekly farmers market in Pearland. Local produce, herbs, honey, baked goods, and artisan products. Several xChangeMakers members will have booths — look for the TU sign to exchange time!',
      category: 'markets',
      location: 'Bay Area Farmers Market — Friendswood, TX 77546',
      latitude: '29.7925',
      longitude: '-95.3977',
      startAt: nextSunday,
      endAt: new Date(nextSunday.getTime() + 4 * 60 * 60 * 1000), // +4 hours
    },
    {
      id: HAP_YOGA,
      hostId: PRIYA_ID,
      title: 'Morning Yoga in the Park',
      description: 'Free community yoga class at the Friendswood Park Pavilion. All levels welcome — I bring extra mats. We will do 45 minutes of vinyasa flow followed by 15 minutes of guided meditation. Meet by the pavilion.',
      category: 'fitness',
      location: 'Friendswood Park Pavilion — 4201 S Friendswood Dr, Friendswood, TX 77546',
      latitude: '29.8120',
      longitude: '-95.4135',
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 1 * 60 * 60 * 1000), // +1 hour
    },
    {
      id: HAP_KIDS,
      hostId: LINDA_ID,
      title: 'Kids Craft & Play Day',
      description: 'A fun Saturday morning for kids ages 4-12. Arts and crafts, outdoor games, and a snack table. Parents welcome to stay and mingle. Hosted at the Friendswood Community Center.',
      category: 'kids',
      location: 'Friendswood Community Center — 1700 Lamonte Ln, Friendswood, TX 77546',
      latitude: '29.8105',
      longitude: '-95.3952',
      startAt: nextSaturday,
      endAt: new Date(nextSaturday.getTime() + 3 * 60 * 60 * 1000),
    },
    {
      id: HAP_SOURDOUGH,
      hostId: SARAH_ID,
      title: 'Intro to Sourdough',
      description: 'Small-group class (max 6) at my Friendswood kitchen. You will learn to create and feed a starter, shape your dough, and score it. Take home a fresh loaf and your own starter. Bring an apron!',
      category: 'classes',
      location: 'Sarah\'s Kitchen — Friendswood, TX 77546',
      latitude: '29.8100',
      longitude: '-95.4010',
      startAt: nextWednesday,
      endAt: new Date(nextWednesday.getTime() + 2.5 * 60 * 60 * 1000),
    },
    {
      id: HAP_CLEANUP,
      hostId: LAUREN_ID,
      title: 'Friendswood Community Cleanup',
      description: 'Quarterly neighborhood cleanup. We will walk the streets, pick up litter, trim overgrown sidewalk edges, and beautify our community. Bags, gloves, and water provided. Earn 2 TU for participating!',
      category: 'community',
      location: 'Meet at Friendswood Community Park — Friendswood, TX 77546',
      latitude: '29.8088',
      longitude: '-95.3968',
      startAt: daysFromNow(10),
      endAt: new Date(daysFromNow(10).getTime() + 3 * 60 * 60 * 1000),
    },
    {
      id: HAP_BOOKSWAP,
      hostId: FATIMA_ID,
      title: 'Book Swap Social',
      description: 'Bring a book, take a book. We will set up tables at Slowpokes Coffee, swap reads, and chat about what we have been reading. All genres welcome. Tea and pastries available for purchase.',
      category: 'social',
      location: 'Friendswood Coffee & Books — Friendswood, TX 77546',
      latitude: '29.8025',
      longitude: '-95.4035',
      startAt: daysFromNow(8),
      endAt: new Date(daysFromNow(8).getTime() + 2 * 60 * 60 * 1000),
    },
  ])

  console.log('  7 happenings inserted.')

  // ── 10. Happening RSVPs ────────────────────────────────────────────────
  console.log('Inserting RSVPs...')

  await db.insert(schema.happeningRsvps).values([
    // Friendswood Exchange Event (8 RSVPs)
    { happeningId: HAP_EXCHANGE, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_EXCHANGE, memberId: MARIA_ID, status: 'going' },
    { happeningId: HAP_EXCHANGE, memberId: SARAH_ID, status: 'going' },
    { happeningId: HAP_EXCHANGE, memberId: DAVID_ID, status: 'going' },
    { happeningId: HAP_EXCHANGE, memberId: ROSA_ID, status: 'going' },
    { happeningId: HAP_EXCHANGE, memberId: BEN_ID, status: 'interested' },
    { happeningId: HAP_EXCHANGE, memberId: JAMES_ID, status: 'interested' },
    { happeningId: HAP_EXCHANGE, memberId: ELIJAH_ID, status: 'going' },

    // Pearland Farmers Market (5 RSVPs)
    { happeningId: HAP_FARMERS, memberId: ROSA_ID, status: 'going' },
    { happeningId: HAP_FARMERS, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_FARMERS, memberId: MARIA_ID, status: 'going' },
    { happeningId: HAP_FARMERS, memberId: SARAH_ID, status: 'interested' },
    { happeningId: HAP_FARMERS, memberId: FATIMA_ID, status: 'interested' },

    // Morning Yoga (6 RSVPs)
    { happeningId: HAP_YOGA, memberId: PRIYA_ID, status: 'going' },
    { happeningId: HAP_YOGA, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_YOGA, memberId: AISHA_ID, status: 'going' },
    { happeningId: HAP_YOGA, memberId: DIANA_ID, status: 'going' },
    { happeningId: HAP_YOGA, memberId: ELIJAH_ID, status: 'interested' },
    { happeningId: HAP_YOGA, memberId: TOM_ID, status: 'interested' },

    // Kids Craft Day (4 RSVPs)
    { happeningId: HAP_KIDS, memberId: LINDA_ID, status: 'going' },
    { happeningId: HAP_KIDS, memberId: TOM_ID, status: 'going' },
    { happeningId: HAP_KIDS, memberId: LAUREN_ID, status: 'interested' },
    { happeningId: HAP_KIDS, memberId: MARIA_ID, status: 'interested' },

    // Sourdough Class (5 RSVPs)
    { happeningId: HAP_SOURDOUGH, memberId: SARAH_ID, status: 'going' },
    { happeningId: HAP_SOURDOUGH, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_SOURDOUGH, memberId: PRIYA_ID, status: 'going' },
    { happeningId: HAP_SOURDOUGH, memberId: FATIMA_ID, status: 'going' },
    { happeningId: HAP_SOURDOUGH, memberId: AISHA_ID, status: 'interested' },

    // Community Cleanup (6 RSVPs)
    { happeningId: HAP_CLEANUP, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_CLEANUP, memberId: JAKE_M_ID, status: 'going' },
    { happeningId: HAP_CLEANUP, memberId: MARCUS_ID, status: 'going' },
    { happeningId: HAP_CLEANUP, memberId: BEN_ID, status: 'going' },
    { happeningId: HAP_CLEANUP, memberId: ROSA_ID, status: 'interested' },
    { happeningId: HAP_CLEANUP, memberId: JAMES_ID, status: 'interested' },

    // Book Swap (3 RSVPs)
    { happeningId: HAP_BOOKSWAP, memberId: FATIMA_ID, status: 'going' },
    { happeningId: HAP_BOOKSWAP, memberId: LAUREN_ID, status: 'going' },
    { happeningId: HAP_BOOKSWAP, memberId: LINDA_ID, status: 'interested' },
  ])

  console.log('  37 RSVPs inserted.')

  // ── 11. Notifications ──────────────────────────────────────────────────
  console.log('Inserting notifications...')

  await db.insert(schema.notifications).values([
    {
      memberId: LAUREN_ID,
      type: 'offer_received',
      priority: 'high',
      title: 'David can help with moving boxes',
      body: 'David offered to help during your preferred moving window.',
      targetPath: '/needs',
      createdAt: hoursFromNow(-1),
    },
    {
      memberId: LAUREN_ID,
      type: 'matched_need',
      priority: 'normal',
      title: 'Yard work need matches your preferences',
      body: 'A neighbor needs help with plants and outdoor cleanup this week.',
      targetPath: '/needs?category=home',
      createdAt: hoursFromNow(-4),
    },
    {
      memberId: LAUREN_ID,
      type: 'event_match',
      priority: 'normal',
      title: 'Garden event nearby',
      body: 'The farmers market and garden meetup are active this week.',
      targetPath: '/happenings?category=markets',
      createdAt: daysAgo(1),
    },
    {
      memberId: LAUREN_ID,
      type: 'schedule_reminder',
      priority: 'high',
      title: 'Yoga exchange tomorrow',
      body: 'Your session with Priya is coming up. Open the exchange room for details.',
      targetPath: `/exchange/${EX_LAUREN_YOGA}`,
      createdAt: daysAgo(1),
      readAt: daysAgo(1),
    },
    {
      memberId: DAVID_ID,
      type: 'offer_accepted',
      priority: 'high',
      title: 'Lauren accepted your moving help',
      body: 'Your offer is queued for the moving boxes need.',
      targetPath: '/needs',
      createdAt: hoursFromNow(-2),
    },
    {
      memberId: PRIYA_ID,
      type: 'completion_prompt',
      priority: 'normal',
      title: 'Close the loop after yoga',
      body: 'After the session, mark the exchange complete so credits and reviews stay current.',
      targetPath: `/exchange/${EX_LAUREN_YOGA}`,
      createdAt: hoursFromNow(-6),
    },
  ])

  console.log('  6 notifications inserted.')

  // ── 12. Analytics Events ────────────────────────────────────────────────
  console.log('Inserting analytics events...')

  await db.insert(schema.analyticsEvents).values([
    {
      memberId: LAUREN_ID,
      eventType: 'need_posted',
      targetType: 'listing',
      targetId: L_NEED_MOVING,
      metadata: { category: 'services', isUrgent: false },
      createdAt: daysAgo(5),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'need_posted',
      targetType: 'listing',
      targetId: L_DOG_WALK,
      metadata: { category: 'kids', isUrgent: true },
      createdAt: daysAgo(2),
    },
    {
      memberId: SARAH_ID,
      eventType: 'need_posted',
      targetType: 'listing',
      targetId: L_NEED_WIFI,
      metadata: { category: 'tech', isUrgent: false },
      createdAt: daysAgo(3),
    },
    {
      memberId: BEN_ID,
      eventType: 'need_posted',
      targetType: 'listing',
      targetId: L_NEED_SPANISH,
      metadata: { category: 'home', isUrgent: false },
      createdAt: daysAgo(1),
    },
    {
      memberId: DAVID_ID,
      eventType: 'helper_offer_submitted',
      targetType: 'listing',
      targetId: L_NEED_MOVING,
      metadata: { category: 'services' },
      createdAt: hoursFromNow(-20),
    },
    {
      memberId: PRIYA_ID,
      eventType: 'helper_offer_submitted',
      targetType: 'listing',
      targetId: L_DOG_WALK,
      metadata: { category: 'kids' },
      createdAt: hoursFromNow(-18),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'offer_accepted',
      targetType: 'exchange',
      targetId: EX_LAUREN_YOGA,
      metadata: { needId: L_YOGA, helperId: PRIYA_ID },
      createdAt: daysAgo(1),
    },
    {
      memberId: MARIA_ID,
      eventType: 'exchange_completed',
      targetType: 'exchange',
      targetId: EX_LAUREN_TAMALES,
      metadata: { category: 'food' },
      createdAt: daysAgo(4),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'filter_applied',
      targetType: 'needs',
      metadata: { category: 'home', timeframe: 'week' },
      createdAt: hoursFromNow(-7),
    },
    {
      memberId: DAVID_ID,
      eventType: 'filter_applied',
      targetType: 'needs',
      metadata: { category: 'services', urgentOnly: true },
      createdAt: hoursFromNow(-5),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'event_rsvp',
      targetType: 'happening',
      targetId: HAP_FARMERS,
      metadata: { status: 'going' },
      createdAt: daysAgo(2),
    },
    {
      memberId: PRIYA_ID,
      eventType: 'event_rsvp',
      targetType: 'happening',
      targetId: HAP_YOGA,
      metadata: { status: 'going' },
      createdAt: daysAgo(2),
    },
    {
      memberId: MARCUS_ID,
      eventType: 'event_rsvp',
      targetType: 'happening',
      targetId: HAP_FARMERS,
      metadata: { status: 'interested' },
      createdAt: daysAgo(1),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'need_viewed',
      targetType: 'listing',
      targetId: L_NEED_WIFI,
      metadata: { category: 'home' },
      createdAt: hoursFromNow(-3),
    },
    {
      memberId: DAVID_ID,
      eventType: 'need_viewed',
      targetType: 'listing',
      targetId: L_NEED_MOVING,
      metadata: { category: 'services' },
      createdAt: hoursFromNow(-2),
    },
    {
      memberId: SARAH_ID,
      eventType: 'business_fallback_clicked',
      targetType: 'business',
      metadata: { category: 'home_services', sourceNeedId: L_NEED_WIFI },
      createdAt: hoursFromNow(-1),
    },
    {
      memberId: BEN_ID,
      eventType: 'business_fallback_clicked',
      targetType: 'business',
      metadata: { category: 'moving_help', sourceNeedId: L_NEED_MOVING },
      createdAt: hoursFromNow(-8),
    },
    {
      memberId: LAUREN_ID,
      eventType: 'need_reposted',
      targetType: 'listing',
      targetId: L_NEED_MOVING,
      metadata: { category: 'services' },
      createdAt: daysAgo(1),
    },
    {
      memberId: FATIMA_ID,
      eventType: 'need_posted',
      targetType: 'listing',
      targetId: L_NEED_TUTOR,
      metadata: { category: 'classes', isUrgent: false },
      createdAt: daysAgo(2),
    },
    {
      memberId: JAMES_ID,
      eventType: 'helper_dropped',
      targetType: 'listing',
      targetId: L_NEED_WIFI,
      metadata: { reason: 'schedule_conflict' },
      createdAt: daysAgo(1),
    },
    {
      memberId: MARIA_ID,
      eventType: 'offer_withdrawn',
      targetType: 'listing',
      targetId: L_NEED_MOVING,
      metadata: { reason: 'schedule_conflict' },
      createdAt: hoursFromNow(-18),
    },
    {
      memberId: AISHA_ID,
      eventType: 'need_cancelled',
      targetType: 'listing',
      targetId: L_NEED_CAKE,
      metadata: { reason: 'no_longer_needed' },
      createdAt: daysAgo(2),
    },
  ])

  console.log('  22 analytics events inserted.')

  // ── 13. Activity Feed ──────────────────────────────────────────────────
  console.log('Inserting activity feed...')

  await db.insert(schema.activityFeed).values([
    {
      type: 'new_listing',
      data: { memberId: MARIA_ID, memberName: 'Maria Gonzalez', listingTitle: 'Fresh Homemade Tamales (dozen)', listingId: L_TAMALES },
      createdAt: hoursFromNow(-2),
    },
    {
      type: 'new_member',
      data: { memberId: ELIJAH_ID, memberName: 'Elijah Banks', neighborhood: 'West Friendswood' },
      createdAt: hoursFromNow(-8),
    },
    {
      type: 'exchange_completed',
      data: { providerId: MARIA_ID, providerName: 'Maria Gonzalez', requesterId: LAUREN_ID, requesterName: 'Lauren Chen', listingTitle: 'Fresh Homemade Tamales (dozen)' },
      createdAt: daysAgo(4),
    },
    {
      type: 'happening_posted',
      data: { happeningId: HAP_EXCHANGE, title: 'Friendswood Exchange Event', hostName: 'Lauren Chen', when: 'this Saturday' },
      createdAt: daysAgo(3),
    },
    {
      type: 'treasury_milestone',
      data: { communityName: 'Friendswood', amount: 7000, milestone: '$7,000' },
      createdAt: daysAgo(3),
    },
    {
      type: 'weekly_stats',
      data: { exchangesThisWeek: 14, newMembers: 2, communityName: 'Friendswood' },
      createdAt: daysAgo(1),
    },
    {
      type: 'new_listing',
      data: { memberId: ELIJAH_ID, memberName: 'Elijah Banks', listingTitle: 'Personal Training Session (1 hr)', listingId: L_TRAINING },
      createdAt: daysAgo(1),
    },
    {
      type: 'exchange_completed',
      data: { providerId: DAVID_ID, providerName: 'David Kim', requesterId: SARAH_ID, requesterName: 'Sarah Chen', listingTitle: 'Bicycle Tune-Up & Repair' },
      createdAt: daysAgo(9),
    },
    {
      type: 'new_listing',
      data: { memberId: OMAR_ID, memberName: 'Omar Singh', listingTitle: 'Website Setup & Design', listingId: L_WEB_DESIGN },
      createdAt: daysAgo(5),
    },
    {
      type: 'happening_posted',
      data: { happeningId: HAP_YOGA, title: 'Morning Yoga in the Park', hostName: 'Priya Patel', when: 'tomorrow morning' },
      createdAt: daysAgo(2),
    },
    {
      type: 'new_member',
      data: { memberId: DIANA_ID, memberName: 'Diana Tran', neighborhood: 'Friendswood' },
      createdAt: daysAgo(12),
    },
    {
      type: 'exchange_completed',
      data: { providerId: OMAR_ID, providerName: 'Omar Singh', requesterId: LINDA_ID, requesterName: 'Linda Okafor', listingTitle: 'Home Tech Support (1 hr)' },
      createdAt: daysAgo(6),
    },
    {
      type: 'new_listing',
      data: { memberId: FATIMA_ID, memberName: 'Fatima Al-Rashid', listingTitle: 'Arabic Calligraphy Workshop', listingId: L_CALLIGRAPHY },
      createdAt: daysAgo(7),
    },
    {
      type: 'happening_posted',
      data: { happeningId: HAP_BOOKSWAP, title: 'Book Swap Social', hostName: 'Fatima Al-Rashid', when: 'next week' },
      createdAt: daysAgo(4),
    },
    {
      type: 'exchange_completed',
      data: { providerId: DIANA_ID, providerName: 'Diana Tran', requesterId: PRIYA_ID, requesterName: 'Priya Patel', listingTitle: 'Gel Manicure at Home' },
      createdAt: daysAgo(12),
    },
    {
      type: 'new_listing',
      data: { memberId: CHRIS_ID, memberName: 'Chris Morgan', listingTitle: 'Guitar Lessons (Beginner)', listingId: L_GUITAR },
      createdAt: daysAgo(8),
    },
    {
      type: 'weekly_stats',
      data: { exchangesThisWeek: 11, newMembers: 3, communityName: 'Friendswood' },
      createdAt: daysAgo(8),
    },
    {
      type: 'new_member',
      data: { memberId: CHRIS_ID, memberName: 'Chris Morgan', neighborhood: 'Pearland' },
      createdAt: daysAgo(15),
    },
  ])

  console.log('  18 activity feed items inserted.')

  // ── 12. Treasury ───────────────────────────────────────────────────────
  console.log('Inserting treasury...')

  await db.insert(schema.treasury).values([
    {
      id: TREASURY_FRIENDSWOOD,
      communityName: 'Friendswood',
      balance: '7240',
      tier: 'established',
      exchangesThisWeek: 14,
      totalExchanges: 89,
      totalMembers: 127,
    },
  ])

  console.log('  1 treasury inserted.')

  // ── 13. Conversations & Messages ───────────────────────────────────────
  console.log('Inserting conversations and messages...')

  // Create conversations
  await db.insert(schema.conversations).values([
    { id: CONV_LAUREN_MARIA, updatedAt: daysAgo(4) },
    { id: CONV_LAUREN_PRIYA, updatedAt: daysAgo(1) },
    { id: CONV_LAUREN_SARAH, updatedAt: daysAgo(2) },
  ])

  // Create participants
  await db.insert(schema.conversationParticipants).values([
    { conversationId: CONV_LAUREN_MARIA, memberId: LAUREN_ID, lastReadAt: daysAgo(4) },
    { conversationId: CONV_LAUREN_MARIA, memberId: MARIA_ID, lastReadAt: daysAgo(4) },
    { conversationId: CONV_LAUREN_PRIYA, memberId: LAUREN_ID, lastReadAt: daysAgo(1) },
    { conversationId: CONV_LAUREN_PRIYA, memberId: PRIYA_ID, lastReadAt: daysAgo(1) },
    { conversationId: CONV_LAUREN_SARAH, memberId: LAUREN_ID, lastReadAt: daysAgo(2) },
    { conversationId: CONV_LAUREN_SARAH, memberId: SARAH_ID, lastReadAt: daysAgo(3) },
  ])

  // Lauren <-> Maria (about tamales, 4 messages)
  await db.insert(schema.messages).values([
    {
      conversationId: CONV_LAUREN_MARIA,
      senderId: LAUREN_ID,
      content: 'Hi Maria! I saw your tamale listing and my mouth is literally watering. Can I order a dozen pork tamales for this weekend?',
      createdAt: daysAgo(6),
    },
    {
      conversationId: CONV_LAUREN_MARIA,
      senderId: MARIA_ID,
      content: 'Of course, mija! I am making a big batch on Friday. Pork with red chile. You want them spicy or medium?',
      createdAt: daysAgo(6),
    },
    {
      conversationId: CONV_LAUREN_MARIA,
      senderId: LAUREN_ID,
      content: 'Medium please! My husband cannot handle the heat lol. Can I pick them up Saturday morning around 10?',
      createdAt: daysAgo(5),
    },
    {
      conversationId: CONV_LAUREN_MARIA,
      senderId: MARIA_ID,
      content: 'Perfect, they will be warm and ready. I will text you my Friendswood pickup address. See you Saturday! ❤️',
      createdAt: daysAgo(5),
    },
  ])

  // Lauren <-> Priya (about yoga, 3 messages)
  await db.insert(schema.messages).values([
    {
      conversationId: CONV_LAUREN_PRIYA,
      senderId: LAUREN_ID,
      content: 'Hey Priya! I have been wanting to try yoga for months. Are you available this week for a private session?',
      createdAt: daysAgo(3),
    },
    {
      conversationId: CONV_LAUREN_PRIYA,
      senderId: PRIYA_ID,
      content: 'Hi Lauren! I would love that. I have a morning slot open in two days — 9 to 10am at the Friendswood Park Pavilion. Sound good? I will bring an extra mat for you.',
      createdAt: daysAgo(2),
    },
    {
      conversationId: CONV_LAUREN_PRIYA,
      senderId: LAUREN_ID,
      content: 'That is perfect! I booked it through the app. See you there — I am nervous but excited!',
      createdAt: daysAgo(1),
    },
  ])

  // Lauren <-> Sarah (about sourdough class, 2 messages)
  await db.insert(schema.messages).values([
    {
      conversationId: CONV_LAUREN_SARAH,
      senderId: LAUREN_ID,
      content: 'Sarah, I keep seeing your sourdough posts and I NEED to learn. Is there room in your next class?',
      createdAt: daysAgo(3),
    },
    {
      conversationId: CONV_LAUREN_SARAH,
      senderId: SARAH_ID,
      content: 'There is! Next Wednesday at 6pm, my Friendswood kitchen. Four spots total — you will be number three. Bring an apron and an appetite!',
      createdAt: daysAgo(2),
    },
  ])

  console.log('  3 conversations, 6 participants, 9 messages inserted.')

  // ── 14. Onboarding Progress ────────────────────────────────────────────
  console.log('Inserting onboarding progress...')

  await db.insert(schema.onboardingProgress).values([
    { memberId: LAUREN_ID, step: 'profile_photo',  completed: true,  tuEarned: 1, completedAt: daysAgo(45) },
    { memberId: LAUREN_ID, step: 'intro_vibe',     completed: true,  tuEarned: 1, completedAt: daysAgo(45) },
    { memberId: LAUREN_ID, step: 'add_offerings',  completed: true,  tuEarned: 2, completedAt: daysAgo(44) },
    { memberId: LAUREN_ID, step: 'post_need',      completed: true,  tuEarned: 1, completedAt: daysAgo(43) },
    { memberId: LAUREN_ID, step: 'rsvp_happening', completed: true,  tuEarned: 1, completedAt: daysAgo(40) },
    { memberId: LAUREN_ID, step: 'first_exchange',  completed: true,  tuEarned: 2, completedAt: daysAgo(4) },
    { memberId: LAUREN_ID, step: 'first_review',   completed: true,  tuEarned: 1, completedAt: daysAgo(4) },
    { memberId: LAUREN_ID, step: 'invite_neighbor', completed: false, tuEarned: 0, completedAt: null },
  ])

  console.log('  8 onboarding steps inserted.')

  // ── 15. Wallet Transactions (Lauren's TU history) ─────────────────────
  console.log('Inserting wallet transactions...')

  await db.insert(schema.walletTransactions).values([
    // Onboarding bonuses
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: uploaded profile photo', createdAt: daysAgo(45) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: set your vibe', createdAt: daysAgo(45) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: added first offering', createdAt: daysAgo(44) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: posted a need', createdAt: daysAgo(43) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: RSVP\'d to a happening', createdAt: daysAgo(40) },
    // Welcome bonus
    { walletId: LAUREN_WALLET, type: 'earned', amount: 50, description: 'Welcome to xChangeMakers! Here are your first 5 TU', createdAt: daysAgo(45) },
    // Exchange with Maria (tamales)
    { walletId: LAUREN_WALLET, type: 'escrow_hold',    amount: 15, description: 'Escrow held for tamale exchange with Maria', exchangeId: EX_LAUREN_TAMALES, createdAt: daysAgo(5) },
    { walletId: LAUREN_WALLET, type: 'escrow_release',  amount: 15, description: 'Exchange completed: tamales from Maria', exchangeId: EX_LAUREN_TAMALES, createdAt: daysAgo(4) },
    { walletId: LAUREN_WALLET, type: 'spent',           amount: 15, description: 'Paid Maria for Fresh Homemade Tamales', exchangeId: EX_LAUREN_TAMALES, createdAt: daysAgo(4) },
    // Onboarding: first exchange + review
    { walletId: LAUREN_WALLET, type: 'earned', amount: 15, description: 'Onboarding bonus: completed first exchange', createdAt: daysAgo(4) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Onboarding bonus: wrote first review', createdAt: daysAgo(4) },
    // Earned from providing Welcome Packages
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Earned for Neighborhood Welcome Package', createdAt: daysAgo(30) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Earned for Neighborhood Welcome Package', createdAt: daysAgo(20) },
    { walletId: LAUREN_WALLET, type: 'earned', amount: 5,  description: 'Earned for Neighborhood Welcome Package', createdAt: daysAgo(14) },
    // Yoga escrow (currently held)
    { walletId: LAUREN_WALLET, type: 'escrow_hold', amount: 25, description: 'Escrow held for yoga session with Priya', exchangeId: EX_LAUREN_YOGA, createdAt: daysAgo(1) },
    // Maria wallet transactions
    { walletId: MARIA_WALLET, type: 'earned', amount: 50, description: 'Welcome to xChangeMakers! Here are your first 5 TU', createdAt: daysAgo(38) },
    { walletId: MARIA_WALLET, type: 'earned', amount: 15, description: 'Earned for Fresh Homemade Tamales — Lauren Chen', exchangeId: EX_LAUREN_TAMALES, createdAt: daysAgo(4) },
    // Priya wallet transactions
    { walletId: PRIYA_WALLET, type: 'earned', amount: 50, description: 'Welcome to xChangeMakers! Here are your first 5 TU', createdAt: daysAgo(35) },
    // Sarah & David wallet transactions
    { walletId: SARAH_WALLET, type: 'spent', amount: 15, description: 'Paid David for Bicycle Tune-Up & Repair', exchangeId: EX_SARAH_BIKE, createdAt: daysAgo(9) },
    { walletId: DAVID_WALLET, type: 'earned', amount: 15, description: 'Earned for Bicycle Tune-Up & Repair — Sarah Chen', exchangeId: EX_SARAH_BIKE, createdAt: daysAgo(9) },
  ])

  console.log('  20 wallet transactions inserted.')

  // ── Done ────────────────────────────────────────────────────────────────
  console.log('')
  console.log('Seed complete!')
  console.log('  3 communities, 3 invite codes')
  console.log('  18 members')
  console.log('  18 demo auth accounts')
  console.log('  8 business profiles')
  console.log('  18 wallets')
  console.log('  38 listings')
  console.log('  7 timed need windows')
  console.log('  2 helper offers')
  console.log('  5 helper preference rows')
  console.log('  5 member intent profiles')
  console.log('  11 exchanges')
  console.log('  1 booking')
  console.log('  43 availability slots')
  console.log('  9 reviews')
  console.log('  22 reputation tags')
  console.log('  7 happenings')
  console.log('  37 RSVPs')
  console.log('  6 notifications')
  console.log('  20 analytics events')
  console.log('  18 activity feed items')
  console.log('  1 treasury')
  console.log('  3 conversations, 6 participants, 9 messages')
  console.log('  8 onboarding steps')
  console.log('  20 wallet transactions')
  console.log('')
  console.log('Protagonist: Lauren Chen (ID: ' + LAUREN_ID + ')')

  await client.end()
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
