# @lateen-os/ai-brain

Central enterprise reasoning layer for Lateen OS (Architecture v1.0 locked).

## Purpose

AI Brain is the **reasoning and orchestration contract layer** for the entire platform. Every application and AI worker communicates with AI Brain to:

- Understand what the user wants (**intent**)
- Reason over enterprise context (**reasoning**)
- Decide which missions, workflows, services, and workers to involve (**routing**)
- Produce validated execution plans (**planning**)
- Coordinate AI Runtime, Workflow Engine, and Multi-Agent (**orchestration**)

AI Brain **does not** execute business logic, replace AI Runtime, or replace Workflow Engine. It orchestrates them.

## Contracts only

- TypeScript interfaces and type aliases
- Domain events (`{entity}.{action}` convention)
- Query and capability ports (no implementations)
- No LLM SDK
- No business logic
- No persistence

## Modules

| Module | Key types |
| ------ | --------- |
| `intent` | `Intent`, `IntentType`, `IntentConfidence`, `IntentEntity`, `IntentParameter` |
| `planner` | `ExecutionPlan`, `MissionPlan`, `WorkflowPlan`, `WorkerPlan` |
| `reasoning` | `ReasoningContext`, `ReasoningStep`, `ReasoningResult`, `ReasoningExplanation` |
| `context` | `EnterpriseContext`, `BusinessContext`, `ConversationContext`, `MissionContext` |
| `routing` | `ServiceRoute`, `WorkflowRoute`, `MissionRoute`, `WorkerRoute` |
| `memory` | `WorkingContext`, `RetrievedKnowledge`, `RelevantEntities` |
| `reflection` | `ReflectionResult`, `SelfEvaluation`, `PlanImprovement` |
| `validation` | `PermissionValidation`, `PolicyValidation`, `BusinessValidation` |
| `executionPlan` | `ExecutionGraph`, `ExecutionNode`, `ExecutionEdge`, `ExecutionCheckpoint` |
| `queries` | `ExplainPlan`, `ExplainDecision`, `ExplainMission`, `FindRelevantKnowledge` |
| `events` | `IntentRecognized`, `PlanCreated`, `PlanRejected`, `ExecutionRequested`, `ReasoningCompleted` |

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
import {
  brain,
  intent,
  planner,
  events,
  type Brain,
  type Intent,
  type ExecutionPlan,
  BRAIN_EVENT_NAMES,
} from '@lateen-os/ai-brain';

// Namespaced access
type IntentType = intent.IntentType;
type BrainPlan = planner.ExecutionPlan;

// Event subscription
const eventName = BRAIN_EVENT_NAMES.PlanCreated; // 'plan.created'
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
