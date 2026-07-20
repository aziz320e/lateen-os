#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "========================================"
echo " Lateen OS — Deployment Validation"
echo "========================================"

"$ROOT/deployment/scripts/validate-helm.sh"
"$ROOT/deployment/scripts/validate-terraform.sh"

if [[ "${SKIP_DOCKER:-}" != "1" ]] && command -v docker &>/dev/null; then
  "$ROOT/deployment/scripts/validate-images.sh"
else
  echo "Skipping Docker builds (set SKIP_DOCKER=0 to force, or install docker)"
fi

echo ""
echo "All deployment validations passed."
