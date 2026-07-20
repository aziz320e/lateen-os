#!/usr/bin/env bash
# Lateen OS — View platform logs
# Usage: logs.sh [service] [--follow]
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

SERVICE="${1:-}"
FOLLOW="${2:-}"

ARGS=(logs)
if [[ "${FOLLOW}" == "--follow" || "${FOLLOW}" == "-f" ]]; then
  ARGS+=(-f)
fi
if [[ -n "${SERVICE}" && "${SERVICE}" != "--follow" && "${SERVICE}" != "-f" ]]; then
  ARGS+=("${SERVICE}")
fi

compose "${ARGS[@]}"
