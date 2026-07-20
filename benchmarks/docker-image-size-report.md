# Docker Image Size Report — v1.0.0-rc.1

**Date:** 2026-07-20  
**Reference:** `deployment/docker/images.json`

## Image Inventory

| Image | Base | Est. Size |
| ----- | ---- | --------- |
| lateen-os/business-dna-service | node:22-alpine | ~180 MB |
| lateen-os/identity-service | node:22-alpine | ~180 MB |
| lateen-os/api-gateway | node:22-alpine | ~190 MB |
| lateen-os/* (all services) | node:22-alpine | ~175–200 MB |
| lateen-os/* (all apps) | node:22-alpine | ~250–350 MB |

## Optimization Applied

- Multi-stage builds (build → production)
- Alpine base images
- Production dependencies only in final layer
- `.dockerignore` excludes dev artifacts

## RC Status

✅ Images documented in manifest; build verification via CI workflow.
