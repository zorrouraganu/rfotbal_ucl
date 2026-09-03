#!/usr/bin/env sh
set -eu

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
OUT_DIR="${OUT_DIR:-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUT_DIR"

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-wcpredictions}" "${POSTGRES_DB:-wcpredictions}" \
  > "$OUT_DIR/wcpredictions-$STAMP.sql"

echo "Backup written to $OUT_DIR/wcpredictions-$STAMP.sql"
