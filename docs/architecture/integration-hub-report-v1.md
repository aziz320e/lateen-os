# Integration Hub — Architecture Report v1

**Epic 15** | Port **4004** | Status: **Completed (contracts)**

## Summary

The Integration Hub (`services/integration-hub`) is the unified external systems integration platform for Lateen OS. v1 delivers hexagonal architecture with 24 connector definitions, mock providers, full lifecycle API, sync/webhook/job contracts, Prisma persistence, and NATS/BullMQ integration stubs.

## Deliverables

| Area | Status |
| ---- | ------ |
| NestJS + Fastify service scaffold | Done |
| Prisma schema (connectors, sync, mappings, webhooks, jobs) | Done |
| 24 connector catalog definitions | Done |
| Mock provider adapters (no network) | Done |
| Connector lifecycle (install → remove) | Done |
| Sync jobs (pull/push/two-way) | Done |
| Webhook inbound/outbound contracts | Done |
| BullMQ + in-memory job queue | Done |
| NATS event publisher | Done |
| OpenTelemetry + Pino | Done |
| API routes (/api/connectors, /sync, /webhooks, /jobs) | Done |
| Tenant isolation (x-organization-id) | Done |
| Tests | Done |
| Documentation | Done |

## API surface

- `GET /health`, `GET /metrics`
- `/api/connectors` — catalog, CRUD, lifecycle, health, monitoring
- `/api/sync` — list, start, run
- `/api/webhooks` — register, inbound receive
- `/api/jobs` — list, retry

## Platform reuse

- **Decision Engine** — dependency declared for future authorization policies
- **Business DNA** — entity mapping targets internal BDS entities
- **Identity Service** — tenant scoping via organization ID header
- **NATS** — domain events (`ConnectorInstalled`, `SyncCompleted`, `WebhookReceived`, etc.)

## Verification

```bash
pnpm --filter @lateen-os/integration-hub build
pnpm --filter @lateen-os/integration-hub typecheck
pnpm --filter @lateen-os/integration-hub test
```

## Next steps (post v1)

- Real OAuth2/OIDC flows per connector
- BullMQ workers for scheduled sync
- Decision Engine policy gates on sensitive connector actions
- Workflow Engine triggers on webhook events
