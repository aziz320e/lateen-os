# AI Brain — Architecture

Architecture v1.0 (locked). Real, deterministic implementations of every port described below live alongside each `types.ts`/port file as `*.impl.ts` — see [README.md](./README.md) for the module-to-implementation map.

## Platform position

```
┌─────────────────────────────────────────────────────────────┐
│  Applications & AI Workers                                  │
│  (AI Product Manager, Lateen Assistant, Customer Portal…)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  AI Brain (@lateen-os/ai-brain)                             │
│  Intent → Context → Reasoning → Routing → Planning        │
│  → Validation → Reflection → Execution Request              │
└───────┬─────────────┬──────────────┬────────────┬───────────┘
        │             │              │            │
        ▼             ▼              ▼            ▼
  AI Runtime    Workflow Engine   Multi-Agent   Platform
  (tasks)       (workflows)       (missions)    Services
```

AI Brain sits **above** execution layers. It produces orchestration decisions; downstream packages execute them.

## Module map

```
packages/ai-brain/src/
├── shared/           # Identifiers, entity base, domain events
├── intent/           # Intent recognition contracts
├── context/          # Enterprise context assembly
├── memory/           # Working memory retrieval
├── reasoning/        # Enterprise reasoning trace
├── routing/          # Service/workflow/mission/worker routing
├── planner/          # MissionPlan, WorkflowPlan, WorkerPlan, ExecutionPlan
├── execution-plan/   # ExecutionGraph DAG structure
├── validation/       # Permission, policy, business validation
├── reflection/       # Self-evaluation and plan improvement
├── queries/          # ExplainPlan, ExplainDecision, ExplainMission
├── events/           # Domain events for subscribers
├── brain.ts          # Central Brain port
└── index.ts          # Package barrel
```

## Capability ports

| Port | Module | Responsibility |
| ---- | ------ | -------------- |
| `IntentRecognizer` | intent | Parse input → `Intent` |
| `EnterpriseContextAssembler` | context | Assemble `EnterpriseContext` |
| `WorkingMemory` | memory | Retrieve `WorkingContext` |
| `EnterpriseReasoner` | reasoning | Produce `ReasoningResult` |
| `PlatformRouter` | routing | Select platform targets |
| `BrainPlanner` | planner | Create `ExecutionPlan` |
| `PlanValidator` | validation | Validate plan against governance |
| `BrainReflector` | reflection | Self-evaluate and suggest improvements |
| `Brain` | brain | Orchestrate full session |
| `BrainQueries` | queries | Read-side explanation queries |

## Distinction from other packages

| Package | Role | AI Brain relationship |
| ------- | ---- | --------------------- |
| `ai-runtime` | Agent task execution | Brain delegates task execution |
| `workflow-engine` | Workflow orchestration | Brain starts/advances workflows |
| `multi-agent` | Mission collaboration | Brain selects missions and workers |
| `decision-engine` | Decision lifecycle | Brain references decisions in context |
| `institutional-memory` | Long-term knowledge | Brain retrieves knowledge for reasoning |
| `domain-graph` | Entity relationships | Brain traverses graph for context |

## Event flow

```
User input
  → intent.recognized
  → reasoning.completed
  → plan.created | plan.rejected
  → execution.requested (if validated)
```

## Design constraints

1. **No implementations** — ports only
2. **No LLM SDK** — inference adapters live in services
3. **No persistence** — repositories not defined; query ports for read-side
4. **Reference, don't duplicate** — re-use IDs from upstream packages
5. **Orchestrate, don't execute** — Brain never runs business rules directly
