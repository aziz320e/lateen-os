# @lateen-os/ai-workforce

AI Workforce Platform — the organizational layer above AI Runtime for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce.

## Purpose

AI Runtime **executes** agents. AI Workforce **manages** digital employees.

This package is the common workforce layer every future AI worker application will use. It is:

- **Not** an AI agent (see `apps/ai-product-manager` for the first worker UI)
- **Not** an LLM wrapper
- **Not** persistence, UI, or API

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine where the module has real behavior
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM in the Assignment Engine's selection logic
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createWorkforceRuntime()` for the composition root

## Real runtime vs. contracts-only

The core workforce runtime is implemented as real, deterministic, in-memory logic:

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Worker Lifecycle | `worker` | Guarded state machine — `hire` / `activate` / `suspend` / `resume` / `retire`, backed by a real in-memory `WorkerRepository` |
| Worker Registry | `registry` | `register` / `update` / `deactivate` / `findByRole` / `findByCapability` / `findByAvailability` / `findByOrganization` |
| Capability Engine | `skills` | Validates skills, capabilities, certifications, and tool access against a `CapabilityRequirement`; computes a deterministic match score |
| Capacity Engine | `availability` | Workload, remaining capacity, availability snapshots, and capacity reserve/release — operates purely on `WorkerAvailability` |
| Assignment Engine | `assignment` | Deterministic worker selection by role, capability match, availability, and capacity — no AI/LLM in the decision path |
| Performance Engine | `performance` | Mission count, success/failure rate, average execution time, quality score, reliability score |
| Query Layer | `queries` | Real, read-only `WorkforceRuntimeQueries` port — `findWorkers` / `findAvailableWorkers` / `findAssignments` / `findCapabilities` / `findPerformance` / `findCapacity` |
| Event Bus | `events` | Typed `WorkforceEventMap`; every declared event is genuinely published by the service that triggers it |

The remaining modules (`organization`, `teams`, `delegation`, `collaboration` conversations/shared-context, `supervision`, `goals`, `notifications`, `governance`) remain **contracts only** — types and repository ports with no runtime behavior yet. `collaboration`'s `TaskAssignment` and `TaskAssignmentRepository` are the exception: they are real and are what the Assignment Engine persists against.

## Event bus

`WorkforceEventMap` declares 10 events, each genuinely published by the real service that causes it:

`worker.hired`, `worker.activated`, `worker.suspended`, `worker.resumed`, `worker.retired`, `assignment.created`, `assignment.completed`, `assignment.failed`, `capacity.changed`, `performance.updated`.

## Usage

```typescript
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';

const runtime = createWorkforceRuntime();

const worker = await runtime.lifecycle.hire({
  organizationId: 'org-1',
  businessDnaAgentId: 'agent-1',
  runtimeAgentId: 'runtime-agent-1',
  profile: {
    displayName: 'Sales Agent',
    title: 'AI Sales Rep',
    workforceType: 'sales_ai',
    proactiveEnabled: true,
    reactiveEnabled: true,
  },
  roles: [{ roleId: 'role-1', code: 'sales_ai', name: 'Sales AI' }],
  maxConcurrentTasks: 3,
});

await runtime.lifecycle.activate('org-1', worker.id);
await runtime.registry.register(await runtime.lifecycle.get('org-1', worker.id)!);

const assignment = await runtime.assignment.createAssignment('org-1', {
  taskId: 'task-1',
  roleCode: 'sales_ai',
  priority: 'high',
});

await runtime.assignment.completeAssignment('org-1', assignment.id, '0.90');

const { workers } = await runtime.queries.findAvailableWorkers({ organizationId: 'org-1' });
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('assignment.completed', (payload) => {
  console.log(`Assignment ${payload.assignmentId} completed by ${payload.workerId}`);
});
```

## Modules

| Module | Focus |
| ------ | ----- |
| `worker` | AIWorker aggregate, profile, roles, skills, availability — real lifecycle state machine |
| `registry` | Worker registration & descriptors — real registry service |
| `organization` | Org units, reporting lines (contracts only) |
| `skills` | Skill catalog, proficiency, certifications, tool access — real Capability Engine |
| `teams` | AI teams, members, leads (contracts only) |
| `delegation` | Delegation rules, requests, results (contracts only) |
| `collaboration` | Conversations, shared context (contracts only); TaskAssignment is real |
| `supervision` | Supervisors, reviews, escalations (contracts only) |
| `goals` | Goals, objectives, key results (contracts only) |
| `performance` | Metrics, scores, task statistics — real Performance Engine |
| `availability` | Schedules & capacity snapshots — real Capacity Engine |
| `notifications` | Workforce notifications (contracts only) |
| `governance` | Approval requirements, compliance, audit (contracts only) |
| `assignment` | Deterministic worker-selection Assignment Engine |
| `queries` | Real-side `WorkforceRuntimeQueries` port, plus the original `WorkforceQueries` contract |
| `events` | Typed `WorkforceEventMap` over shared-kernel's event bus |

## Platform dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — worker identity & org structure
- `@lateen-os/ai-runtime` — task execution linkage
- `@lateen-os/decision-engine` — approval & escalation
- `@lateen-os/institutional-memory` — shared context & knowledge
- `@lateen-os/intelligence-engine` — recommendation references

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [WORKFORCE_MODEL.md](./WORKFORCE_MODEL.md)

## Verification

```bash
pnpm --filter @lateen-os/ai-workforce build
pnpm --filter @lateen-os/ai-workforce typecheck
pnpm --filter @lateen-os/ai-workforce test
pnpm --filter @lateen-os/ai-workforce lint
```
