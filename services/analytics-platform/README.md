# Enterprise Analytics Platform

Unified business intelligence layer for Lateen OS — aggregates data from existing services only.

**No business data ownership. No data warehouse.**

## Quick Start

```bash
pnpm --filter @lateen-os/analytics-platform-service dev   # http://localhost:4011
pnpm --filter @lateen-os/analytics-center dev              # http://localhost:3011
```

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/analytics` | Run analytics pipeline |
| GET | `/api/analytics/domains` | List domains and metrics |
| GET | `/api/analytics/pipeline` | Pipeline steps |
| GET | `/api/dashboard` | List dashboards |
| GET | `/api/dashboard/:id` | Get dashboard data |
| GET | `/api/metrics` | Metric snapshots |
| GET | `/api/reports` | Report definitions |
| GET | `/api/alerts` | Alert definitions |
| POST | `/api/exports` | Create export job |
| GET | `/api/exports` | List exports |

## Analytics Domains (18)

Executive · Sales · Finance · Operations · Production · Projects · Customers · Products · Marketplace · Extensions · AI Workforce · AI Runtime · Workflow · Missions · Knowledge · Search · Connectors · Infrastructure

## Pipeline (7 steps)

Collect → Normalize → Aggregate → Calculate Metrics → Generate KPIs → Prepare Dashboard → Return

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [ANALYTICS_MODEL.md](./ANALYTICS_MODEL.md)
- [REPORTS.md](./REPORTS.md)
- [DASHBOARDS.md](./DASHBOARDS.md)

## Verification

```bash
pnpm --filter @lateen-os/analytics-platform-service build
pnpm --filter @lateen-os/analytics-platform-service typecheck
pnpm --filter @lateen-os/analytics-platform-service test
pnpm --filter @lateen-os/analytics-center build
pnpm --filter @lateen-os/analytics-center typecheck
pnpm --filter @lateen-os/analytics-center test
```
