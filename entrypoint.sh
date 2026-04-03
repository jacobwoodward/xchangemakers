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

# Run the schema + seed init script (Node.js, no external tooling needed)
echo "Initializing database..."
node /app/db-init.js 2>&1 || echo "DB init completed with warnings"

echo "Starting xChangeMakers on port ${PORT:-3000}"
exec node server.js
