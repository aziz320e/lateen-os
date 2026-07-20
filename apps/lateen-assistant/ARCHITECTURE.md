# Lateen Assistant — Architecture

Architecture v1.0 (locked). Orchestration only — no business logic.

## Role

Lateen Assistant is the **primary interaction layer** for Lateen OS. It coordinates existing services and never accesses databases directly.

```
User → Lateen Assistant (3004) → BFF routes → Platform services
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              Business DNA    Product Discovery   AI Product Manager
              Identity        Integration Hub     CEO Cockpit
              Workflow Engine (via BDS)            Institutional Memory
```

## Layer structure

```
apps/lateen-assistant/src/
├── app/                 # Next.js pages + BFF route handlers
├── components/
│   ├── chat/            # Markdown, charts, streaming UI
│   └── layout/          # App shell, sidebar, command palette
├── lib/
│   ├── api/             # Server fetchers + orchestrator + command router
│   ├── conversation-store.ts
│   └── audit.ts         # Trace correlation
├── providers/
└── types/
```

## AI routing

The **orchestrator** detects commands via slash syntax or natural language keywords, then invokes the appropriate service API. Responses are formatted as markdown with optional charts, tables, and code blocks.

## Security

- Dev bearer auth (`dev:{orgId}:{subject}`) + `X-Organization-Id`
- Tenant-scoped conversation store
- Audit trace per orchestration call
- Role permissions exposed via `/api/context` (Identity integration in production)

## Observability

Every orchestrated action records a trace with optional `conversationId`, `missionId`, `decisionId`, `workflowId` correlation.

## Constraints

- Does **not** replace Business DNA, Workflow Engine, or Decision Engine
- Does **not** duplicate domain models
- Does **not** modify existing packages
