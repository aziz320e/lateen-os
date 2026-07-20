# AI Runtime — Architecture Report (Sprint 8)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked) — Layer 4: AI Workforce

## Executive summary

Sprint 8 introduces `@lateen-os/ai-runtime`, the canonical operating system for AI agents in Lateen OS. The package defines 18 bounded-context modules covering agent lifecycle, registry, sessions, tasks, execution, conversation, working memory, context assembly, planning, scheduling, orchestration, communication, tooling, permissions, monitoring, and telemetry — with domain events, repository ports, service ports (Planner, Scheduler, Orchestrator), and query interfaces. No LLM integration, persistence, UI, API, or business logic.

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/ai-runtime` package | Done |
| 18 modules (incl. events, queries) | Done |
| 14+ aggregates with events & repositories | Done |
| Planner, Scheduler, Orchestrator ports | Done |
| RuntimeQueries (6 methods) | Done |
| README, ARCHITECTURE, RUNTIME_MODEL | Done |
| Agent lifecycle + execution flow + dependency diagrams | Done |
| Typecheck | Passed |

## Architectural boundary

- **Intelligence Engine** — produces intelligence and recommendations
- **Decision Engine** — authorizes business actions
- **AI Runtime** — executes agent lifecycle, tasks, and orchestration
- **Adapters (future)** — LLM providers live outside this package

Every AI agent must execute inside AI Runtime. Runtime `Agent` links to Business DNA `Agent` via `businessDnaAgentId`.

## Modules (18)

shared, agent, registry, runtime, task, execution, conversation, memory, context, planner, scheduler, orchestrator, communication, tooling, permissions, monitoring, telemetry, events, queries

## Key types per sprint spec

All requested types implemented:

| Area | Types |
| ---- | ----- |
| Agent | Agent, AgentProfile, AgentRole, AgentCapability, AgentStatus, AgentLifecycle |
| Registry | AgentRegistry, AgentRegistration, AgentDescriptor |
| Runtime | RuntimeSession, RuntimeState, RuntimeContext |
| Task | Task, TaskQueue, TaskPriority, TaskStatus, TaskResult |
| Execution | ExecutionPlan, ExecutionContext, ExecutionResult |
| Conversation | Conversation, ConversationMessage, ConversationThread |
| Memory | WorkingMemory, MemoryReference, ContextWindow |
| Context | AgentContext, BusinessContext, DecisionContextReference |
| Planner | Planner, Plan, PlanStep |
| Scheduler | Scheduler, Schedule, Trigger |
| Orchestrator | Orchestrator, AgentCoordinator, MultiAgentWorkflow |
| Communication | AgentMessage, MessageType, Channel |
| Tooling | Tool, ToolCall, ToolResult, ToolDescriptor |
| Permissions | RuntimePermission, AgentPermission, CapabilityPermission |
| Monitoring | HealthStatus, RuntimeMetrics, ExecutionMetrics |
| Telemetry | TelemetryEvent, Trace, Span |

## Query port

`RuntimeQueries`: findAgent, findTasks, findSessions, findConversations, findRuntimeState, findExecutionHistory

## Dependencies

shared-kernel, business-dna, capability-engine, domain-graph, institutional-memory, decision-engine, intelligence-engine

No upstream packages modified. Acyclic dependency graph maintained.

## Design decisions

1. **Runtime Agent vs Business DNA Agent** — separate aggregates; linked by `businessDnaAgentId`
2. **RuntimeWorkforceType** — local union aligned with Business DNA (avoids non-exported type)
3. **WorkingMemory** — distinct from Institutional Memory; references only
4. **DecisionContextReference** — reference to Decision Engine, not full aggregate (avoids naming clash)
5. **Planner / Scheduler / Orchestrator** — ports only; implementations live in adapters

## Verification

```
pnpm install
pnpm typecheck
```

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [AI Runtime ARCHITECTURE.md](../packages/ai-runtime/ARCHITECTURE.md)
- [AI Runtime RUNTIME_MODEL.md](../packages/ai-runtime/RUNTIME_MODEL.md)
- [Intelligence Engine Report](./intelligence-engine-report-v1.md)
- [Decision Engine Report](./decision-engine-report-v1.md)
