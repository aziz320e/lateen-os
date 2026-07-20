#!/usr/bin/env bash
# Lateen OS — Infrastructure script library (Bash)

set -euo pipefail

INFRA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="${INFRA_ROOT}/docker"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.yml"
ENV_FILE="${LATEEN_ENV_FILE:-${INFRA_ROOT}/environments/.env.development}"
BACKUP_ROOT="${INFRA_ROOT}/backups"

compose() {
  docker compose \
    --project-directory "${DOCKER_DIR}" \
    --env-file "${ENV_FILE}" \
    -f "${COMPOSE_FILE}" \
    "$@"
}

load_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
  fi
}

http_ok() {
  local url="$1"
  curl -sf --max-time 5 "${url}" >/dev/null 2>&1
}
