#!/usr/bin/env bash
# Lateen OS — Backup platform data
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

load_env

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

echo "Backing up to ${BACKUP_DIR}..."

echo "  PostgreSQL..."
docker exec lateen-postgres pg_dumpall -U "${LATEEN_POSTGRES_USER:-lateen}" > "${BACKUP_DIR}/postgres-all.sql"

echo "  Redis..."
docker exec lateen-redis redis-cli -a "${LATEEN_REDIS_PASSWORD}" BGSAVE >/dev/null 2>&1 || true
sleep 2
docker cp lateen-redis:/data/dump.rdb "${BACKUP_DIR}/redis-dump.rdb" 2>/dev/null || echo "  Redis dump skipped"

echo "  Qdrant..."
curl -sf "http://localhost:${LATEEN_QDRANT_HOST_HTTP_PORT:-6333}/collections" -o "${BACKUP_DIR}/qdrant-collections.json" 2>/dev/null || echo "  Qdrant backup skipped"

cp "${ENV_FILE}" "${BACKUP_DIR}/env.snapshot"
compose ps -a > "${BACKUP_DIR}/compose-ps.txt"

echo "Backup complete: ${BACKUP_DIR}"
