#!/bin/sh
set -e

echo "╔══════════════════════════════════════════╗"
echo "║        xChangeMakers — Starting          ║"
echo "╚══════════════════════════════════════════╝"

# Wait for Postgres to accept connections
echo "⏳ Waiting for database..."
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
# Give Postgres a moment to fully initialize
sleep 2
echo "✅ Database is ready"

# Push schema (idempotent — safe to run every startup)
echo "📐 Syncing database schema..."
NODE_PATH=/app/deps_modules npx drizzle-kit push 2>&1 || echo "⚠️  Schema push may need manual review"

# Seed if the members table is empty
echo "📊 Checking seed status..."
MEMBER_COUNT=$(NODE_PATH=/app/deps_modules node -e "
  const p = require('postgres');
  const sql = p(process.env.DATABASE_URL);
  sql\`SELECT count(*)::int as c FROM information_schema.tables WHERE table_name = 'members'\`
    .then(r => {
      if (r[0].c === 0) { console.log('0'); return sql.end(); }
      return sql\`SELECT count(*)::int as c FROM members\`.then(r2 => { console.log(r2[0].c); return sql.end(); });
    })
    .catch(() => { console.log('0'); sql.end(); });
" 2>/dev/null)

if [ "$MEMBER_COUNT" = "0" ] || [ -z "$MEMBER_COUNT" ]; then
  echo "🌱 Seeding database..."
  NODE_PATH=/app/deps_modules npx tsx src/db/seed.ts 2>&1 || echo "⚠️  Seed skipped"
else
  echo "📊 Database has $MEMBER_COUNT members — skipping seed"
fi

echo "🚀 Starting xChangeMakers on port ${PORT:-3000}"
exec node server.js
