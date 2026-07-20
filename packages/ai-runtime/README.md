# @lateen-os/ai-runtime

AI Runtime — the operating system for all AI agents in Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce.

## Purpose

The AI Runtime manages the **complete lifecycle of AI agents**. It is:

- **Not** an AI model
- **Not** an LLM wrapper
- **Not** persistence or business logic

Every AI agent **must execute inside AI Runtime**.

## Scope

| Included | Excluded |
| -------- | -------- |
| Agent lifecycle & registry | LLM / OpenAI / Claude SDK |
| Runtime sessions & tasks | UI / API / HTTP |
| Execution, planning, scheduling | Database / ORM |
| Conversation & working memory | Business logic |
| Multi-agent orchestration | Persistence implementation |
| Tooling, permissions, telemetry | AI model integration |
| Domain events & repository ports | |

## Modules

| Module | Focus |
| ------ | ----- |
| `agent` | Runtime agent aggregate |
| `registry` | Agent registration & descriptors |
| `runtime` | Sessions, state, context |
| `task` | Task queue & priorities |
| `execution` | Execution plans & results |
| `conversation` | Agent conversations |
| `memory` | Working memory & context window |
| `context` | Assembled agent context |
| `planner` | Planning port |
| `scheduler` | Scheduling port |
| `orchestrator` | Multi-agent workflows |
| `communication` | Inter-agent messaging |
| `tooling` | Tool registry & calls |
| `permissions` | Runtime permissions |
| `monitoring` | Health & metrics |
| `telemetry` | Events, traces, spans |
| `events` | Domain event union |
| `queries` | Read-side query port |

## Usage

```typescript
import {
  agent,
  runtime,
  task,
  queries,
  type RuntimeQueries,
  type Agent,
  type RuntimeSession,
} from '@lateen-os/ai-runtime';

declare const runtimeQueries: RuntimeQueries;

await runtimeQueries.findAgent({ organizationId: orgId });
await runtimeQueries.findTasks({ organizationId: orgId, status: 'queued' });
await runtimeQueries.findSessions({ organizationId: orgId, state: 'busy' });
```

See [RUNTIME_MODEL.md](./RUNTIME_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/capability-engine`
- `@lateen-os/domain-graph`
- `@lateen-os/institutional-memory`
- `@lateen-os/decision-engine`
- `@lateen-os/intelligence-engine`

## Build

```bash
pnpm --filter @lateen-os/ai-runtime build
pnpm --filter @lateen-os/ai-runtime typecheck
```
