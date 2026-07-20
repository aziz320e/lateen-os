#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "==> Terraform validate"
cd "$ROOT/deployment/terraform"
terraform init -backend=false
terraform validate

echo "Terraform validation passed."
