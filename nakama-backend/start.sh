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
echo "Original DB_URL: '$DB_URL'"
echo "Testing sed command..."
TEST_ADDR=$(echo "$DB_URL" | sed 's|^postgresql://||')
echo "After sed: '$TEST_ADDR'"

DB_ADDR="$TEST_ADDR"

echo "Database Address: $(echo "$DB_ADDR" | sed 's|:[^@]*@|:***@|')"
echo "Final DB_ADDR for Nakama: '$DB_ADDR'"

# Validate DB_ADDR is not empty
if [ -z "$DB_ADDR" ]; then
  echo "ERROR: DB_ADDR is empty after processing DB_URL"
  echo "This indicates a problem with the DB_URL format or sed command"
  exit 1
fi

echo "=== Running database migration ==="
/nakama/nakama migrate up --database.address "$DB_ADDR"

# Starting Nakama server
# Note: CORS origins are best handled via NAKAMA_SOCKET_CORS_ALLOWED_ORIGIN 
# and NAKAMA_CONSOLE_CORS_ALLOWED_ORIGIN environment variables in production.

echo "=== Starting Nakama on port $PORT ==="
exec /nakama/nakama \
  --name nakama1 \
  --database.address "$DB_ADDR" \
  --logger.level INFO \
  --session.token_expiry_sec 7200 \
  --runtime.path /nakama/data/modules \
  --socket.port "$PORT"
