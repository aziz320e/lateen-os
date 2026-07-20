# Sync Model

## Concepts

| Concept | Description |
| ------- | ----------- |
| `SyncJob` | Scheduled or on-demand sync for a connector |
| `SyncDirection` | PULL, PUSH, TWO_WAY |
| `SyncJobStatus` | PENDING → RUNNING → COMPLETED / FAILED / DEAD_LETTER |
| `SyncRun` | Persisted run record (records in/out, latency, errors) |
| `EntityMapping` | External ↔ internal entity with transformation + schema version |

## Flow

```
POST /api/sync  →  create SyncJob  →  enqueue HubJob (BullMQ/in-memory)
POST /api/sync/:jobId/run  →  MockConnectorProvider pull/push  →  record SyncRun
```

## Conflict resolution (contract)

Mappings include `transformation` and `validation` JSON blobs. v1 stores mapping contracts; resolution policies integrate with Decision Engine in future sprints.

## Retry and dead letter

Failed sync jobs update status to `FAILED`. Hub jobs support retry via `POST /api/jobs/:id/retry`. Repeated failures can escalate to `DEAD_LETTER` in production workers (out of scope for v1 contracts).

## Mapping API (internal service)

Mappings are persisted per connector via `MappingService`:

- `externalEntity` — e.g. `shopify:order`
- `internalEntity` — e.g. `bds:order`
- `schemaVersion` — mapping version for upgrades

## Monitoring fields

Each sync job exposes `stats`: recordsIn, recordsOut, successRate, queueLength.
