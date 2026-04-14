#!/bin/sh
set -e

# Railway injects PORT automatically; Nakama socket must match
PORT="${PORT:-7350}"

# Build the Nakama database address from Railway's Postgres env vars
DB_ADDR="${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

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
