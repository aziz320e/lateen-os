# Integration Hub — Architecture

Architecture v1.0 (locked). Contracts and mock providers only.

## Role in Lateen OS

```
┌─────────────────────────────────────────────────────────────┐
│                     Lateen OS Platform                       │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Business DNA │   Identity   │   Decision   │ Workflow / AI  │
│   Service    │   Service    │    Engine    │    Runtime     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Integration Hub  │
                    │   (port 4004)     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Mock Providers   PostgreSQL      Redis/NATS
         (24 connectors)  (state)       (jobs/events)
```

## Layer structure

```
services/integration-hub/src/
├── application/     # ConnectorService, SyncService, MonitoringService
├── domain/          # Types and ports (hexagonal boundaries)
├── connectors/      # Static catalog + mock provider
├── providers/       # Provider registry export
├── sync/            # Sync orchestration (via SyncService)
├── mapping/         # Entity mapping service
├── jobs/            # BullMQ + in-memory job queue
├── webhooks/        # Inbound/outbound webhook handling
├── events/          # NATS publisher
├── repositories/    # Prisma + in-memory adapters
├── infrastructure/  # Telemetry, Redis hooks
├── api/             # NestJS controllers
└── config/          # Zod-validated environment
```

## Connector lifecycle

```
Install → Configure → Authenticate → Test → Enable
                                              ↓
                                         Disable / Upgrade / Remove
```

## Authentication methods (contracts)

OAuth2, OIDC, API Key, Bearer Token, Webhook Secret, Basic Auth.

## Sync modes

Pull, Push, Two-way, Scheduled, Real-time webhooks, conflict resolution via mapping layer, retry queue + dead letter status.

## Monitoring

Connector health, sync status, error counts, latency, success rate, queue length — exposed via `/api/connectors/monitoring/snapshot`.

## Constraints

- No modifications to existing `packages/*`
- No duplicate domain models — maps to Business DNA entities via mapping layer
- No real external API calls in v1.0
