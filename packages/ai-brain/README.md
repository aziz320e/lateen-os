# @lateen-os/ai-brain

Central enterprise reasoning layer for Lateen OS (Architecture v1.0 locked).

## Purpose

AI Brain is the **reasoning and orchestration contract layer** for the entire platform. Every application and AI worker communicates with AI Brain to:

- Understand what the user wants (**intent**)
- Reason over enterprise context (**reasoning**)
- Decide which missions, workflows, services, and workers to involve (**routing**)
- Produce validated execution plans (**planning**)
- Coordinate AI Runtime, Workflow Engine, and Multi-Agent (**orchestration**)

AI Brain **does not** execute business logic, replace AI Runtime, or replace Workflow Engine. It orchestrates them: it produces structured plans that reference their real id types, and a caller above this package — CEO Engine, via `sdk` — is responsible for actually invoking them with the returned plan. (AI Brain does not depend on `ceo-engine` itself: `ceo-engine → sdk → ai-brain`, so a dependency in the other direction would be a cycle. See [docs/adr/0003-no-cyclic-dependencies.md](../../docs/adr/0003-no-cyclic-dependencies.md).)

## Real implementations

Every port below has a real, deterministic, dependency-injected implementation — no LLM SDK, no hidden global state:

| Module | Port | Implementation |
| ------ | ---- | --------------- |
| `intent` | `IntentRecognizer` | `recognizer.impl.ts` — keyword/punctuation classification, quoted-phrase and numeric-literal extraction |
| `context` | `EnterpriseContextAssembler` | `assembler.impl.ts` — assembles business/conversation/mission context; enriches mission context from `@lateen-os/decision-engine`'s real `DecisionQueries` when injected |
| `memory` | `WorkingMemory` | `working-memory.impl.ts` — deterministic working-context retrieval |
| `reasoning` | `EnterpriseReasoner` | `reasoner.impl.ts` — ordered reasoning-step trace; `success` reflects whether intent classification was confident |
| `routing` | `PlatformRouter` | `router.impl.ts` — genuinely invokes `@lateen-os/ai-runtime`'s real `AgentRegistryService` when injected to route worker plans to an actually-registered runtime agent |
| `planner` | `BrainPlanner` | `planner.impl.ts` — turns a routing decision into an `ExecutionPlan` (mission/workflow/worker plans + execution graph) |
| `validation` | `PlanValidator` | `validator.impl.ts` — permission/policy/business rule checks |
| `reflection` | `BrainReflector` | `reflector.impl.ts` — self-evaluation and improvement suggestions |
| `queries` | `BrainQueries` | `brain-queries.impl.ts` — reads AI Brain's own recorded plan/reasoning history |
| `events` | `BrainEventBus` | `brain-event-bus.ts` — typed event bus (shared-kernel's `createEventBus`) for the five events `Brain.process()` publishes |
| *(root)* | `Brain` | `brain.impl.ts` — `createBrain()`/`createBrainSystem()`, the composition root |

Multi-Agent and Workflow Engine are contracts-only packages today (no real implementation to call), so mission/workflow plans are structurally shaped to match their real id types rather than invoking them directly — see [PLANNING_MODEL.md](./PLANNING_MODEL.md).

## Dependencies

```
shared-kernel → business-dna → domain-graph → institutional-memory
                            → decision-engine
                            → ai-runtime → ai-workforce
                            → workflow-engine → multi-agent
                                              → ai-brain
```

## Usage

```typescript
import { createBrainSystem } from '@lateen-os/ai-brain';

// Optionally inject real collaborators: an ai-runtime AgentRegistryService,
// a decision-engine DecisionQueries, and/or a BrainEventBus.
const { brain, queries } = createBrainSystem();

const response = await brain.process({
  organizationId: 'org-1',
  sessionId: 'session-1',
  correlationId: 'corr-1',
  rawInput: 'Start a mission to expand into a new market',
  actorId: 'user-1',
});

// response: { intent, reasoning, plan, validation, reflection, executionRequested }

const explanation = await queries.explainPlan({ organizationId: 'org-1', planId: response.plan.id });
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — module layout and platform position
- [REASONING_MODEL.md](./REASONING_MODEL.md) — reasoning flow and context assembly
- [PLANNING_MODEL.md](./PLANNING_MODEL.md) — plan types and execution graph

## Build

```bash
pnpm --filter @lateen-os/ai-brain build
pnpm --filter @lateen-os/ai-brain typecheck
```
