# @lateen-os/workflow-engine

Workflow Engine — the canonical orchestration layer for Lateen OS. Real, deterministic, in-memory runtime.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Workflow Engine **coordinates** execution across humans, AI workers, services, and business processes. It:

- **Does** run a real state machine: sequential/conditional/parallel step transitions, retries, delay/wait, compensation, history, and events
- **Does not** execute business logic itself — a step type with a registered `StepHandler` runs automatically; a step type with none stays active/waiting for an external system (AI Runtime, a human UI, Decision Engine, ...) to report completion via `dispatch({command: 'complete' | 'fail'})`

```
Workflow Engine → coordinates
AI Runtime      → executes AI tasks
AI Workforce    → manages digital employees
Decision Engine → approves decisions
Services        → execute domain operations
```

## Real implementation

| Capability | Where |
| --- | --- |
| Workflow Runtime (composition root) | `runtime.ts` — `createWorkflowRuntime()`: `defineWorkflow`, `startWorkflow`, `.orchestrator`, `.queries` |
| Workflow Executor / state machine | `execution/orchestrator.impl.ts` — `createWorkflowOrchestrator()`, the real `WorkflowOrchestrator` |
| Step execution (DI seam) | `execution/step-handler.ts` — `StepHandler`; the engine never executes business logic itself |
| Sequential / conditional / parallel transitions | `execution/transition-resolver.ts` — `resolveNextSteps()` |
| Retry policy | `execution/retry.ts` — fixed/exponential backoff with a delay cap |
| Delay / wait support | `WaitStep` (`step/types.ts`) + `orchestrator.advance()`, gated by an injectable clock |
| Compensation | `WorkflowStep.compensationStepId` — on irrecoverable failure, completed steps are compensated in reverse order |
| Condition evaluation | `condition/evaluator.impl.ts` — real `'simple'` and `'jsonlogic'` subsets; `'cel'` throws `UnsupportedExpressionLanguageError` rather than approximating it |
| Event publishing | `events/workflow-event-bus.ts` — typed event bus over shared-kernel's `createEventBus` |
| Query layer | `queries/workflow-queries.impl.ts` — real `WorkflowQueries` over the repositories |
| Repositories (in-memory) | every `*/repository.impl.ts` — `createInMemoryRepository` from shared-kernel, one per aggregate |

Concurrency note: parallel branches run with real `Promise.all` concurrency; a per-instance async lock inside the orchestrator serializes the read-merge-write of instance variables and join-completion checks so concurrent branches never clobber each other's output or double-trigger a join.

## Scope

| Included | Excluded |
| -------- | -------- |
| Workflow definitions & versions (with embedded steps + transitions) | REST / HTTP |
| Instances & step coordination, in-memory persistence | Database / ORM |
| Human, AI, service, decision, wait steps | UI |
| Sequential, conditional, and parallel transitions | LLM integration |
| Retry policy, compensation | Step business logic (delegated to an injected `StepHandler`) |
| Approval chains | |
| History, audit, templates | |
| Query layer & orchestrator | |

## Modules

| Module | Focus |
| ------ | ----- |
| `workflow` | WorkflowDefinition, WorkflowVersion (embeds `steps` + `transitions`), WorkflowMetadata |
| `instance` | WorkflowInstance, WorkflowExecution, WorkflowStatus |
| `step` | WorkflowStep, HumanTask, AITask, ServiceTask, DecisionTask, WaitStep, StepInstance |
| `transition` | Transition, ConditionalTransition, ParallelTransition |
| `trigger` | ManualTrigger, ScheduledTrigger, EventTrigger |
| `condition` | Expression, Rule, PolicyCondition, `ConditionEvaluator` |
| `action` | NotificationAction, ServiceAction, AITaskAction, DecisionAction |
| `approval` | ApprovalStep, Approver, ApprovalChain |
| `execution` | `WorkflowOrchestrator`, state machine, retry, transition resolver, `StepHandler` |
| `history` | WorkflowHistory, ExecutionHistory, AuditTrail |
| `templates` | WorkflowTemplate |
| `scheduler` | WorkflowSchedule |
| `queries` | `WorkflowQueries` |
| `events` | `WorkflowEngineDomainEvent` union, `WorkflowEventBus` |

## Usage

```typescript
import { createWorkflowRuntime, type StepHandler } from '@lateen-os/workflow-engine';

const emailHandler: StepHandler = async (step, ctx) => {
  // real business logic lives outside this package — call a service, AI Runtime, etc.
  return { success: true, output: { sentAt: new Date().toISOString() } };
};

const runtime = createWorkflowRuntime({ stepHandlers: { service: emailHandler } });

const { definition } = await runtime.defineWorkflow({
  organizationId: orgId,
  code: 'product-discovery',
  name: 'Product Discovery',
  metadata: { category: 'discovery' },
  version: '1.0.0',
  steps: [
    { stepId: 's1', code: 'notify', name: 'Notify', type: 'service', optional: false, serviceRef: 'svc://email', operation: 'send', inputVariableKeys: [] },
  ],
  transitions: [],
});

const instance = await runtime.startWorkflow({ organizationId: orgId, definitionId: definition.id });
// instance.status: 'completed' once every step in the graph resolves

await runtime.queries.findWorkflow({ organizationId: orgId, code: 'product-discovery' });
await runtime.queries.findRunningWorkflows({ organizationId: orgId, status: 'running' });
await runtime.queries.findWaitingTasks({ organizationId: orgId, workerId });
await runtime.queries.findHistory({ organizationId: orgId, instanceId: instance.id });

// Steps with no registered handler (e.g. human tasks) stay active until an
// external system reports the outcome:
await runtime.orchestrator.dispatch({
  organizationId: orgId,
  instanceId: instance.id,
  stepId: 's2',
  command: 'complete',
  issuedAt: new Date().toISOString(),
});
```

See [WORKFLOW_MODEL.md](./WORKFLOW_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/decision-engine`
- `@lateen-os/ai-runtime`
- `@lateen-os/ai-workforce`

## Verification

```bash
pnpm --filter @lateen-os/workflow-engine build
pnpm --filter @lateen-os/workflow-engine typecheck
pnpm --filter @lateen-os/workflow-engine test
```
