# Workflow Engine Model

> Contracts for the canonical orchestration layer of Lateen OS.

---

## Orchestration Stack

```mermaid
flowchart TB
  subgraph WorkflowEngine["Workflow Engine"]
    DEF[WorkflowDefinition]
    INST[WorkflowInstance]
    STEP[Steps]
    TRANS[Transitions]
    APP[ApprovalChain]
  end

  subgraph Actors["Execution Targets"]
    HUMAN[Human Employee]
    AIW[AI Workforce Worker]
    SVC[Platform Service]
    DE[Decision Engine]
  end

  DEF --> INST
  INST --> STEP
  STEP --> TRANS
  STEP --> APP

  STEP -->|HumanTask| HUMAN
  STEP -->|AITask| AIW
  STEP -->|ServiceTask| SVC
  STEP -->|DecisionTask| DE

  AIW --> RT[AI Runtime]
```

---

## Workflow Lifecycle

```mermaid
stateDiagram-v2
  [*] --> pending: Trigger fired
  pending --> running: Orchestrator starts
  running --> waiting: Step awaits actor
  waiting --> running: Actor completes
  running --> suspended: Manual suspend
  suspended --> running: Resume
  running --> completed: Final step done
  running --> failed: Unrecoverable error
  running --> cancelled: Cancel command
  completed --> [*]
  failed --> [*]
  cancelled --> [*]
```

### WorkflowStatus values

| Status | Meaning |
| ------ | ------- |
| `pending` | Instance created, not yet started |
| `running` | Actively executing steps |
| `waiting` | Blocked on human, AI, service, or approval |
| `suspended` | Paused by operator |
| `completed` | All steps finished successfully |
| `failed` | Terminal error |
| `cancelled` | Terminated by user or system |
| `terminated` | Forced shutdown |

---

## Step Types

| Type | Interface | Handoff |
| ---- | --------- | ------- |
| Human | `HumanTask` | Employee or role inbox |
| AI | `AITask` | WorkerId → AI Runtime TaskId |
| Service | `ServiceTask` | ServiceReference + operation |
| Decision | `DecisionTask` | Decision Engine submission |
| Gateway | `WorkflowStep` | Conditional / parallel routing |

---

## Transition Flow

```mermaid
flowchart LR
  A[Step A] -->|Sequential| B[Step B]
  A -->|Conditional| C{Expression}
  C -->|true| D[Step D]
  C -->|false| E[Step E]
  F[Fork] --> G[Branch 1]
  F --> H[Branch 2]
  G --> J[Join]
  H --> J
  J --> K[Next Step]
```

| Transition | Interface | Use |
| ---------- | --------- | --- |
| Sequential | `Transition` | Default next step |
| Conditional | `ConditionalTransition` | Rule / expression evaluation |
| Parallel | `ParallelTransition` | Fork/join branches |

---

## Trigger Types

| Trigger | Interface | Starts when |
| ------- | --------- | ----------- |
| Manual | `ManualTrigger` | User or system invokes |
| Scheduled | `ScheduledTrigger` | Cron / interval fires |
| Event | `EventTrigger` | NATS subject pattern matches |

---

## Execution Flow

```mermaid
sequenceDiagram
  participant T as Trigger
  participant O as WorkflowOrchestrator
  participant I as WorkflowInstance
  participant S as Step
  participant A as Actor

  T->>O: start instance
  O->>I: status = running
  O->>S: dispatch ExecutionCommand
  alt HumanTask
    S->>A: assign to employee
  else AITask
    S->>A: schedule via AI Workforce
  else ServiceTask
    S->>A: invoke service ref
  else DecisionTask
    S->>A: submit to Decision Engine
  end
  A-->>O: step complete
  O->>I: evaluate transition
  O->>S: next step or complete
```

The orchestrator **coordinates** — actors **execute**.

---

## Approval Flow

```mermaid
sequenceDiagram
  participant WF as Workflow
  participant AS as ApprovalStep
  participant AC as ApprovalChain
  participant AP as Approver
  participant DE as Decision Engine

  WF->>AS: create approval step
  AS->>AC: resolve chain
  loop each approver
    AC->>AP: request approval
    AP-->>AC: approved / rejected
  end
  alt requires decision
    AC->>DE: DecisionTask
    DE-->>WF: decision reference
  end
  WF->>WF: continue or terminate
```

---

## Query Port

| Method | Returns |
| ------ | ------- |
| `findWorkflow()` | Definition, version, steps |
| `findRunningWorkflows()` | Active instances |
| `findWaitingTasks()` | Step instances awaiting actors |
| `findHistory()` | Workflow, execution, and audit history |

---

## Domain Events

| Event | When |
| ----- | ---- |
| `workflow.defined` | New definition created |
| `workflow.published` | Version published |
| `workflow_instance.started` | Instance begins |
| `workflow_instance.completed` | Instance finishes |
| `step.started` | Step execution begins |
| `step.waiting` | Step blocked on actor |
| `approval.requested` | Approval chain activated |
| `approval.approved` | Approver accepts |

---

## Constraints

- Contracts only — no UI, REST, database, LLM, or persistence
- Engine coordinates; platform packages execute
- All decision finalization via `@lateen-os/decision-engine`
