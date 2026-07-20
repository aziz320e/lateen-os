#!/usr/bin/env bash
# Lateen OS — Validate infrastructure configuration
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

ERRORS=0

check_file() {
  local path="$1"
  local label="$2"
  if [[ -f "${path}" ]]; then
    echo "[OK]   ${label}"
  else
    echo "[FAIL] ${label} — missing: ${path}"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "Lateen OS Infrastructure Validation"
echo ""

if docker version >/dev/null 2>&1; then
  echo "[OK]   Docker CLI available"
else
  echo "[FAIL] Docker CLI not available or daemon not running"
  ERRORS=$((ERRORS + 1))
fi

check_file "${COMPOSE_FILE}" "docker-compose.yml"
check_file "${ENV_FILE}" "Environment file"
check_file "${DOCKER_DIR}/prometheus/prometheus.yml" "Prometheus config"
check_file "${DOCKER_DIR}/otel/otel-collector.yaml" "OTel config"
check_file "${DOCKER_DIR}/grafana/provisioning/datasources/datasources.yml" "Grafana datasources"

echo ""
echo "Validating docker compose configuration..."
if compose config --quiet >/dev/null 2>&1; then
  echo "[OK]   docker compose config"
else
  echo "[FAIL] docker compose config"
  compose config
  ERRORS=$((ERRORS + 1))
fi

for s in start stop restart logs health reset backup restore; do
  check_file "$(dirname "$0")/${s}.ps1" "script: ${s}.ps1"
  check_file "$(dirname "$0")/${s}.sh" "script: ${s}.sh"
done

echo ""
if [[ "${ERRORS}" -eq 0 ]]; then
  echo "Validation passed."
  exit 0
else
  echo "Validation failed with ${ERRORS} error(s)."
  exit 1
fi
