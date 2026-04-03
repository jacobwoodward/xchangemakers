/**
 * Database initialization script for Docker.
 * Uses raw SQL via the postgres module — no drizzle-kit or tsx needed.
 * Runs schema creation + seed data in pure Node.js CJS.
 */

const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  // Check if schema exists
  const tables = await sql`
    SELECT count(*)::int as c FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'members'
  `;

  if (tables[0].c > 0) {
    // Schema exists, check if seeded
    const members = await sql`SELECT count(*)::int as c FROM members`;
    if (members[0].c > 0) {
      console.log(`Database ready: ${members[0].c} members found`);
      await sql.end();
      return;
    }
    console.log('Schema exists but no data — will seed');
  } else {
    console.log('Creating schema...');
    await createSchema();
    console.log('Schema created');
  }

  console.log('Seeding data...');
  await seedData();
  console.log('Seed complete');

  await sql.end();
}

async function createSchema() {
  // Create enums
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE membership_type AS ENUM ('standard', 'business', 'community_contribution');
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
      CREATE TYPE vitality_tier AS ENUM ('sprouting', 'growing', 'rooted', 'thriving');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE onboarding_step AS ENUM ('profile_photo', 'intro_vibe', 'add_offerings', 'post_need', 'rsvp_happening', 'first_exchange', 'first_review', 'invite_neighbor');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);

  // Create tables
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name varchar(100) NOT NULL,
      last_name varchar(100) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      avatar_url varchar(500),
      bio text,
      vibe varchar(200),
      neighborhood varchar(200) NOT NULL,
      latitude decimal(10,7) NOT NULL DEFAULT 0,
      longitude decimal(10,7) NOT NULL DEFAULT 0,
      is_available boolean NOT NULL DEFAULT true,
      availability_note varchar(500),
      membership_type membership_type NOT NULL DEFAULT 'standard',
      joined_at timestamptz NOT NULL DEFAULT now(),
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

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      wallet_id uuid NOT NULL REFERENCES wallets(id),
      type transaction_type NOT NULL,
      amount integer NOT NULL,
      description varchar(500),
      exchange_id uuid,
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
      image_urls jsonb NOT NULL DEFAULT '[]',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id),
      provider_id uuid NOT NULL REFERENCES members(id),
      requester_id uuid NOT NULL REFERENCES members(id),
      status exchange_status NOT NULL DEFAULT 'requested',
      eu_amount integer NOT NULL,
      scheduled_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      exchange_id uuid NOT NULL REFERENCES exchanges(id),
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

    CREATE TABLE IF NOT EXISTS treasury (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      community_name varchar(200) NOT NULL,
      balance decimal(12,2) NOT NULL DEFAULT 0,
      tier vitality_tier NOT NULL DEFAULT 'sprouting',
      exchanges_this_week integer NOT NULL DEFAULT 0,
      total_exchanges integer NOT NULL DEFAULT 0,
      total_members integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id),
      member_id uuid NOT NULL REFERENCES members(id),
      last_read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
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
      eu_earned integer NOT NULL DEFAULT 0,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );
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
    (${LAUREN}, 'Lauren', 'Chen', 'lauren@example.com', 'Community organizer and place-maker in Oak Forest.', 'Building bridges between neighbors', 'Oak Forest', 29.8105, -95.4100, 'standard'),
    (${MARIA}, 'Maria', 'Gonzalez', 'maria@example.com', 'Home cook sharing family recipes with the neighborhood.', 'Feeding the community one tamale at a time', 'Oak Forest', 29.8120, -95.4080, 'standard'),
    (${PRIYA}, 'Priya', 'Patel', 'priya@example.com', 'Certified yoga instructor offering private and group sessions.', 'Breathe. Move. Connect.', 'Garden Oaks', 29.8085, -95.4050, 'business'),
    (${SARAH}, 'Sarah', 'Chen', 'sarah@example.com', 'Sourdough baker and bread class teacher.', 'Life is what you bake of it', 'Oak Forest', 29.8115, -95.4120, 'standard'),
    (${DAVID}, 'David', 'Kim', 'david@example.com', 'Bike mechanic and woodworker.', 'Fixing things, building things', 'Heights', 29.8000, -95.3980, 'standard'),
    (${AISHA}, 'Aisha', 'Williams', 'aisha@example.com', 'Intuitive tarot reader and energy healer.', 'Helping you find your path', 'Oak Forest', 29.8095, -95.4090, 'standard'),
    (${TOM}, 'Tom', 'Rodriguez', 'tom@example.com', 'Photographer and drone pilot.', 'Capturing moments that matter', 'Heights', 29.8010, -95.3960, 'business'),
    (${MARCUS}, 'Marcus', 'Johnson', 'marcus@example.com', 'CPA offering tax prep and financial coaching.', 'Making finances make sense', 'Garden Oaks', 29.8070, -95.4060, 'standard')
  `;

  // Wallets
  await sql`INSERT INTO wallets (member_id, balance, total_earned, monthly_earned, escrow_held) VALUES
    (${LAUREN}, 120, 155, 35, 25), (${MARIA}, 85, 110, 20, 0), (${PRIYA}, 140, 200, 40, 0),
    (${SARAH}, 60, 80, 15, 0), (${DAVID}, 95, 130, 25, 0), (${AISHA}, 75, 100, 20, 0),
    (${TOM}, 110, 150, 30, 0), (${MARCUS}, 50, 65, 10, 0)
  `;

  // Listings
  await sql`INSERT INTO listings (member_id, type, title, description, category, credit_price) VALUES
    (${MARIA}, 'offering', 'Fresh Homemade Tamales (dozen)', 'Made with love using my grandmother''s recipe.', 'food', 15),
    (${PRIYA}, 'offering', 'Vinyasa Yoga Private Session', '60-minute session tailored to your level.', 'wellness', 25),
    (${SARAH}, 'offering', 'Sourdough Bread Baking Class', 'Learn to make sourdough from scratch.', 'classes', 20),
    (${SARAH}, 'offering', 'Homemade Sourdough Loaf', 'Freshly baked artisan sourdough bread.', 'food', 8),
    (${DAVID}, 'offering', 'Bicycle Tune-Up & Repair', 'Full tune-up including brakes, gears, and chain.', 'services', 15),
    (${AISHA}, 'offering', 'Tarot Reading (30 min)', 'Intuitive guidance for your questions.', 'wellness', 20),
    (${TOM}, 'offering', 'Family Portrait Session', '1-hour outdoor photo session with edited images.', 'services', 35),
    (${MARCUS}, 'offering', 'Basic Tax Preparation Help', 'Help filing simple returns and finding deductions.', 'services', 30),
    (${LAUREN}, 'offering', 'Community Event Planning', 'Help organizing neighborhood events and gatherings.', 'services', 15),
    (${LAUREN}, 'need', 'Looking for homemade birthday cake', 'Need a special cake for a neighborhood celebration.', 'food', 0),
    (${DAVID}, 'offering', 'Custom Wooden Cutting Board', 'Handcrafted from reclaimed hardwood.', 'handmade', 25),
    (${TOM}, 'offering', 'Drone Footage of Your Property', '4K aerial video and photos.', 'tech', 30)
  `;

  // Happenings
  const nextSat = new Date(); nextSat.setDate(nextSat.getDate() + (6 - nextSat.getDay() + 7) % 7 + (nextSat.getDay() === 6 ? 7 : 0));
  nextSat.setHours(10, 0, 0, 0);
  const nextSatEnd = new Date(nextSat); nextSatEnd.setHours(13, 0, 0, 0);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(7, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(8, 0, 0, 0);

  await sql`INSERT INTO happenings (host_id, title, description, category, location, start_at, end_at, latitude, longitude) VALUES
    (${LAUREN}, 'Oak Forest Exchange Event', 'Bring your goods and skills to share! Our monthly barter meetup.', 'exchange_event', 'Oak Forest Park', ${nextSat}, ${nextSatEnd}, 29.8105, -95.4100),
    (${PRIYA}, 'Morning Yoga in the Park', 'Free community yoga session. All levels welcome.', 'fitness', 'TC Jester Park', ${tomorrow}, ${tomorrowEnd}, 29.8090, -95.4070),
    (${SARAH}, 'Intro to Sourdough', 'Hands-on class to start your sourdough journey.', 'classes', 'Sarah''s Kitchen, Oak Forest', ${nextSat}, ${nextSatEnd}, 29.8115, -95.4120)
  `;

  // Treasury
  await sql`INSERT INTO treasury (community_name, balance, tier, exchanges_this_week, total_exchanges, total_members) VALUES
    ('Oak Forest', 7240, 'rooted', 14, 89, 127)
  `;

  // Activity feed
  await sql`INSERT INTO activity_feed (type, data, created_at) VALUES
    ('new_listing', ${JSON.stringify({memberName:'Maria Gonzalez',title:'Fresh Homemade Tamales'})}, now() - interval '1 hour'),
    ('new_member', ${JSON.stringify({memberName:'Marcus Johnson',neighborhood:'Garden Oaks'})}, now() - interval '3 hours'),
    ('exchange_completed', ${JSON.stringify({member1:'Lauren Chen',member2:'Maria Gonzalez'})}, now() - interval '6 hours'),
    ('happening_posted', ${JSON.stringify({title:'Oak Forest Exchange Event',date:nextSat.toISOString()})}, now() - interval '1 day'),
    ('treasury_milestone', ${JSON.stringify({communityName:'Oak Forest',amount:7000})}, now() - interval '2 days'),
    ('weekly_stats', ${JSON.stringify({count:14})}, now() - interval '3 days'),
    ('new_listing', ${JSON.stringify({memberName:'Priya Patel',title:'Vinyasa Yoga Private Session'})}, now() - interval '4 days'),
    ('new_listing', ${JSON.stringify({memberName:'David Kim',title:'Bicycle Tune-Up & Repair'})}, now() - interval '5 days')
  `;

  // Onboarding for Lauren (7 of 8 complete)
  await sql`INSERT INTO onboarding_progress (member_id, step, completed, eu_earned, completed_at) VALUES
    (${LAUREN}, 'profile_photo', true, 5, now() - interval '7 days'),
    (${LAUREN}, 'intro_vibe', true, 5, now() - interval '7 days'),
    (${LAUREN}, 'add_offerings', true, 5, now() - interval '6 days'),
    (${LAUREN}, 'post_need', true, 5, now() - interval '6 days'),
    (${LAUREN}, 'rsvp_happening', true, 5, now() - interval '5 days'),
    (${LAUREN}, 'first_exchange', true, 15, now() - interval '3 days'),
    (${LAUREN}, 'first_review', true, 5, now() - interval '3 days'),
    (${LAUREN}, 'invite_neighbor', false, 0, null)
  `;
}

run().catch(err => {
  console.error('DB init failed:', err.message);
  process.exit(0); // Don't crash the container — let Next.js start anyway
});
