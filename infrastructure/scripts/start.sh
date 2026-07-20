#!/usr/bin/env bash
# Lateen OS — Start platform infrastructure
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

echo "Starting Lateen OS platform (env: ${ENV_FILE})..."
compose up -d --remove-orphans
echo "Platform started. Run health.sh to verify."
