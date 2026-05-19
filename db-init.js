/**
 * Database initialization script for Docker.
 * Uses raw SQL via the postgres module — no drizzle-kit or tsx needed.
 * Runs schema creation + seed data in pure Node.js CJS.
 */

const crypto = require('crypto');
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);
const DEMO_PASSWORD_HASH = hashPasswordSync('password');
const COMMUNITY_SEEDS = [
  {
    id: '90000000-0000-4000-8000-000000000001',
    name: 'Friendswood',
    slug: 'friendswood',
    city: 'Friendswood',
    region: 'TX',
    postalCode: '77546',
    latitude: '29.5294000',
    longitude: '-95.2010000',
    inviteCode: 'FRIENDSWOOD',
  },
  {
    id: '90000000-0000-4000-8000-000000000002',
    name: 'West Friendswood',
    slug: 'west-friendswood',
    city: 'Friendswood',
    region: 'TX',
    postalCode: '77546',
    latitude: '29.5308000',
    longitude: '-95.2210000',
    inviteCode: 'WEST-FRIENDSWOOD',
  },
  {
    id: '90000000-0000-4000-8000-000000000003',
    name: 'Pearland',
    slug: 'pearland',
    city: 'Pearland',
    region: 'TX',
    postalCode: '77581',
    latitude: '29.5636000',
    longitude: '-95.2860000',
    inviteCode: 'PEARLAND',
  },
];

function hashPasswordSync(password) {
  const salt = 'local-demo-auth-salt';
  const key = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${key}`;
}

async function run() {
  // Apply idempotent migrations first — safe to run on any schema version.
  // This handles the EU→TU rename (Phase 1) so existing prod DBs don't break.
  await migrate();

  // Check if schema exists
  const tables = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (tables[0].c > 0) {
    // Schema exists, check if seeded
    const members = await sql`SELECT count(*)::int as c FROM members`;
    if (members[0].c > 0) {
      await seedCommunities();
      await seedAuthAccounts();
      await ensureBusinessProfileTables();
      await ensureNotificationTables();
      await ensureAnalyticsEventTables();
      await ensureMemberIntentProfileTables();
      console.log(`Database ready: ${members[0].c} members found`);
      await sql.end();
      return;
    }
    console.log('Schema exists but no data — will seed');
  } else {
    console.log('Creating schema...');
    await createSchema();
    console.log('Schema created');
    await ensureBusinessProfileTables();
    await ensureNotificationTables();
    await ensureAnalyticsEventTables();
    await ensureMemberIntentProfileTables();
  }

  console.log('Seeding data...');
  await seedData();
  await ensurePhase5StewardshipColumns();
  await ensureBusinessProfileTables();
  await ensureNotificationTables();
  await ensureAnalyticsEventTables();
  await ensureMemberIntentProfileTables();
  await seedCommunities();
  await seedAuthAccounts();
  console.log('Seed complete');

  await sql.end();
}

/**
 * Idempotent migrations for upgrading in-place from previous schema versions.
 * Each step checks before altering so it's safe to run on any state:
 *   - fresh DB (nothing to rename)
 *   - pre-Phase-1 DB (old EU/vitality_tier names present)
 *   - post-Phase-1 DB (new names present — no-op)
 */
async function migrate() {
  // Phase 1: Rename eu_amount → tu_amount on exchanges
  await sql.unsafe(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'exchanges'
          AND column_name = 'eu_amount'
      ) THEN
        ALTER TABLE exchanges RENAME COLUMN eu_amount TO tu_amount;
        RAISE NOTICE 'Migrated: exchanges.eu_amount → tu_amount';
      END IF;
    END $$;
  `);

  // Phase 1: Rename eu_earned → tu_earned on onboarding_progress
  await sql.unsafe(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'onboarding_progress'
          AND column_name = 'eu_earned'
      ) THEN
        ALTER TABLE onboarding_progress RENAME COLUMN eu_earned TO tu_earned;
        RAISE NOTICE 'Migrated: onboarding_progress.eu_earned → tu_earned';
      END IF;
    END $$;
  `);

  // Phase 1: Rename vitality_tier enum → community_tier, relabel values.
  // ALTER TYPE RENAME VALUE is safe on existing data (stored by internal position).
  await sql.unsafe(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vitality_tier') THEN
        ALTER TYPE vitality_tier RENAME VALUE 'sprouting' TO 'starting';
        ALTER TYPE vitality_tier RENAME VALUE 'growing' TO 'active';
        ALTER TYPE vitality_tier RENAME VALUE 'rooted' TO 'established';
        ALTER TYPE vitality_tier RENAME VALUE 'thriving' TO 'strong';
        ALTER TYPE vitality_tier RENAME TO community_tier;
        RAISE NOTICE 'Migrated: vitality_tier → community_tier';
      END IF;
    END $$;
  `);

  await ensureCommunityTables();
  await seedCommunities();
  await ensureAuthTables();
  await ensureListingLifecycleColumns();
  await ensurePhase4ExchangeRoomColumns();
  await ensureTimedNeedsTables();
  await ensurePhase5StewardshipColumns();
  await ensureBusinessProfileTables();
  await ensureNotificationTables();
  await ensureAnalyticsEventTables();
  await ensureMemberIntentProfileTables();
}

async function ensureCommunityTables() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS communities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL UNIQUE,
      slug varchar(120) NOT NULL UNIQUE,
      city varchar(120) NOT NULL,
      region varchar(80) NOT NULL,
      postal_code varchar(20),
      center_latitude decimal(10,7) NOT NULL,
      center_longitude decimal(10,7) NOT NULL,
      status varchar(24) NOT NULL DEFAULT 'active',
      invite_only boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS community_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id uuid NOT NULL REFERENCES communities(id),
      code varchar(64) NOT NULL UNIQUE,
      label varchar(255) NOT NULL,
      max_uses integer,
      usage_count integer NOT NULL DEFAULT 0,
      expires_at timestamptz,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS community_invites_community_id_idx ON community_invites(community_id);
    CREATE INDEX IF NOT EXISTS communities_status_idx ON communities(status);
  `);

  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'members'
          AND column_name = 'community_id'
      ) THEN
        ALTER TABLE members ADD COLUMN community_id uuid REFERENCES communities(id);
      END IF;
    END $$;
  `);
}

