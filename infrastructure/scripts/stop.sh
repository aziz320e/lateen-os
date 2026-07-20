#!/usr/bin/env bash
# Lateen OS — Stop platform infrastructure
set -euo pipefail
# shellcheck source=_lib.sh
source "$(dirname "$0")/_lib.sh"

echo "Stopping Lateen OS platform..."
compose down
echo "Platform stopped."
