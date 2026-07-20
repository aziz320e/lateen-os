# @lateen-os/workflow-engine

Workflow Engine — the canonical orchestration layer for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Workflow Engine **coordinates** execution across humans, AI workers, services, and business processes. It:

- **Does** orchestrate step handoffs, transitions, approvals, and scheduling
- **Does not** execute business logic, persist data, expose APIs, or render UI

```
Workflow Engine → coordinates
AI Runtime      → executes AI tasks
AI Workforce    → manages digital employees
Decision Engine → approves decisions
Services        → execute domain operations
```

## Scope

| Included | Excluded |
| -------- | -------- |
| Workflow definitions & versions | REST / HTTP |
| Instances & step coordination | Database / ORM |
| Human, AI, service, decision steps | UI |
| Transitions, triggers, conditions | LLM integration |
| Approval chains | Business logic implementation |
| History, audit, templates | Persistence implementation |
| Query ports & orchestrator port | |

## Modules

| Module | Focus |
| ------ | ----- |
| `workflow` | WorkflowDefinition, WorkflowVersion, WorkflowMetadata |
| `instance` | WorkflowInstance, WorkflowExecution, WorkflowStatus |
| `step` | WorkflowStep, HumanTask, AITask, ServiceTask, DecisionTask |
| `transition` | Transition, ConditionalTransition, ParallelTransition |
| `trigger` | ManualTrigger, ScheduledTrigger, EventTrigger |
| `condition` | Expression, Rule, PolicyCondition |
| `action` | NotificationAction, ServiceAction, AITaskAction, DecisionAction |
| `approval` | ApprovalStep, Approver, ApprovalChain |
| `execution` | WorkflowOrchestrator port, ExecutionCommand |
| `history` | WorkflowHistory, ExecutionHistory, AuditTrail |
| `templates` | WorkflowTemplate |
| `scheduler` | WorkflowSchedule |
| `queries` | WorkflowQueries read port |
| `events` | WorkflowEngineDomainEvent union |

## Usage

```typescript
import {
  workflow,
  instance,
  step,
  execution,
  queries,
  type WorkflowDefinition,
  type WorkflowOrchestrator,
  type WorkflowQueries,
} from '@lateen-os/workflow-engine';

declare const workflowQueries: WorkflowQueries;
declare const orchestrator: WorkflowOrchestrator;

await workflowQueries.findWorkflow({ organizationId: orgId, code: 'product-discovery' });
await workflowQueries.findRunningWorkflows({ organizationId: orgId, status: 'running' });
await workflowQueries.findWaitingTasks({ organizationId: orgId, workerId });
await workflowQueries.findHistory({ organizationId: orgId, instanceId });

await orchestrator.dispatch({
  instanceId,
  stepId,
  command: 'start',
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
```
