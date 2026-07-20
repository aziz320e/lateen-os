# Lateen Cloud Platform

SaaS control plane for Lateen OS — manages organizations, tenants, subscriptions, billing, deployments, monitoring, and backups.

**No business logic. No payment gateway implementation.**

## Quick Start

```bash
pnpm --filter @lateen-os/cloud-control-plane-service dev   # http://localhost:4012
pnpm --filter @lateen-os/cloud-console dev              # http://localhost:3012
```

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/cloud` | Platform overview |
| GET | `/api/cloud/domains` | Cloud domains and lifecycle |
| GET | `/api/cloud/plans` | Subscription plans |
| GET | `/api/cloud/monitoring` | Monitoring status |
| GET/POST | `/api/organizations` | Organizations |
| GET/POST | `/api/tenants` | Tenants |
| PUT | `/api/tenants/:id/lifecycle` | Tenant lifecycle actions |
| GET | `/api/subscriptions` | Subscriptions |
| GET/POST | `/api/deployments` | Deployments |
| GET | `/api/billing` | Invoices |
| POST | `/api/billing/pay/:id` | Payment stub |
| GET | `/api/usage` | Usage metrics |
| GET/POST | `/api/support` | Support tickets |
| GET | `/api/backups` | Backups |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [TENANT_MODEL.md](./TENANT_MODEL.md)
- [BILLING_MODEL.md](./BILLING_MODEL.md)
- [OPERATIONS.md](./OPERATIONS.md)

## Verification

```bash
pnpm --filter @lateen-os/cloud-control-plane-service build
pnpm --filter @lateen-os/cloud-control-plane-service typecheck
pnpm --filter @lateen-os/cloud-control-plane-service test
pnpm --filter @lateen-os/cloud-console build
pnpm --filter @lateen-os/cloud-console typecheck
pnpm --filter @lateen-os/cloud-console test
```
