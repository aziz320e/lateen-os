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

`WorkforceQueries` provides read-side access:

| Method | Returns |
| ------ | ------- |
| `findWorkers()` | Active and filtered workers |
| `findTeams()` | Teams and membership |
| `findGoals()` | Goals, objectives, key results |
| `findPerformance()` | Metrics, scores, task statistics |
| `findAssignments()` | Task assignments by worker or task |
| `findAvailability()` | Capacity snapshots for scheduling |

---

## Constraints

- No UI, API, LLM, or persistence in this package
- Workers recommend — Decision Engine decides
- All future AI worker apps consume this package
