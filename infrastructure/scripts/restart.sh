#!/usr/bin/env bash
# Lateen OS — Restart platform infrastructure
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

echo "Restarting Lateen OS platform..."
compose down
compose up -d --remove-orphans
echo "Platform restarted."
