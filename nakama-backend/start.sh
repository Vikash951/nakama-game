#!/bin/sh
set -e

# Render injects PORT automatically; Nakama socket must match
PORT="${PORT:-7350}"

# Debug: Print environment variables
echo "=== Environment Variables ==="
echo "DB_HOST: ${DB_HOST:-not set}"
echo "DB_PORT: ${DB_PORT:-not set}"
echo "DB_USER: ${DB_USER:-not set}"
echo "DB_PASSWORD: ${DB_PASSWORD:-not set}"
echo "DB_NAME: ${DB_NAME:-not set}"
echo "PGUSER: ${PGUSER:-not set}"
echo "PGHOST: ${PGHOST:-not set}"
echo "PGPORT: ${PGPORT:-not set}"
echo "PGDATABASE: ${PGDATABASE:-not set}"

# Use external PostgreSQL environment variables (new format)
DB_HOST="${DB_HOST:-${PGHOST}}"
DB_PORT="${DB_PORT:-${PGPORT:-5432}}"
DB_USER="${DB_USER:-${PGUSER}}"
DB_PASSWORD="${DB_PASSWORD:-${PGPASSWORD}}"
DB_NAME="${DB_NAME:-${PGDATABASE:-nakama}}"

# Check if required variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "ERROR: Missing required database environment variables"
  echo "Please set: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT"
  echo "Or use legacy: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT"
  exit 1
fi

# Build the Nakama database address
DB_ADDR="${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "=== Database Configuration ==="
echo "Database Address: ${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}"

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
