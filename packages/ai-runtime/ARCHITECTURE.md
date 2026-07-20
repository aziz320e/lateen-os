# AI Runtime — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)** — Layer 4: AI Workforce

## Purpose

`@lateen-os/ai-runtime` is the **canonical operating system for AI agents** in Lateen OS. It manages agent registration, sessions, tasks, execution, conversation, working memory, orchestration, tooling, permissions, and telemetry.

The package defines models and ports only — no LLM integration, persistence, UI, API, or business logic.

---

## Architectural rule

```
Business DNA Agent (identity)
        │
        ▼
   Agent Registry ──▶ Runtime Session ──▶ Task ──▶ Execution
        │                    │              │
        ▼                    ▼              ▼
   Permissions          Working Memory   Planner / Scheduler
        │                    │              │
        ▼                    ▼              ▼
   Orchestrator ◀──── Communication ──▶ Tooling
        │
        ▼
   Telemetry & Monitoring
```

Every AI agent **must execute inside AI Runtime**. Runtime agents link to Business DNA via `businessDnaAgentId`.

---

## Module map

| Module | Types | Events | Repository / Port |
| ------ | ----- | ------ | ----------------- |
| `agent` | Agent, AgentProfile, AgentRole, AgentCapability, AgentStatus, AgentLifecycle | ✓ | AgentRepository |
| `registry` | AgentRegistry, AgentRegistration, AgentDescriptor | ✓ | AgentRegistryRepository |
| `runtime` | RuntimeSession, RuntimeState, RuntimeContext | ✓ | RuntimeSessionRepository |
| `task` | Task, TaskQueue, TaskPriority, TaskStatus, TaskResult | ✓ | TaskRepository |
| `execution` | ExecutionPlan, ExecutionContext, ExecutionResult | ✓ | ExecutionPlanRepository, ExecutionResultRepository |
| `conversation` | Conversation, ConversationMessage, ConversationThread | ✓ | ConversationRepository |
| `memory` | WorkingMemory, MemoryReference, ContextWindow | ✓ | WorkingMemoryRepository |
| `context` | AgentContext, BusinessContext, DecisionContextReference | ✓ | AgentContextRepository |
| `planner` | Planner (port), Plan, PlanStep | ✓ | PlanRepository |
| `scheduler` | Scheduler (port), Schedule, Trigger | ✓ | ScheduleRepository |
| `orchestrator` | Orchestrator (port), AgentCoordinator, MultiAgentWorkflow | ✓ | MultiAgentWorkflowRepository |
| `communication` | AgentMessage, MessageType, Channel | ✓ | AgentMessageRepository |
| `tooling` | Tool, ToolCall, ToolResult, ToolDescriptor | ✓ | ToolRepository, ToolCallRepository |
| `permissions` | RuntimePermission, AgentPermission, CapabilityPermission | ✓ | AgentPermissionRepository |
| `monitoring` | HealthStatus, RuntimeMetrics, ExecutionMetrics | ✓ | RuntimeMetricsRepository |
| `telemetry` | TelemetryEvent, Trace, Span | ✓ | TelemetryEventRepository, TraceRepository |
| `events` | AiRuntimeDomainEvent union | — | — |
| `queries` | RuntimeQueries | — | — |

---

## Dependency rules

```
┌──────────────────────────────────────────────┐
│  Applications, Adapters (future)             │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│           @lateen-os/ai-runtime              │
└──┬────┬────┬────┬────┬────┬────┬────────────┘
   │    │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼    ▼
  SK   BD   CE   DG   IM   DE   IE
```

SK = shared-kernel, BD = business-dna, CE = capability-engine, DG = domain-graph, IM = institutional-memory, DE = decision-engine, IE = intelligence-engine

### Forbidden

- LLM / OpenAI / Claude SDK in this package
- Persistence, ORM, UI, HTTP
- Business logic or decision execution
- Upstream packages importing ai-runtime

---

## Agent lifecycle diagram

```mermaid
stateDiagram-v2
  [*] --> created
  created --> registered: register in registry
  registered --> activated: activate agent
  activated --> executing: start session / task
  executing --> paused: pause
  paused --> executing: resume
  executing --> suspended: suspend
  suspended --> activated: reactivate
  executing --> terminated: terminate
  paused --> terminated: terminate
  suspended --> terminated: terminate
  terminated --> archived: archive
  archived --> [*]
```

---

## Execution flow diagram

```mermaid
flowchart TD
  START([Decision authorized / trigger fired]) --> REG{Agent registered?}
  REG -->|no| FAIL([Reject])
  REG -->|yes| SESS[Start RuntimeSession]
  SESS --> CTX[Assemble AgentContext]
  CTX --> WM[Initialize WorkingMemory]
  WM --> TASK[Enqueue Task]
  TASK --> PLAN[Planner.createPlan]
  PLAN --> EXEC[ExecutionPlan.run]
  EXEC --> TOOL{Tool calls?}
  TOOL -->|yes| TC[ToolCall → ToolResult]
  TC --> EXEC
  TOOL -->|no| RES[ExecutionResult]
  RES --> TEL[Telemetry + Metrics]
  TEL --> DONE([Session continues or terminates])
```

---

## Dependency diagram

```mermaid
flowchart BT
  subgraph consumers [Future Consumers]
    APP[Applications]
    ADP[LLM Adapters]
  end

  subgraph ar ["@lateen-os/ai-runtime"]
    IDX[index.ts]
    AGT[agent]
    REG[registry]
    RT[runtime]
    TSK[task]
    EXE[execution]
    CONV[conversation]
    MEM[memory]
    CTX[context]
    PLN[planner]
    SCH[scheduler]
    ORC[orchestrator]
    COM[communication]
    TOL[tooling]
    PER[permissions]
    MON[monitoring]
    TEL[telemetry]
    EVT[events]
    Q[queries]
  end

  subgraph upstream [Upstream Packages]
    SK[shared-kernel]
    BD[business-dna]
    CE[capability-engine]
    DG[domain-graph]
    IM[institutional-memory]
    DE[decision-engine]
    IE[intelligence-engine]
  end

  APP --> IDX
  ADP --> IDX

  IDX --> AGT & REG & RT & TSK & EXE & CONV & MEM & CTX & PLN & SCH & ORC & COM & TOL & PER & MON & TEL & EVT & Q

  AGT --> BD & CE
  CTX --> DG & DE & IE & IM
  MEM --> IM
  PER --> BD

  BD --> SK
  CE --> BD
  DG --> BD & CE
  IM --> BD & DG
  DE --> SK & BD & CE & DG & IM
  IE --> SK & BD & CE & DG & IM & DE
```

---

## Query port

`RuntimeQueries`:

- `findAgent`
- `findTasks`
- `findSessions`
- `findConversations`
- `findRuntimeState`
- `findExecutionHistory`

---

## Relationship to other layers

| Layer | Role |
| ----- | ---- |
| Intelligence Engine | Produces recommendations |
| Decision Engine | Approves / authorizes actions |
| **AI Runtime** | Executes authorized agent work |
| Business DNA | Defines agent identity & workforce type |

Runtime `Agent` ≠ Business DNA `Agent`. They are linked via `businessDnaAgentId`.
