#!/usr/bin/env bash
# Lateen OS — Reset platform (removes volumes — destructive)
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

FORCE="${1:-}"

if [[ "${FORCE}" != "--force" ]]; then
  echo "WARNING: This will stop all services and DELETE all data volumes."
  read -r -p "Type 'reset' to confirm: " CONFIRM
  if [[ "${CONFIRM}" != "reset" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo "Resetting Lateen OS platform..."
compose down -v --remove-orphans
echo "Platform reset complete. All volumes removed."
