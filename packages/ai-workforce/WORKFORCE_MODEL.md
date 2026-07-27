# AI Workforce Model

> Contracts for the organizational layer above AI Runtime.

---

## Organization Diagram

```mermaid
flowchart TB
  subgraph BusinessDNA["Business DNA (Layer 1)"]
    ORG[Organization]
    DEPT[Departments]
    AGENT[Agent Records]
    EMP[Employees]
  end

  subgraph AIWorkforce["AI Workforce (Layer 4 — Organization)"]
    REG[Worker Registry]
    WORKER[AI Workers]
    TEAM[AI Teams]
    GOALS[Goals & OKRs]
    PERF[Performance]
    GOV[Governance]
  end

  subgraph AIRuntime["AI Runtime (Layer 4 — Execution)"]
    RTAGENT[Runtime Agents]
    TASK[Tasks]
    EXEC[Execution]
  end

  subgraph Platform["Platform Services"]
    DE[Decision Engine]
    IM[Institutional Memory]
    IE[Intelligence Engine]
  end

  ORG --> REG
  AGENT --> WORKER
  DEPT --> TEAM
  EMP --> SUP[Supervisors]

  REG --> WORKER
  WORKER --> RTAGENT
  WORKER --> TEAM
  WORKER --> GOALS
  WORKER --> PERF
  WORKER --> GOV

  RTAGENT --> TASK --> EXEC
  WORKER --> DE
  WORKER --> IM
  WORKER --> IE
  SUP --> GOV
```

---

## Worker Lifecycle

```mermaid
stateDiagram-v2
  [*] --> registered: WorkerRegistration
  registered --> provisioned: link runtimeAgentId
  provisioned --> activated: supervisor approval
  activated --> assigned: TaskAssignment
  assigned --> executing: AI Runtime task running
  executing --> reviewing: output ready
  reviewing --> assigned: more work
  reviewing --> paused: supervisor hold
  executing --> paused: capacity limit
  paused --> activated: resume
  activated --> suspended: policy violation
  suspended --> activated: reinstate
  activated --> offboarded: decommission
  offboarded --> [*]
```

### Lifecycle stages

| Stage | Description |
| ----- | ----------- |
| `registered` | Worker record created in registry |
| `provisioned` | Linked to Business DNA agent and AI Runtime agent |
| `activated` | Available for task assignment |
| `assigned` | Task or goal assigned |
| `executing` | AI Runtime running a task |
| `reviewing` | Output pending supervisor review |
| `paused` | Temporarily unavailable |
| `suspended` | Governance hold |
| `offboarded` | Removed from active workforce |

### Real implementation: `WorkerLifecycleService`

`worker/lifecycle.impl.ts`'s `createWorkerLifecycle()` implements this as a real, guarded state machine over `WorkerStatus` (the diagram above is the conceptual model; `WorkerStatus` is the concrete, persisted field it drives):

```
draft ──(hire)──> onboarding ──(activate)──> active ──(suspend)──> suspended ──(resume)──> active
active ──> busy / away / paused ──(retire, from any non-terminal state)──> offboarded ──> archived
```

Five guarded operations — `hire`, `activate`, `suspend`, `resume`, `retire` — each reject a transition the table above doesn't allow, throwing `InvalidWorkerTransitionError`. `canTransitionWorker(from, to)` is exported standalone for inspection. Every transition publishes its corresponding `worker.*` event on `WorkforceEventBus`.

---

## Delegation Flow

```mermaid
sequenceDiagram
  participant SW as Source Worker
  participant WF as AI Workforce
  participant RULE as DelegationRule
  participant TW as Target Worker
  participant SUP as Supervisor
  participant DE as Decision Engine
  participant RT as AI Runtime

  SW->>WF: DelegationRequest
  WF->>RULE: evaluate rule
  alt requires approval
    RULE->>SUP: ApprovalRequirement
    SUP->>DE: submit for decision
    DE-->>WF: approved / rejected
  end
  WF->>TW: assign delegated scope
  TW->>RT: schedule task
  RT-->>TW: ExecutionResult
  TW->>WF: DelegationResult
  WF->>SW: notify completion
```

### Delegation scopes

| Scope | Description |
| ----- | ----------- |
| `task` | Single runtime task handoff |
| `decision` | Decision preparation (not finalization) |
| `goal` | Objective or key result ownership |
| `conversation` | Collaborative thread ownership |
| `full_handoff` | Complete responsibility transfer |

---

## Key aggregates

### AIWorker

The central aggregate. Links organizational identity to runtime execution:

```typescript
interface AIWorker {
  businessDnaAgentId: AgentId;   // Business DNA
  runtimeAgentId: RuntimeAgentId; // AI Runtime
  profile: WorkerProfile;
  roles: WorkerRole[];
  capabilities: WorkerCapability[];
  skills: WorkerSkill[];
  availability: WorkerAvailability;
  status: WorkerStatus;
  lifecycle: WorkerLifecycle;
}
```

### AITeam

Collaborative unit of workers with a lead and shared objectives.

### DelegationRequest

Formal handoff between workers, governed by `DelegationRule` and optionally requiring supervisor approval via Decision Engine.

### TaskAssignment

Workforce-level binding of an AI Runtime `TaskId` to a `WorkerId`.

### Goal → Objective → KeyResult

OKR hierarchy for measuring worker and team outcomes over defined periods.

---

## Query port

`WorkforceQueries` is the original contract for read-side access:

| Method | Returns |
| ------ | ------- |
| `findWorkers()` | Active and filtered workers |
| `findTeams()` | Teams and membership |
| `findGoals()` | Goals, objectives, key results |
| `findPerformance()` | Metrics, scores, task statistics |
| `findAssignments()` | Task assignments by worker or task |
| `findAvailability()` | Capacity snapshots for scheduling |

### Real implementation: `WorkforceRuntimeQueries`

`queries/runtime-queries.impl.ts`'s `createWorkforceRuntimeQueries()` is the real query layer exposed by `createWorkforceRuntime()` — composed purely over repositories and engines, never returning a repository itself:

| Method | Returns |
| ------ | ------- |
| `findWorkers()` | Workers filtered by status / workforce type / department |
| `findAvailableWorkers()` | Workers with `available` capacity, optionally filtered by role |
| `findAssignments()` | Real `TaskAssignment` records by worker / task / status |
| `findCapabilities()` | The organization's skill catalog |
| `findPerformance()` | Real `PerformanceMetrics` snapshots + computed `WorkerScore` + `TaskStatistics` |
| `findCapacity()` | Real-time `AvailabilitySnapshot`s from the Capacity Engine |

---

## Constraints

- No UI, API, LLM, or persistence in this package
- Workers recommend — Decision Engine decides
- All future AI worker apps consume this package