async function ensureAuthTables() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS auth_accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
      email varchar(255) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id uuid NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
      token_hash varchar(64) NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS auth_sessions_token_hash_idx ON auth_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions(expires_at);
  `);
}

async function ensureListingLifecycleColumns() {
  const listingsTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'listings'
  `;

  if (listingsTable[0].c === 0) return;

  await sql.unsafe(`
    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS refreshed_at timestamptz,
      ADD COLUMN IF NOT EXISTS expires_at timestamptz;

    UPDATE listings
    SET
      refreshed_at = COALESCE(refreshed_at, updated_at, created_at, now()),
      expires_at = COALESCE(
        expires_at,
        COALESCE(refreshed_at, updated_at, created_at, now()) + interval '45 days'
      )
    WHERE refreshed_at IS NULL OR expires_at IS NULL;

    ALTER TABLE listings
      ALTER COLUMN refreshed_at SET DEFAULT now(),
      ALTER COLUMN refreshed_at SET NOT NULL,
      ALTER COLUMN expires_at SET DEFAULT (now() + interval '45 days'),
      ALTER COLUMN expires_at SET NOT NULL;

    CREATE INDEX IF NOT EXISTS listings_active_expires_at_idx
      ON listings(is_active, expires_at);
  `);
}

async function ensurePhase4ExchangeRoomColumns() {
  const exchangesTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'exchanges'
  `;

  if (exchangesTable[0].c === 0) return;

  await sql.unsafe(`
    ALTER TABLE exchanges
      ADD COLUMN IF NOT EXISTS idempotency_key varchar(160);

    DROP INDEX IF EXISTS exchanges_idempotency_key_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS exchanges_idempotency_key_unique
      ON exchanges(idempotency_key);

    ALTER TABLE wallet_transactions
      ADD COLUMN IF NOT EXISTS operation_key varchar(160);

    DROP INDEX IF EXISTS wallet_transactions_operation_key_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_operation_key_unique
      ON wallet_transactions(operation_key);

    ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS exchange_id uuid REFERENCES exchanges(id);

    DROP INDEX IF EXISTS conversations_exchange_id_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS conversations_exchange_id_unique
      ON conversations(exchange_id);

    DELETE FROM conversation_participants a
    USING conversation_participants b
    WHERE a.id > b.id
      AND a.conversation_id = b.conversation_id
      AND a.member_id = b.member_id;

    CREATE UNIQUE INDEX IF NOT EXISTS conversation_participants_member_unique
      ON conversation_participants(conversation_id, member_id);

    DELETE FROM bookings b
    USING (
      SELECT id, row_number() OVER (
        PARTITION BY exchange_id
        ORDER BY created_at DESC, id DESC
      ) AS rn
      FROM bookings
    ) ranked
    WHERE b.id = ranked.id
      AND ranked.rn > 1;

    CREATE UNIQUE INDEX IF NOT EXISTS bookings_exchange_unique
      ON bookings(exchange_id);
  `);
}

async function ensureTimedNeedsTables() {
  const baseTables = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('members', 'listings', 'exchanges')
  `;

  if (baseTables[0].c < 3) return;

  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE need_status AS ENUM ('draft', 'live', 'offered', 'assigned', 'confirmed', 'completed', 'cancelled', 'reposted', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE need_window_status AS ENUM ('open', 'offered', 'assigned', 'completed', 'cancelled', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE need_offer_status AS ENUM ('offered', 'accepted', 'declined', 'withdrawn', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE helper_digest_frequency AS ENUM ('immediate', 'daily', 'weekly', 'off');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS need_status need_status,
      ADD COLUMN IF NOT EXISTS public_location_label varchar(255),
      ADD COLUMN IF NOT EXISTS exact_location varchar(500),
      ADD COLUMN IF NOT EXISTS is_location_private boolean,
      ADD COLUMN IF NOT EXISTS is_urgent boolean,
      ADD COLUMN IF NOT EXISTS recurring_note varchar(255);

    UPDATE listings
    SET
      need_status = COALESCE(need_status, CASE WHEN type = 'need' THEN 'live'::need_status ELSE null END),
      is_location_private = COALESCE(is_location_private, true),
      is_urgent = COALESCE(is_urgent, false);

    ALTER TABLE listings
      ALTER COLUMN is_location_private SET DEFAULT true,
      ALTER COLUMN is_location_private SET NOT NULL,
      ALTER COLUMN is_urgent SET DEFAULT false,
      ALTER COLUMN is_urgent SET NOT NULL;

    CREATE TABLE IF NOT EXISTS need_windows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      need_id uuid NOT NULL REFERENCES listings(id),
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      label varchar(120),
      is_flexible boolean NOT NULL DEFAULT false,
      status need_window_status NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS need_offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      need_id uuid NOT NULL REFERENCES listings(id),
      window_id uuid NOT NULL REFERENCES need_windows(id),
      helper_id uuid NOT NULL REFERENCES members(id),
      message text,
      status need_offer_status NOT NULL DEFAULT 'offered',
      exchange_id uuid REFERENCES exchanges(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT need_offers_helper_window_unique UNIQUE (need_id, window_id, helper_id)
    );

    CREATE TABLE IF NOT EXISTS helper_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id),
      categories jsonb NOT NULL DEFAULT '[]',
      radius_miles integer NOT NULL DEFAULT 10,
      urgent_only boolean NOT NULL DEFAULT false,
      digest_frequency helper_digest_frequency NOT NULL DEFAULT 'daily',
      quiet_hours_start varchar(5),
      quiet_hours_end varchar(5),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS need_windows_need_id_idx ON need_windows(need_id);
    CREATE INDEX IF NOT EXISTS need_windows_start_status_idx ON need_windows(starts_at, status);
    CREATE INDEX IF NOT EXISTS need_offers_need_id_idx ON need_offers(need_id);
    CREATE INDEX IF NOT EXISTS need_offers_helper_id_idx ON need_offers(helper_id);
    CREATE INDEX IF NOT EXISTS need_offers_status_idx ON need_offers(status);
    CREATE INDEX IF NOT EXISTS need_offers_exchange_id_idx ON need_offers(exchange_id);
  `);
}

async function ensurePhase5StewardshipColumns() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE member_status AS ENUM ('pending', 'active', 'paused');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE steward_flag_target AS ENUM ('member', 'listing', 'exchange', 'happening');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE steward_flag_status AS ENUM ('open', 'resolved');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE members
      ADD COLUMN IF NOT EXISTS status member_status,
      ADD COLUMN IF NOT EXISTS is_steward boolean,
      ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

    UPDATE members
    SET status = COALESCE(status, 'active'::member_status),
        is_steward = COALESCE(is_steward, false);

    UPDATE members
    SET is_steward = true,
        status = 'active',
        reviewed_at = COALESCE(reviewed_at, now())
    WHERE id = 'a0000000-0000-4000-8000-000000000001'
       OR lower(email) IN ('lauren@example.com', 'lauren.chen@email.com');

    ALTER TABLE members
      ALTER COLUMN status SET DEFAULT 'active',
      ALTER COLUMN status SET NOT NULL,
      ALTER COLUMN is_steward SET DEFAULT false,
      ALTER COLUMN is_steward SET NOT NULL;

    CREATE TABLE IF NOT EXISTS steward_flags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      target_type steward_flag_target NOT NULL,
      target_id uuid NOT NULL,
      reason text NOT NULL,
      status steward_flag_status NOT NULL DEFAULT 'open',
      created_by_id uuid REFERENCES members(id),
      resolved_by_id uuid REFERENCES members(id),
      resolved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS steward_flags_status_idx ON steward_flags(status);
    CREATE INDEX IF NOT EXISTS steward_flags_target_idx ON steward_flags(target_type, target_id);
    CREATE INDEX IF NOT EXISTS steward_flags_created_by_idx ON steward_flags(created_by_id);
    CREATE INDEX IF NOT EXISTS need_windows_need_id_idx ON need_windows(need_id);
    CREATE INDEX IF NOT EXISTS need_windows_start_status_idx ON need_windows(starts_at, status);
    CREATE INDEX IF NOT EXISTS need_offers_need_id_idx ON need_offers(need_id);
    CREATE INDEX IF NOT EXISTS need_offers_helper_id_idx ON need_offers(helper_id);
    CREATE INDEX IF NOT EXISTS need_offers_status_idx ON need_offers(status);
    CREATE INDEX IF NOT EXISTS need_offers_exchange_id_idx ON need_offers(exchange_id);
  `);
}

async function ensureBusinessProfileTables() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
      business_name varchar(255) NOT NULL,
      categories json NOT NULL DEFAULT '[]',
      address varchar(500) NOT NULL,
      service_area varchar(255),
      phone varchar(40),
      website_url varchar(500),
      directions_url varchar(500),
      hours json NOT NULL DEFAULT '{}',
      photo_urls json NOT NULL DEFAULT '[]',
      contribution_notes text,
      contribution_badges json NOT NULL DEFAULT '[]',
      community_hours_contributed integer NOT NULL DEFAULT 0,
      rating decimal NOT NULL DEFAULT 5.0,
      review_count integer NOT NULL DEFAULT 0,
      is_community_favorite boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS business_profiles_member_id_idx ON business_profiles(member_id);
    CREATE INDEX IF NOT EXISTS business_profiles_business_name_idx ON business_profiles(business_name);
  `);
}

async function ensureNotificationTables() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM (
        'matched_need',
        'urgent_need',
        'offer_received',
        'offer_accepted',
        'backup_available',
        'event_match',
        'schedule_reminder',
        'completion_prompt'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE notification_priority AS ENUM ('normal', 'high', 'urgent');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      type notification_type NOT NULL,
      priority notification_priority NOT NULL DEFAULT 'normal',
      title varchar(180) NOT NULL,
      body text NOT NULL,
      target_path varchar(500) NOT NULL,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS notifications_member_created_idx
      ON notifications(member_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS notifications_member_unread_idx
      ON notifications(member_id)
      WHERE read_at IS NULL;
  `);
}

