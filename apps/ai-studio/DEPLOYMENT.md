# Deployment

AI Studio tracks worker deployment lifecycle through BFF contracts.

## States

| Status | Description |
| ------ | ----------- |
| `draft` | Design in progress, not live |
| `published` | Active configuration |
| `archived` | Retired version |

## Operations

| Operation | BFF | Notes |
| --------- | --- | ----- |
| List | `GET /api/deployments` | All deployment records |
| Publish | `POST /api/deployments` | Stub — real publish via AI Workforce |
| Rollback | UI stub | Reverts to prior version |
| Version | Per-record `version` field | Monotonic integer |

## UI

`/deployments` shows status badges, version, publish timestamp, and rollback actions (disabled stubs).

## Boundaries

- AI Studio does not deploy to production infrastructure
- AI Workforce owns worker registration and lifecycle
- AI Runtime picks up published configs at execution time
