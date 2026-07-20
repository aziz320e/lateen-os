#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHART="$ROOT/deployment/helm/lateen-os"
OUT="/tmp/lateen-os-rendered.yaml"

echo "==> Helm lint"
helm lint "$CHART"
helm lint "$CHART" -f "$CHART/values-dev.yaml"
helm lint "$CHART" -f "$CHART/values-staging.yaml"
helm lint "$CHART" -f "$CHART/values-prod.yaml"

echo "==> Helm template"
helm template lateen-os "$CHART" -f "$CHART/values-prod.yaml" > "$OUT"
echo "Rendered $(wc -l < "$OUT") lines to $OUT"

echo "==> Kubectl dry-run (client)"
if command -v kubectl &>/dev/null; then
  kubectl apply --dry-run=client -f "$OUT"
else
  echo "kubectl not found — skipping dry-run"
fi

echo "==> Kustomize base"
if command -v kubectl &>/dev/null; then
  kubectl kustomize "$ROOT/deployment/kubernetes/base" >/dev/null
fi

echo "Helm/K8s validation passed."
