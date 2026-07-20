# @lateen-os/ai-workforce

AI Workforce Platform — the organizational layer above AI Runtime for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce.

## Purpose

AI Runtime **executes** agents. AI Workforce **manages** digital employees.

This package is the common workforce layer every future AI worker application will use. It is:

- **Not** an AI agent (see `apps/ai-product-manager` for the first worker UI)
- **Not** an LLM wrapper
- **Not** persistence, UI, or API

## Scope

| Included | Excluded |
| -------- | -------- |
| Worker, team, delegation contracts | LLM / model integration |
| Collaboration & supervision models | UI / HTTP / API |
| Goals, performance, availability | Database / ORM |
| Governance & audit contracts | Business logic implementation |
| Query ports & repository ports | Persistence implementation |

## Modules

| Module | Focus |
| ------ | ----- |
| `worker` | AIWorker aggregate, profile, roles, skills, availability |
| `registry` | Worker registration & descriptors |
| `organization` | Org units, reporting lines |
| `skills` | Skill catalog & proficiency |
| `teams` | AI teams, members, leads |
| `delegation` | Delegation rules, requests, results |
| `collaboration` | Conversations, task assignments, shared context |
| `supervision` | Supervisors, reviews, escalations |
| `goals` | Goals, objectives, key results |
| `performance` | Metrics, scores, task statistics |
| `availability` | Schedules & capacity snapshots |
| `notifications` | Workforce notifications |
| `governance` | Approval requirements, compliance, audit |
| `queries` | Read-side WorkforceQueries port |

## Usage

```typescript
import {
  worker,
  teams,
  delegation,
  queries,
  type AIWorker,
  type WorkforceQueries,
  type DelegationRequest,
} from '@lateen-os/ai-workforce';

declare const workforceQueries: WorkforceQueries;

await workforceQueries.findWorkers({ organizationId: orgId, status: 'active' });
await workforceQueries.findTeams({ organizationId: orgId });
await workforceQueries.findGoals({ organizationId: orgId, workerId });
await workforceQueries.findPerformance({ organizationId: orgId, workerId });
await workforceQueries.findAssignments({ organizationId: orgId, workerId });
await workforceQueries.findAvailability({ organizationId: orgId, workerId });
```

See [WORKFORCE_MODEL.md](./WORKFORCE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Platform dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — worker identity & org structure
- `@lateen-os/ai-runtime` — task execution linkage
- `@lateen-os/decision-engine` — approval & escalation
- `@lateen-os/institutional-memory` — shared context & knowledge
- `@lateen-os/intelligence-engine` — recommendation references

## Verification

```bash
pnpm --filter @lateen-os/ai-workforce build
pnpm --filter @lateen-os/ai-workforce typecheck
```
