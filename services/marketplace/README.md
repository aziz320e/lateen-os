# Lateen Marketplace

Official extension distribution platform for Lateen OS.

## Overview

The Marketplace is the distribution layer for extensions. It works with the Kernel, SDK, and Extension System. It contains **no business logic** — only catalog, search, publish, install, and review contracts.

## Packages

| Package | Path | Port |
| ------- | ---- | ---- |
| `@lateen-os/marketplace-service` | `services/marketplace` | 4006 |
| `@lateen-os/marketplace` | `apps/marketplace` | 3005 |

## Quick Start

```bash
# Backend
pnpm --filter @lateen-os/marketplace-service dev

# Frontend
pnpm --filter @lateen-os/marketplace dev
```

## Kernel CLI

```bash
lateen marketplace search stripe
lateen marketplace install stripe-connector
lateen marketplace update stripe-connector
lateen marketplace publish ./extensions/my-extension
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PUBLISHING.md](./PUBLISHING.md)
- [API.md](./API.md)

## Verification

```bash
pnpm --filter @lateen-os/marketplace-service build
pnpm --filter @lateen-os/marketplace-service test
pnpm --filter @lateen-os/marketplace build
pnpm --filter @lateen-os/marketplace typecheck
```
