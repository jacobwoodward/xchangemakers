#!/bin/sh
set -e

echo "=== xChangeMakers Starting ==="

# Parse host and port from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')

# Wait for Postgres to accept connections
echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  sleep 1
done
sleep 2
echo "Database is ready"

# Schema push + seed using tooling_modules as node_modules
# Create a symlink so require() resolution works naturally
if [ -d /app/tooling_modules ] && [ ! -L /app/tool_node_modules ]; then
  ln -sf /app/tooling_modules /app/tool_node_modules
fi

# Push schema
echo "Syncing database schema..."
cd /app && echo "yes" | node_modules=tooling_modules PATH="/app/tooling_modules/.bin:$PATH" NODE_PATH=/app/tooling_modules /app/tooling_modules/.bin/drizzle-kit push --force 2>&1 || echo "Schema push completed with warnings"

# Check if seed is needed and run it
echo "Checking if seed is needed..."
MEMBER_COUNT=$(NODE_PATH=/app/tooling_modules node -e "
  var p = require('/app/tooling_modules/postgres/cjs/src/index.js');
  var sql = p.default(process.env.DATABASE_URL);
  sql.unsafe('SELECT count(*)::int as c FROM information_schema.tables WHERE table_name = \'members\'')
    .then(function(r) {
      if (r[0].c === 0) { console.log('0'); return sql.end(); }
      return sql.unsafe('SELECT count(*)::int as c FROM members').then(function(r2) { console.log(r2[0].c); return sql.end(); });
    })
    .catch(function(e) { console.log('0'); sql.end(); });
" 2>/dev/null || echo "0")

if [ "$MEMBER_COUNT" = "0" ] || [ -z "$MEMBER_COUNT" ]; then
  echo "Seeding database..."
  NODE_PATH=/app/tooling_modules /app/tooling_modules/.bin/tsx src/db/seed.ts 2>&1 || echo "Seed skipped"
else
  echo "Database has $MEMBER_COUNT members, skipping seed"
fi

echo "Starting xChangeMakers on port ${PORT:-3000}"
exec node server.js
