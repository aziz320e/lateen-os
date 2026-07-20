# Marketplace Guide — Lateen OS Enterprise v1.0.0-rc.1

## Overview

The Marketplace platform enables discovery, installation, and management of extensions and industry packs.

## Components

| Component | Port | Purpose |
| --------- | ---- | ------- |
| marketplace-service | 4006 | Backend API |
| marketplace app | 3005 | Frontend UI |

## Publishing Extensions

1. Build extension per SDK Guide
2. Submit manifest to marketplace API
3. Extension validated against manifest schema v1
4. Published to tenant-scoped catalog

## Installing Extensions

1. Browse marketplace at port 3005
2. Select extension or industry pack
3. Install triggers provisioning workflow
4. Extension registered in plugin registry

## Industry Packs

- **Printing Industry Pack** — first industry pack (Epic 25)
- Includes workflows, missions, workers, dashboards, KPIs

## Contracts (Frozen)

Marketplace contracts frozen at v1.0 — see `release/FREEZE.md`.

## Reference

- Marketplace report: `docs/architecture/marketplace-report-v1.md`
- Printing pack: `extensions/printing-industry/README.md`