async function ensureAnalyticsEventTables() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid REFERENCES members(id) ON DELETE SET NULL,
      event_type varchar(80) NOT NULL,
      target_type varchar(60),
      target_id uuid,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS analytics_events_member_created_idx
      ON analytics_events(member_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx
      ON analytics_events(event_type, created_at DESC);
  `);
}

async function ensureMemberIntentProfileTables() {
  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS member_intent_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
      can_help_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
      needs_help_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
      happening_interests jsonb NOT NULL DEFAULT '[]'::jsonb,
      radius_miles integer NOT NULL DEFAULT 10,
      notification_frequency varchar(24) NOT NULL DEFAULT 'daily',
      share_availability boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS member_intent_profiles_member_idx
      ON member_intent_profiles(member_id);
  `);
}

async function createSchema() {
  // Create enums
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE membership_type AS ENUM ('standard', 'business', 'community_contribution');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE member_status AS ENUM ('pending', 'active', 'paused');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'escrow_hold', 'escrow_release', 'escrow_return');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE listing_type AS ENUM ('offering', 'need');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE listing_category AS ENUM ('food', 'services', 'skills', 'classes', 'handmade', 'wellness', 'tech', 'home', 'kids', 'other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE availability_type AS ENUM ('ongoing', 'one_time', 'event_only');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE need_status AS ENUM ('draft', 'live', 'offered', 'assigned', 'confirmed', 'completed', 'cancelled', 'reposted', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE need_window_status AS ENUM ('open', 'offered', 'assigned', 'completed', 'cancelled', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE need_offer_status AS ENUM ('offered', 'accepted', 'declined', 'withdrawn', 'expired');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE helper_digest_frequency AS ENUM ('immediate', 'daily', 'weekly', 'off');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE exchange_status AS ENUM ('requested', 'accepted', 'in_escrow', 'completed', 'cancelled', 'disputed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE reputation_tag AS ENUM ('on_time', 'quality', 'friendly', 'generous', 'reliable', 'great_communicator');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE happening_category AS ENUM ('kids', 'food', 'markets', 'fitness', 'classes', 'social', 'community', 'exchange_event');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE rsvp_status AS ENUM ('going', 'interested');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE activity_type AS ENUM ('new_listing', 'new_member', 'exchange_completed', 'happening_posted', 'treasury_milestone', 'weekly_stats');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM ('matched_need', 'urgent_need', 'offer_received', 'offer_accepted', 'backup_available', 'event_match', 'schedule_reminder', 'completion_prompt');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE notification_priority AS ENUM ('normal', 'high', 'urgent');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE community_tier AS ENUM ('starting', 'active', 'established', 'strong');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE onboarding_step AS ENUM ('profile_photo', 'intro_vibe', 'add_offerings', 'post_need', 'rsvp_happening', 'first_exchange', 'first_review', 'invite_neighbor');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE steward_flag_target AS ENUM ('member', 'listing', 'exchange', 'happening');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE steward_flag_status AS ENUM ('open', 'resolved');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  // Create tables
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS communities (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL UNIQUE,
      slug varchar(120) NOT NULL UNIQUE,
      city varchar(120) NOT NULL,
      region varchar(80) NOT NULL,
      postal_code varchar(20),
      center_latitude decimal(10,7) NOT NULL,
      center_longitude decimal(10,7) NOT NULL,
      status varchar(24) NOT NULL DEFAULT 'active',
      invite_only boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS community_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      community_id uuid NOT NULL REFERENCES communities(id),
      code varchar(64) NOT NULL UNIQUE,
      label varchar(255) NOT NULL,
      max_uses integer,
      usage_count integer NOT NULL DEFAULT 0,
      expires_at timestamptz,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name varchar(100) NOT NULL,
      last_name varchar(100) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      avatar_url varchar(500),
      bio text,
      vibe varchar(200),
      community_id uuid REFERENCES communities(id),
      neighborhood varchar(200) NOT NULL,
      latitude decimal(10,7) NOT NULL DEFAULT 0,
      longitude decimal(10,7) NOT NULL DEFAULT 0,
      is_available boolean NOT NULL DEFAULT true,
      availability_note varchar(500),
      membership_type membership_type NOT NULL DEFAULT 'standard',
      status member_status NOT NULL DEFAULT 'active',
      is_steward boolean NOT NULL DEFAULT false,
      reviewed_at timestamptz,
      joined_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS business_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
      business_name varchar(255) NOT NULL,
      categories json NOT NULL DEFAULT '[]',
      address varchar(500) NOT NULL,
      service_area varchar(255),
      phone varchar(40),
      website_url varchar(500),
      directions_url varchar(500),
      hours json NOT NULL DEFAULT '{}',
      photo_urls json NOT NULL DEFAULT '[]',
      contribution_notes text,
      contribution_badges json NOT NULL DEFAULT '[]',
      community_hours_contributed integer NOT NULL DEFAULT 0,
      rating decimal NOT NULL DEFAULT 5.0,
      review_count integer NOT NULL DEFAULT 0,
      is_community_favorite boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id),
      balance integer NOT NULL DEFAULT 0,
      total_earned integer NOT NULL DEFAULT 0,
      monthly_earned integer NOT NULL DEFAULT 0,
      escrow_held integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS helper_preferences (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id),
      categories jsonb NOT NULL DEFAULT '[]',
      radius_miles integer NOT NULL DEFAULT 10,
      urgent_only boolean NOT NULL DEFAULT false,
      digest_frequency helper_digest_frequency NOT NULL DEFAULT 'daily',
      quiet_hours_start varchar(5),
      quiet_hours_end varchar(5),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_id uuid NOT NULL REFERENCES wallets(id),
      type transaction_type NOT NULL,
      amount integer NOT NULL,
      description varchar(500),
      exchange_id uuid,
      operation_key varchar(160) UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS listings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL REFERENCES members(id),
      type listing_type NOT NULL,
      title varchar(200) NOT NULL,
      description text,
      category listing_category NOT NULL,
      credit_price integer NOT NULL DEFAULT 0,
      availability_type availability_type NOT NULL DEFAULT 'ongoing',
      need_status need_status,
      public_location_label varchar(255),
      exact_location varchar(500),
      is_location_private boolean NOT NULL DEFAULT true,
      is_urgent boolean NOT NULL DEFAULT false,
      recurring_note varchar(255),
      image_urls jsonb NOT NULL DEFAULT '[]',
      is_active boolean NOT NULL DEFAULT true,
      refreshed_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL DEFAULT (now() + interval '45 days'),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS need_windows (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      need_id uuid NOT NULL REFERENCES listings(id),
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      label varchar(120),
      is_flexible boolean NOT NULL DEFAULT false,
      status need_window_status NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id),
      provider_id uuid NOT NULL REFERENCES members(id),
      requester_id uuid NOT NULL REFERENCES members(id),
      idempotency_key varchar(160) UNIQUE,
      status exchange_status NOT NULL DEFAULT 'requested',
      tu_amount integer NOT NULL,
      scheduled_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS need_offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      need_id uuid NOT NULL REFERENCES listings(id),
      window_id uuid NOT NULL REFERENCES need_windows(id),
      helper_id uuid NOT NULL REFERENCES members(id),
      message text,
      status need_offer_status NOT NULL DEFAULT 'offered',
      exchange_id uuid REFERENCES exchanges(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT need_offers_helper_window_unique UNIQUE (need_id, window_id, helper_id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exchange_id uuid NOT NULL UNIQUE REFERENCES exchanges(id),
      provider_id uuid NOT NULL REFERENCES members(id),
      requester_id uuid NOT NULL REFERENCES members(id),
      date timestamptz NOT NULL,
      start_time varchar(10) NOT NULL,
      end_time varchar(10) NOT NULL,
      status booking_status NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS availability_slots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL REFERENCES members(id),
      day_of_week integer NOT NULL,
      start_time varchar(10) NOT NULL,
      end_time varchar(10) NOT NULL,
      is_recurring boolean NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exchange_id uuid NOT NULL REFERENCES exchanges(id),
      reviewer_id uuid NOT NULL REFERENCES members(id),
      reviewee_id uuid NOT NULL REFERENCES members(id),
      note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(exchange_id, reviewer_id)
    );

    CREATE TABLE IF NOT EXISTS reputation_tags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id uuid NOT NULL REFERENCES reviews(id),
      reviewer_id uuid NOT NULL REFERENCES members(id),
      reviewee_id uuid NOT NULL REFERENCES members(id),
      tag reputation_tag NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS happenings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      host_id uuid NOT NULL REFERENCES members(id),
      title varchar(200) NOT NULL,
      description text,
      category happening_category NOT NULL,
      location varchar(500) NOT NULL,
      latitude decimal(10,7),
      longitude decimal(10,7),
      start_at timestamptz NOT NULL,
      end_at timestamptz NOT NULL,
      image_url varchar(500),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS happening_rsvps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      happening_id uuid NOT NULL REFERENCES happenings(id),
      member_id uuid NOT NULL REFERENCES members(id),
      status rsvp_status NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS activity_feed (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type activity_type NOT NULL,
      data jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      type notification_type NOT NULL,
      priority notification_priority NOT NULL DEFAULT 'normal',
      title varchar(180) NOT NULL,
      body text NOT NULL,
      target_path varchar(500) NOT NULL,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid REFERENCES members(id) ON DELETE SET NULL,
      event_type varchar(80) NOT NULL,
      target_type varchar(60),
      target_id uuid,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS analytics_events_member_created_idx ON analytics_events(member_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS analytics_events_type_created_idx ON analytics_events(event_type, created_at DESC);

    CREATE TABLE IF NOT EXISTS member_intent_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
      can_help_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
      needs_help_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
      happening_interests jsonb NOT NULL DEFAULT '[]'::jsonb,
      radius_miles integer NOT NULL DEFAULT 10,
      notification_frequency varchar(24) NOT NULL DEFAULT 'daily',
      share_availability boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS member_intent_profiles_member_idx ON member_intent_profiles(member_id);

    CREATE TABLE IF NOT EXISTS treasury (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      community_name varchar(200) NOT NULL,
      balance decimal(12,2) NOT NULL DEFAULT 0,
      tier community_tier NOT NULL DEFAULT 'starting',
      exchanges_this_week integer NOT NULL DEFAULT 0,
      total_exchanges integer NOT NULL DEFAULT 0,
      total_members integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exchange_id uuid UNIQUE REFERENCES exchanges(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id),
      member_id uuid NOT NULL REFERENCES members(id),
      last_read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(conversation_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id),
      sender_id uuid NOT NULL REFERENCES members(id),
      content text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS onboarding_progress (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id uuid NOT NULL REFERENCES members(id),
      step onboarding_step NOT NULL,
      completed boolean NOT NULL DEFAULT false,
      tu_earned integer NOT NULL DEFAULT 0,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS steward_flags (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      target_type steward_flag_target NOT NULL,
      target_id uuid NOT NULL,
      reason text NOT NULL,
      status steward_flag_status NOT NULL DEFAULT 'open',
      created_by_id uuid REFERENCES members(id),
      resolved_by_id uuid REFERENCES members(id),
      resolved_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS steward_flags_status_idx ON steward_flags(status);
    CREATE INDEX IF NOT EXISTS steward_flags_target_idx ON steward_flags(target_type, target_id);
    CREATE INDEX IF NOT EXISTS steward_flags_created_by_idx ON steward_flags(created_by_id);
  `);
}

async function seedData() {
  // Minimal seed: 3 members, a few listings, 1 happening, treasury
  // The full seed uses the tsx-based seed.ts; this is a fallback for Docker
  const LAUREN = 'a0000000-0000-4000-8000-000000000001';
  const MARIA  = 'a0000000-0000-4000-8000-000000000002';
  const PRIYA  = 'a0000000-0000-4000-8000-000000000003';
  const SARAH  = 'a0000000-0000-4000-8000-000000000004';
  const DAVID  = 'a0000000-0000-4000-8000-000000000005';
  const AISHA  = 'a0000000-0000-4000-8000-000000000006';
  const TOM    = 'a0000000-0000-4000-8000-000000000007';
  const MARCUS = 'a0000000-0000-4000-8000-000000000008';

  // Members
  await sql`INSERT INTO members (id, first_name, last_name, email, bio, vibe, neighborhood, latitude, longitude, membership_type) VALUES
    (${LAUREN}, 'Lauren', 'Chen', 'lauren@example.com', 'Community organizer and place-maker in Friendswood.', 'Building bridges between neighbors', 'Friendswood', 29.8105, -95.4100, 'standard'),
    (${MARIA}, 'Maria', 'Gonzalez', 'maria@example.com', 'Home cook sharing family recipes with the neighborhood.', 'Feeding the community one tamale at a time', 'Friendswood', 29.8120, -95.4080, 'business'),
    (${PRIYA}, 'Priya', 'Patel', 'priya@example.com', 'Certified yoga instructor offering private and group sessions.', 'Breathe. Move. Connect.', 'West Friendswood', 29.8085, -95.4050, 'business'),
    (${SARAH}, 'Sarah', 'Chen', 'sarah@example.com', 'Sourdough baker and bread class teacher.', 'Life is what you bake of it', 'Friendswood', 29.8115, -95.4120, 'standard'),
    (${DAVID}, 'David', 'Kim', 'david@example.com', 'Bike mechanic and woodworker.', 'Fixing things, building things', 'Pearland', 29.8000, -95.3980, 'standard'),
    (${AISHA}, 'Aisha', 'Williams', 'aisha@example.com', 'Intuitive tarot reader and energy healer.', 'Helping you find your path', 'Friendswood', 29.8095, -95.4090, 'standard'),
    (${TOM}, 'Tom', 'Rodriguez', 'tom@example.com', 'Photographer and drone pilot.', 'Capturing moments that matter', 'Pearland', 29.8010, -95.3960, 'business'),
    (${MARCUS}, 'Marcus', 'Johnson', 'marcus@example.com', 'CPA offering tax prep and financial coaching.', 'Making finances make sense', 'West Friendswood', 29.8070, -95.4060, 'standard')
  `;

  await sql`
    INSERT INTO business_profiles (
      member_id,
      business_name,
      categories,
      address,
      service_area,
      phone,
      website_url,
      directions_url,
      hours,
      photo_urls,
      contribution_notes,
      contribution_badges,
      community_hours_contributed,
      rating,
      review_count,
      is_community_favorite
    )
    VALUES
      (
        ${MARIA},
        'The Treat House',
        ${JSON.stringify(['food_drink'])}::json,
        '1842 Cheshire Ln, Friendswood, TX 77546',
        'Friendswood',
        '(713) 555-0142',
        'https://example.com/the-treat-house',
        'https://www.google.com/maps/search/?api=1&query=1842+Cheshire+Ln+Friendswood+TX+77546',
        ${JSON.stringify({ Tue: '9:00 AM - 3:00 PM', Thu: '9:00 AM - 3:00 PM', Sat: '8:00 AM - 1:00 PM' })}::json,
        ${JSON.stringify(['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'])}::json,
        'Hosts baking tables and donates extra bread to meal trains.',
        ${JSON.stringify(['Meal trains', 'Workshop host'])}::json,
        28,
        4.9,
        36,
        true
      ),
      (
        ${PRIYA},
        'Sunrise Yoga Studio',
        ${JSON.stringify(['health_wellness'])}::json,
        '1020 W Parkwood Ave, Friendswood, TX 77546',
        'West Friendswood',
        '(713) 555-0165',
        'https://example.com/sunrise-yoga',
        'https://www.google.com/maps/search/?api=1&query=1020+W+Parkwood+Ave+Friendswood+TX+77546',
        ${JSON.stringify({ Mon: '6:30 AM - 7:30 PM', Wed: '6:30 AM - 7:30 PM', Sat: '8:00 AM - 12:00 PM' })}::json,
        ${JSON.stringify(['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80'])}::json,
        'Offers a free community class every first Saturday in the park.',
        ${JSON.stringify(['Free classes', 'Wellness access'])}::json,
        42,
        5.0,
        31,
        true
      ),
      (
        ${TOM},
        'Pearland Photo & Drone',
        ${JSON.stringify(['professional'])}::json,
        '1301 Broadway St, Pearland, TX 77581',
        'Pearland and Friendswood',
        '(713) 555-0198',
        'https://example.com/pearland-photo-drone',
        'https://www.google.com/maps/search/?api=1&query=1301+Broadway+St+Pearland+TX+77581',
        ${JSON.stringify({ Tue: 'By appointment', Thu: 'By appointment', Sat: '9:00 AM - 2:00 PM' })}::json,
        ${JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'])}::json,
        'Photographs neighborhood events and shares edited albums with organizers.',
        ${JSON.stringify(['Event photos', 'Local media'])}::json,
        14,
        4.8,
        20,
        false
      )
  `;

  // Wallets (1 TU = 1 hour of community time)
  await sql`INSERT INTO wallets (member_id, balance, total_earned, monthly_earned, escrow_held) VALUES
    (${LAUREN}, 12, 18, 4, 2), (${MARIA}, 8, 11, 2, 0), (${PRIYA}, 14, 20, 4, 0),
    (${SARAH}, 6, 8, 2, 0), (${DAVID}, 9, 13, 2, 0), (${AISHA}, 7, 10, 2, 0),
    (${TOM}, 11, 15, 3, 0), (${MARCUS}, 5, 7, 1, 0)
  `;

  // Listings (prices in TU, where 1 TU ≈ 1 hour of community time)
  await sql`INSERT INTO listings (member_id, type, title, description, category, credit_price) VALUES
    (${MARIA}, 'offering', 'Fresh Homemade Tamales (dozen)', 'Made with love using my grandmother''s recipe.', 'food', 2),
    (${PRIYA}, 'offering', 'Vinyasa Yoga Private Session', '60-minute session tailored to your level.', 'wellness', 1),
    (${SARAH}, 'offering', 'Sourdough Bread Baking Class', 'Learn to make sourdough from scratch.', 'classes', 3),
    (${SARAH}, 'offering', 'Homemade Sourdough Loaf', 'Freshly baked artisan sourdough bread.', 'food', 1),
    (${DAVID}, 'offering', 'Bicycle Tune-Up & Repair', 'Full tune-up including brakes, gears, and chain.', 'services', 2),
    (${AISHA}, 'offering', 'Tarot Reading (30 min)', 'Intuitive guidance for your questions.', 'wellness', 1),
    (${TOM}, 'offering', 'Family Portrait Session', '1-hour outdoor photo session with edited images.', 'services', 3),
    (${MARCUS}, 'offering', 'Basic Tax Preparation Help', 'Help filing simple returns and finding deductions.', 'services', 2),
    (${LAUREN}, 'offering', 'Community Event Planning', 'Help organizing neighborhood events and gatherings.', 'services', 3),
    (${LAUREN}, 'need', 'Looking for homemade birthday cake', 'Need a special cake for a neighborhood celebration.', 'food', 0),
    (${DAVID}, 'offering', 'Custom Wooden Cutting Board', 'Handcrafted from reclaimed hardwood.', 'handmade', 4),
    (${TOM}, 'offering', 'Drone Footage of Your Property', '4K aerial video and photos.', 'tech', 2)
  `;

  const needRows = await sql`
    SELECT id FROM listings
    WHERE member_id = ${LAUREN}
      AND type = 'need'
    LIMIT 1
  `;
  const laurenNeed = needRows[0];
  const moveStart = new Date();
  moveStart.setDate(moveStart.getDate() + 2);
  moveStart.setHours(14, 0, 0, 0);
  const moveEnd = new Date(moveStart);
  moveEnd.setHours(17, 0, 0, 0);

  if (laurenNeed) {
    await sql`
      UPDATE listings
      SET need_status = 'offered',
          public_location_label = 'Friendswood',
          is_location_private = true,
          is_urgent = false
      WHERE id = ${laurenNeed.id}
    `;

    const [window] = await sql`
      INSERT INTO need_windows (
        need_id,
        starts_at,
        ends_at,
        label,
        is_flexible,
        status
      )
      VALUES (
        ${laurenNeed.id},
        ${moveStart},
        ${moveEnd},
        'Preferred moving window',
        false,
        'offered'
      )
      RETURNING id
    `;

    await sql`
      INSERT INTO need_offers (need_id, window_id, helper_id, message, status)
      VALUES (
        ${laurenNeed.id},
        ${window.id},
        ${DAVID},
        'I can help load and unload during that window.',
        'offered'
      )
    `;
  }

  await sql`
    INSERT INTO helper_preferences (
      member_id,
      categories,
      radius_miles,
      urgent_only,
      digest_frequency
    )
    VALUES
      (${LAUREN}, ${JSON.stringify(['services', 'home', 'kids'])}::jsonb, 10, false, 'daily'),
      (${DAVID}, ${JSON.stringify(['services', 'home', 'tech'])}::jsonb, 8, false, 'immediate'),
      (${PRIYA}, ${JSON.stringify(['wellness', 'classes', 'kids'])}::jsonb, 6, false, 'daily')
    ON CONFLICT (member_id) DO NOTHING
  `;

  await sql`
    INSERT INTO member_intent_profiles (
      member_id,
      can_help_categories,
      needs_help_categories,
      happening_interests,
      radius_miles,
      notification_frequency,
      share_availability
    )
    VALUES
      (${LAUREN}, ${JSON.stringify(['services', 'home', 'kids'])}::jsonb, ${JSON.stringify(['services', 'food'])}::jsonb, ${JSON.stringify(['community', 'social', 'exchange_event'])}::jsonb, 10, 'daily', true),
      (${DAVID}, ${JSON.stringify(['services', 'home', 'tech'])}::jsonb, ${JSON.stringify(['food', 'classes'])}::jsonb, ${JSON.stringify(['markets', 'classes'])}::jsonb, 8, 'immediate', true),
      (${PRIYA}, ${JSON.stringify(['wellness', 'classes', 'kids'])}::jsonb, ${JSON.stringify(['home', 'food'])}::jsonb, ${JSON.stringify(['fitness', 'classes'])}::jsonb, 6, 'daily', true)
    ON CONFLICT (member_id) DO NOTHING
  `;

  // Happenings
  const nextSat = new Date(); nextSat.setDate(nextSat.getDate() + (6 - nextSat.getDay() + 7) % 7 + (nextSat.getDay() === 6 ? 7 : 0));
  nextSat.setHours(10, 0, 0, 0);
  const nextSatEnd = new Date(nextSat); nextSatEnd.setHours(13, 0, 0, 0);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(7, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(8, 0, 0, 0);

  await sql`INSERT INTO happenings (host_id, title, description, category, location, start_at, end_at, latitude, longitude) VALUES
    (${LAUREN}, 'Friendswood Exchange Event', 'Bring your goods and skills to share! Our monthly barter meetup.', 'exchange_event', 'Friendswood Park', ${nextSat}, ${nextSatEnd}, 29.8105, -95.4100),
    (${PRIYA}, 'Morning Yoga in the Park', 'Free community yoga session. All levels welcome.', 'fitness', 'Friendswood Park Pavilion', ${tomorrow}, ${tomorrowEnd}, 29.8090, -95.4070),
    (${SARAH}, 'Intro to Sourdough', 'Hands-on class to start your sourdough journey.', 'classes', 'Sarah''s Kitchen, Friendswood', ${nextSat}, ${nextSatEnd}, 29.8115, -95.4120)
  `;

  // Treasury
  await sql`INSERT INTO treasury (community_name, balance, tier, exchanges_this_week, total_exchanges, total_members) VALUES
    ('Friendswood', 7240, 'established', 14, 89, 127)
  `;

  // Activity feed
  await sql`INSERT INTO activity_feed (type, data, created_at) VALUES
    ('new_listing', ${JSON.stringify({memberName:'Maria Gonzalez',title:'Fresh Homemade Tamales'})}, now() - interval '1 hour'),
    ('new_member', ${JSON.stringify({memberName:'Marcus Johnson',neighborhood:'West Friendswood'})}, now() - interval '3 hours'),
    ('exchange_completed', ${JSON.stringify({member1:'Lauren Chen',member2:'Maria Gonzalez'})}, now() - interval '6 hours'),
    ('happening_posted', ${JSON.stringify({title:'Friendswood Exchange Event',date:nextSat.toISOString()})}, now() - interval '1 day'),
    ('treasury_milestone', ${JSON.stringify({communityName:'Friendswood',milestone:'7,000 TU exchanged'})}, now() - interval '2 days'),
    ('weekly_stats', ${JSON.stringify({count:14})}, now() - interval '3 days'),
    ('new_listing', ${JSON.stringify({memberName:'Priya Patel',title:'Vinyasa Yoga Private Session'})}, now() - interval '4 days'),
    ('new_listing', ${JSON.stringify({memberName:'David Kim',title:'Bicycle Tune-Up & Repair'})}, now() - interval '5 days')
  `;

  await sql`INSERT INTO notifications (member_id, type, priority, title, body, target_path, created_at) VALUES
    (${LAUREN}, 'offer_received', 'high', 'A neighbor can help', 'Someone offered to help with your open need.', '/needs', now() - interval '1 hour'),
    (${LAUREN}, 'matched_need', 'normal', 'New need matches your skills', 'A nearby need matches your helper preferences.', '/needs', now() - interval '3 hours'),
    (${LAUREN}, 'event_match', 'normal', 'Community event nearby', 'A happening matches your interests this week.', '/happenings', now() - interval '1 day')
  `;

  await sql`INSERT INTO analytics_events (member_id, event_type, target_type, target_id, metadata, created_at) VALUES
    (${LAUREN}, 'need_posted', 'listing', ${laurenNeed.id}, ${JSON.stringify({ category: 'services', isUrgent: false })}::jsonb, now() - interval '2 days'),
    (${DAVID}, 'helper_offer_submitted', 'listing', ${laurenNeed.id}, ${JSON.stringify({ category: 'services' })}::jsonb, now() - interval '1 day'),
    (${LAUREN}, 'filter_applied', 'needs', null, ${JSON.stringify({ category: 'home', timeframe: 'week' })}::jsonb, now() - interval '5 hours'),
    (${PRIYA}, 'event_rsvp', 'happening', null, ${JSON.stringify({ status: 'going' })}::jsonb, now() - interval '3 hours'),
    (${LAUREN}, 'business_fallback_clicked', 'business', null, ${JSON.stringify({ category: 'moving_help' })}::jsonb, now() - interval '2 hours')
  `;

  // Onboarding for Lauren (7 of 8 complete, 1 TU = 1 hour scale)
  await sql`INSERT INTO onboarding_progress (member_id, step, completed, tu_earned, completed_at) VALUES
    (${LAUREN}, 'profile_photo', true, 1, now() - interval '7 days'),
    (${LAUREN}, 'intro_vibe', true, 1, now() - interval '7 days'),
    (${LAUREN}, 'add_offerings', true, 2, now() - interval '6 days'),
    (${LAUREN}, 'post_need', true, 1, now() - interval '6 days'),
    (${LAUREN}, 'rsvp_happening', true, 1, now() - interval '5 days'),
    (${LAUREN}, 'first_exchange', true, 2, now() - interval '3 days'),
    (${LAUREN}, 'first_review', true, 1, now() - interval '3 days'),
    (${LAUREN}, 'invite_neighbor', false, 0, null)
  `;
}

async function seedCommunities() {
  for (const community of COMMUNITY_SEEDS) {
    await sql`
      INSERT INTO communities (
        id,
        name,
        slug,
        city,
        region,
        postal_code,
        center_latitude,
        center_longitude,
        status,
        invite_only
      )
      VALUES (
        ${community.id},
        ${community.name},
        ${community.slug},
        ${community.city},
        ${community.region},
        ${community.postalCode},
        ${community.latitude},
        ${community.longitude},
        'active',
        false
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        region = EXCLUDED.region,
        postal_code = EXCLUDED.postal_code,
        center_latitude = EXCLUDED.center_latitude,
        center_longitude = EXCLUDED.center_longitude,
        status = EXCLUDED.status,
        updated_at = now()
    `;

    await sql`
      INSERT INTO community_invites (community_id, code, label)
      VALUES (${community.id}, ${community.inviteCode}, ${`${community.name} neighborhood invite`})
      ON CONFLICT (code) DO UPDATE SET
        community_id = EXCLUDED.community_id,
        label = EXCLUDED.label,
        is_active = true,
        updated_at = now()
    `;
  }

  const membersTable = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (membersTable[0].c === 0) return;

  await sql.unsafe(`
    UPDATE members m
    SET community_id = c.id
    FROM communities c
    WHERE m.community_id IS NULL
      AND lower(m.neighborhood) = lower(c.name);

    UPDATE members
    SET community_id = (SELECT id FROM communities WHERE slug = 'friendswood')
    WHERE community_id IS NULL;
  `);
}

async function seedAuthAccounts() {
  await ensureAuthTables();

  const members = await sql`
    SELECT id, lower(email) as email FROM members
    WHERE email IS NOT NULL
  `;

  if (members.length === 0) return;

  for (const member of members) {
    await sql`
      INSERT INTO auth_accounts (member_id, email, password_hash)
      VALUES (${member.id}, ${member.email}, ${DEMO_PASSWORD_HASH})
      ON CONFLICT (email) DO NOTHING
    `;
  }
}

run().catch(err => {
  console.error('DB init failed:', err.message);
  process.exit(0); // Don't crash the container — let Next.js start anyway
});
