# Mission Scheduler

Autonomous mission scheduling service for Lateen OS — decides **when** missions start, never performs business logic.

## Purpose

The Mission Scheduler transforms Lateen OS into an event-driven autonomous enterprise. It proactively creates, schedules, monitors, and executes missions based on business events, intelligence signals, cron schedules, calendar rules, and policies.

## Stack

- **NestJS** + **Fastify**
- **Prisma** + **PostgreSQL**
- **Redis** + **BullMQ** — priority queue, retry, dead letter
- **NATS** — scheduler domain events
- **cron-parser** — cron evaluation
- **OpenTelemetry** + **Pino**

## Quick start

```bash
createdb lateen_mission_scheduler
pnpm --filter @lateen-os/mission-scheduler db:push
pnpm --filter @lateen-os/mission-scheduler db:seed
pnpm --filter @lateen-os/mission-scheduler dev
```

Open http://localhost:4005/health

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health`, `/metrics` | Health |
| GET | `/api/scheduler` | Monitoring snapshot |
| GET | `/api/scheduler/types` | Mission type catalog (11) |
| GET | `/api/scheduler/schedules` | Schedule rules |
| GET/POST | `/api/missions` | List / schedule missions |
| POST | `/api/missions/:id/execute` | Execute mission |
| POST | `/api/missions/:id/cancel` | Cancel mission |
| POST | `/api/missions/:id/retry` | Retry mission |
| GET/POST | `/api/triggers` | Trigger registry |
| POST | `/api/triggers/:id/fire` | Fire trigger |
| POST | `/api/triggers/events/ingest` | Ingest platform event |
| GET | `/api/history` | Execution history |
| GET/POST | `/api/calendar` | Business calendar rules |

Pass `x-organization-id` for tenant scoping.

## Mission types (11)

Launch Product, Market Research, Competitor Review, Price Optimization, Customer Follow-up, Sales Pipeline Review, Production Optimization, Inventory Review, Executive Report, Financial Review, Compliance Audit.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SCHEDULER_MODEL.md](./SCHEDULER_MODEL.md)
- [MISSION_POLICY.md](./MISSION_POLICY.md)

## Verification

```bash
pnpm --filter @lateen-os/mission-scheduler build
pnpm --filter @lateen-os/mission-scheduler typecheck
pnpm --filter @lateen-os/mission-scheduler test
```
