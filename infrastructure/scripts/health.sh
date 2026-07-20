#!/usr/bin/env bash
# Lateen OS — Platform health checks
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

load_env

FAILED=0
PASSED=0

check() {
  local name="$1"
  local ok="$2"
  local detail="${3:-}"
  if [[ "${ok}" == "true" ]]; then
    echo "[OK]   ${name}"
    [[ -n "${detail}" ]] && echo "       ${detail}"
    PASSED=$((PASSED + 1))
  else
    echo "[FAIL] ${name}"
    [[ -n "${detail}" ]] && echo "       ${detail}"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "Lateen OS Platform Health Check"
echo "Env file: ${ENV_FILE}"
echo ""

# PostgreSQL
PG_OK=false
if docker exec lateen-postgres pg_isready -U "${LATEEN_POSTGRES_USER:-lateen}" -d "${LATEEN_POSTGRES_DB:-lateen_os}" >/dev/null 2>&1; then
  PG_OK=true
fi
check "PostgreSQL" "${PG_OK}"

# Redis
REDIS_OK=false
if docker exec lateen-redis redis-cli -a "${LATEEN_REDIS_PASSWORD}" ping 2>/dev/null | grep -q PONG; then
  REDIS_OK=true
fi
check "Redis" "${REDIS_OK}"

# NATS
NATS_OK=false
if http_ok "http://localhost:${LATEEN_NATS_HOST_MONITORING_PORT:-8222}/healthz"; then
  NATS_OK=true
fi
check "NATS" "${NATS_OK}"

# MinIO
MINIO_OK=false
if http_ok "http://localhost:${LATEEN_MINIO_HOST_API_PORT:-9000}/minio/health/live"; then
  MINIO_OK=true
fi
check "MinIO" "${MINIO_OK}"

# Qdrant
QDRANT_OK=false
if http_ok "http://localhost:${LATEEN_QDRANT_HOST_HTTP_PORT:-6333}/healthz"; then
  QDRANT_OK=true
fi
check "Qdrant" "${QDRANT_OK}"

# Grafana
GRAFANA_OK=false
if http_ok "http://localhost:${LATEEN_GRAFANA_HOST_PORT:-3000}/api/health"; then
  GRAFANA_OK=true
fi
check "Grafana" "${GRAFANA_OK}"

# Prometheus
PROM_OK=false
if http_ok "http://localhost:${LATEEN_PROMETHEUS_HOST_PORT:-9090}/-/healthy"; then
  PROM_OK=true
fi
check "Prometheus" "${PROM_OK}"

# OpenTelemetry Collector
OTEL_OK=false
if http_ok "http://localhost:${LATEEN_OTEL_HEALTH_PORT:-13133}/"; then
  OTEL_OK=true
fi
check "OpenTelemetry Collector" "${OTEL_OK}"

# PgAdmin
PGADMIN_OK=false
if http_ok "http://localhost:${LATEEN_PGADMIN_HOST_PORT:-5050}/misc/ping"; then
  PGADMIN_OK=true
fi
check "PgAdmin" "${PGADMIN_OK}"

echo ""
echo "Summary: ${PASSED} passed, ${FAILED} failed"
if [[ "${FAILED}" -gt 0 ]]; then
  exit 1
fi
