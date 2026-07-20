# Mission Scheduler — Architecture

Architecture v1.0 (locked). Scheduling and orchestration only — no business logic.

## Role

```
Platform Events / Cron / Webhooks / Manual
              │
              ▼
     Mission Scheduler (4005)
              │
    ┌─────────┼─────────┐
    │         │         │
 BullMQ    Prisma     NATS
 queue     state     events
              │
              ▼
    Platform Executors (AI PM, BDS, Discovery, etc.)
```

## Modules

```
src/
├── mission/           Mission type catalog
├── schedule/          Cron evaluation, schedule rules
├── trigger/           Trigger registry + fire
├── calendar/          Working hours, timezone, holidays
├── event-listener/    Inbound platform event mapping
├── policy/            Scheduler policy contracts
├── queue/             BullMQ + in-memory queue
├── execution/         Platform executor (mock/HTTP)
├── history/           Execution history
├── monitoring/        SLA, upcoming, failed, retry queue
├── queries/           Repository queries
├── events/            NATS publisher
├── application/       Scheduler services
└── api/               REST controllers
```

## Constraints

- Never performs business logic
- No new domain models — references existing mission types only
- No modifications to `packages/*`
- Dispatches to existing services (AI PM, BDS, Discovery, etc.)

## Events published

MissionScheduled, MissionTriggered, MissionCancelled, MissionRetried, MissionFailed, MissionExpired
