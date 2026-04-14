#!/bin/sh
set -e

PORT="${PORT:-7350}"

# Debug: Print database URL
echo "=== Database Configuration ==="
echo "DB_URL: ${DB_URL:-not set}"

# Check if DB_URL is set
if [ -z "$DB_URL" ]; then
  echo "ERROR: DB_URL environment variable is not set"
  echo "Please set DB_URL to your PostgreSQL connection string"
  echo "Example: postgresql://user:password@host:port/database"
  exit 1
fi

# Extract database address from DB_URL (remove postgresql:// prefix)
DB_ADDR=$(echo "$DB_URL" | sed 's|^postgresql://||')

echo "Database Address: $(echo "$DB_ADDR" | sed 's|:[^@]*@|:***@|')"
echo "Final DB_ADDR for Nakama: $DB_ADDR"

echo "=== Running database migration ==="
/nakama/nakama migrate up --database.address "$DB_ADDR"

echo "=== Starting Nakama on port $PORT ==="
exec /nakama/nakama \
  --name nakama1 \
  --database.address "$DB_ADDR" \
  --logger.level INFO \
  --session.token_expiry_sec 7200 \
  --runtime.path /nakama/data/modules \
  --socket.port "$PORT" \
  --socket.cors_allowed_origin "*" \
  --console.cors_allowed_origin "*"
