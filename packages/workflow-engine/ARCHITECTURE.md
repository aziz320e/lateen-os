# Workflow Engine — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)**

## Purpose

`@lateen-os/workflow-engine` is the **canonical orchestration layer** for Lateen OS. It defines how business processes flow across humans, AI workers, platform services, and the Decision Engine.

The package defines models and ports only — no persistence, UI, REST, or business logic execution.

---

## Orchestration principle

```
Workflow Engine  ── coordinates ──▶  Step handoffs
       │                                    │
       ├── HumanTask ──────────▶ Employee UI / task inbox
       ├── AITask ─────────────▶ AI Workforce → AI Runtime
       ├── ServiceTask ────────▶ Platform services (HTTP at runtime)
       └── DecisionTask ───────▶ Decision Engine
```

The engine **never** executes domain logic. It dispatches `ExecutionCommand` via `WorkflowOrchestrator` and records history.

---

## Module map

| Module | Types | Repository / Port |
| ------ | ----- | ----------------- |
| `workflow` | WorkflowDefinition, WorkflowVersion, WorkflowMetadata | WorkflowDefinitionRepository |
| `instance` | WorkflowInstance, WorkflowExecution, WorkflowStatus | WorkflowInstanceRepository |
| `step` | WorkflowStep, HumanTask, AITask, ServiceTask, DecisionTask, StepInstance | StepInstanceRepository |
| `transition` | Transition, ConditionalTransition, ParallelTransition | — |
| `trigger` | ManualTrigger, ScheduledTrigger, EventTrigger | TriggerDefinitionRepository |
| `condition` | Expression, Rule, PolicyCondition | ExpressionRepository, RuleRepository |
| `action` | NotificationAction, ServiceAction, AITaskAction, DecisionAction | — |
| `approval` | ApprovalStep, Approver, ApprovalChain | ApprovalStepRepository |
| `execution` | ExecutionCommand, ExecutionHandoff, WorkflowOrchestrator | WorkflowOrchestrator (port) |
| `history` | WorkflowHistory, ExecutionHistory, AuditTrail | History repositories |
| `templates` | WorkflowTemplate | WorkflowTemplateRepository |
| `scheduler` | WorkflowSchedule | WorkflowScheduleRepository |
| `queries` | WorkflowQueries | — |
| `events` | WorkflowEngineDomainEvent | — |

---

## Platform integration

| Step type | Handoff target | Platform package |
| --------- | -------------- | ---------------- |
| `HumanTask` | Employee assignee | `@lateen-os/business-dna` (EmployeeId) |
| `AITask` | AI worker + runtime task | `@lateen-os/ai-workforce`, `@lateen-os/ai-runtime` |
| `ServiceTask` | External service ref | Resolved at runtime (e.g. Product Discovery) |
| `DecisionTask` | Decision submission | `@lateen-os/decision-engine` |

---

## Dependency rules

| May depend on | Must not depend on |
| ------------- | ------------------ |
| `@lateen-os/shared-kernel` | Apps, services, UI |
| `@lateen-os/business-dna` | Database ORMs |
| `@lateen-os/decision-engine` | HTTP frameworks |
| `@lateen-os/ai-runtime` | LLM SDKs |
| `@lateen-os/ai-workforce` | Persistence implementations |

See [WORKFLOW_MODEL.md](./WORKFLOW_MODEL.md) for lifecycle and execution flow diagrams.
