# AI Brain — Planning Model

Contracts only. Describes how orchestration plans are structured — not how they are executed.

## Plan hierarchy

```
ExecutionPlan (platform orchestration plan)
├── MissionPlan?          → Multi-Agent mission
├── WorkflowPlan[]        → Workflow Engine instances
├── WorkerPlan[]          → AI Workforce assignments
└── ExecutionGraph        → DAG of execution nodes
    ├── ExecutionNode[]
    ├── ExecutionEdge[]
    └── ExecutionCheckpoint[]
```

## ExecutionPlan

The top-level plan produced by AI Brain. Distinct from:

- `@lateen-os/ai-runtime` `ExecutionPlan` — task-level agent steps
- `@lateen-os/decision-engine` `DecisionExecutionPlan` — decision execution steps

Brain `ExecutionPlan` orchestrates **platform-level actions** across missions, workflows, services, and workers.

### Status lifecycle

```
draft → pending_validation → validated → ready → executing → completed
                          ↘ rejected
                          ↘ failed
```

## Sub-plans

### MissionPlan

| Field | Description |
| ----- | ----------- |
| `missionType` | e.g. `launch_product`, `market_analysis` |
| `objective` | Business objective summary |
| `priority` | critical / high / medium / low |
| `missionId` | Existing mission to continue (optional) |

### WorkflowPlan

| Field | Description |
| ----- | ----------- |
| `workflowDefinitionId` | Template to start |
| `workflowInstanceId` | Existing instance to advance (optional) |
| `trigger` | Event or condition triggering the workflow |
| `inputPayload` | Initial workflow data |

### WorkerPlan

| Field | Description |
| ----- | ----------- |
| `workerId` | Assigned AI worker |
| `role` | Role in mission or task |
| `taskSummary` | What the worker should do |
| `skillsRequired` | Required skill tags |

## ExecutionGraph

Directed acyclic graph describing **how** planned actions execute.

### Node kinds

| Kind | Target |
| ---- | ------ |
| `service_call` | Platform backend service |
| `workflow_start` | Workflow Engine |
| `mission_start` | Multi-Agent |
| `worker_delegate` | AI Workforce |
| `decision_gate` | Decision Engine checkpoint |
| `validation` | Plan validation step |
| `checkpoint` | Human or system gate |
| `parallel_fork` / `parallel_join` | Parallel execution |

### Edge kinds

| Kind | Description |
| ---- | ----------- |
| `sequential` | Execute after predecessor |
| `conditional` | Execute if condition met |
| `parallel` | Concurrent branch |
| `fallback` | Execute on failure |

### Checkpoints

Validation gates within the graph:

- Reference validation contracts by `validationRef`
- Status: pending → passed | failed | skipped

## Validation before execution

Before `execution.requested`:

1. **PermissionValidation** — actor has required permissions
2. **PolicyValidation** — organizational policies satisfied
3. **BusinessValidation** — domain rules satisfied

Failed validation → `plan.rejected` event.

## Reflection loop

After plan creation, `BrainReflector` may suggest `PlanImprovement` items:

- Routing adjustments
- Resource allocation
- Sequencing changes
- Clarification requests

If `shouldRevise` is true, the planner may regenerate the plan (implementation concern).

## Routing integration

`PlatformRouter` produces routes that inform sub-plans:

```
ReasoningResult → RoutingDecision
  ├── ServiceRoute[]   → service_call nodes
  ├── WorkflowRoute[]  → WorkflowPlan entries
  ├── MissionRoute[]   → MissionPlan entry
  └── WorkerRoute[]    → WorkerPlan entries
```

## Events

| Event | When |
| ----- | ---- |
| `plan.created` | Valid plan produced |
| `plan.rejected` | Plan failed validation |
| `execution.requested` | Approved plan sent for execution |

## Port: BrainPlanner

```typescript
interface BrainPlanner {
  createPlan(input: PlanningInput): Promise<ExecutionPlan>;
}
```

Execution adapters (in services) translate `ExecutionPlan` into calls to AI Runtime, Workflow Engine, Multi-Agent, and platform APIs.
