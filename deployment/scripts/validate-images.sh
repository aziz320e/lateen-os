#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGES="$ROOT/deployment/docker/images.json"
REGISTRY="${REGISTRY:-ghcr.io/lateen-os}"

echo "==> Building backend images"
for row in $(jq -c '.backends[]' "$IMAGES"); do
  name=$(echo "$row" | jq -r '.name')
  pkg=$(echo "$row" | jq -r '.package')
  path=$(echo "$row" | jq -r '.path')
  port=$(echo "$row" | jq -r '.port')
  echo "--- $name"
  docker build -f "$ROOT/deployment/docker/Dockerfile.backend" \
    --build-arg "SERVICE_PACKAGE=$pkg" \
    --build-arg "SERVICE_PATH=$path" \
    --build-arg "SERVICE_PORT=$port" \
    -t "$REGISTRY/$name:validate" \
    "$ROOT"
done

echo "==> Building frontend images"
for row in $(jq -c '.frontends[]' "$IMAGES"); do
  name=$(echo "$row" | jq -r '.name')
  pkg=$(echo "$row" | jq -r '.package')
  path=$(echo "$row" | jq -r '.path')
  port=$(echo "$row" | jq -r '.port')
  echo "--- $name"
  docker build -f "$ROOT/deployment/docker/Dockerfile.frontend" \
    --build-arg "APP_PACKAGE=$pkg" \
    --build-arg "APP_PATH=$path" \
    --build-arg "APP_PORT=$port" \
    -t "$REGISTRY/$name:validate" \
    "$ROOT"
done

echo "All images built successfully."
