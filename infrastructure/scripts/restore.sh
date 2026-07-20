#!/usr/bin/env bash
# Lateen OS — Restore platform data from backup
# Usage: restore.sh <backup-id>
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

load_env

BACKUP_ID="${1:?Usage: restore.sh <backup-id>}"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_ID}"

if [[ ! -d "${BACKUP_DIR}" ]]; then
  echo "Backup not found: ${BACKUP_DIR}" >&2
  exit 1
fi

echo "Restoring from ${BACKUP_DIR}..."

if [[ -f "${BACKUP_DIR}/postgres-all.sql" ]]; then
  echo "  PostgreSQL..."
  docker exec -i lateen-postgres psql -U "${LATEEN_POSTGRES_USER:-lateen}" < "${BACKUP_DIR}/postgres-all.sql" || true
fi

if [[ -f "${BACKUP_DIR}/redis-dump.rdb" ]]; then
  echo "  Redis (requires restart)..."
  compose stop redis || true
  docker cp "${BACKUP_DIR}/redis-dump.rdb" lateen-redis:/data/dump.rdb
  compose start redis || true
fi

echo "Restore complete. Verify with health.sh"
echo "Note: MinIO and Qdrant volume restore may require manual volume copy for full recovery."
