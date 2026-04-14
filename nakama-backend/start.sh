#!/bin/sh
set -e

PORT="${PORT:-7350}"


# Extract database address from DB_URL (remove postgresql:// prefix)
DB_ADDR=$(echo "$DB_URL" | sed 's|^postgresql://||')

echo "Database Address: $(echo "$DB_ADDR" | sed 's|:[^@]*@|:***@|')"

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
