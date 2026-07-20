# Integration Hub

Unified integration platform for Lateen OS — connects external cloud services, business systems, communication platforms, storage providers, payment gateways, and AI providers.

## Purpose

The Integration Hub is the single integration layer for Lateen OS. It manages connector lifecycle, synchronization, entity mapping, webhooks, background jobs, and monitoring while reusing platform services (Business DNA, Identity, Decision Engine, Workflow Engine, AI Runtime).

**v1.0 ships contracts and mock adapters only — no real external API calls.**

## Stack

- **NestJS** + **Fastify**
- **Prisma** + **PostgreSQL**
- **Redis** + **BullMQ** — job queues
- **NATS** — domain events
- **OpenTelemetry** — tracing and metrics
- **Pino** — structured logging
- **Zod** — config validation

## Quick start

```bash
# Create database
createdb lateen_integration

# Migrate and seed connector catalog
pnpm --filter @lateen-os/integration-hub db:push
pnpm --filter @lateen-os/integration-hub db:seed

# Start service
pnpm --filter @lateen-os/integration-hub dev
```

Open http://localhost:4004/health

## API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Health check |
| GET | `/metrics` | Metrics stub |
| GET | `/api/connectors/definitions` | Connector catalog |
| GET | `/api/connectors` | List installed connectors |
| POST | `/api/connectors` | Install connector |
| GET | `/api/connectors/:id` | Get connector |
| GET | `/api/connectors/:id/health` | Connector health |
| POST | `/api/connectors/:id/lifecycle` | Lifecycle action |
| GET | `/api/connectors/monitoring/snapshot` | Monitoring snapshot |
| GET | `/api/sync` | List sync jobs |
| POST | `/api/sync` | Start sync job |
| POST | `/api/sync/:jobId/run` | Run sync job |
| POST | `/api/webhooks` | Register outbound webhook |
| POST | `/api/webhooks/inbound/:connectorId` | Receive inbound webhook |
| GET | `/api/jobs` | List hub jobs |
| POST | `/api/jobs/:id/retry` | Retry job |

Pass `x-organization-id` header for tenant scoping.

## Initial Connectors (24)

Google Workspace, Microsoft 365, Gmail, Outlook, Google Drive, OneDrive, Dropbox, WhatsApp Business, Slack, Microsoft Teams, Shopify, WooCommerce, Stripe, PayPal, HubSpot, Odoo, ERPNext, SAP, QuickBooks, OpenAI, Anthropic, Azure OpenAI, Custom REST, Custom GraphQL.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONNECTORS.md](./CONNECTORS.md)
- [SYNC-MODEL.md](./SYNC-MODEL.md)
- [WEBHOOKS.md](./WEBHOOKS.md)

## Verification

```bash
pnpm --filter @lateen-os/integration-hub build
pnpm --filter @lateen-os/integration-hub typecheck
pnpm --filter @lateen-os/integration-hub test
```
