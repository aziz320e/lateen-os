# Multi-Agent Collaboration Engine

The **coordination layer above AI Workforce** for Lateen OS — a real, deterministic, offline, dependency-injected runtime that lets multiple AI workers cooperate on a single business objective.

## Purpose

`@lateen-os/multi-agent` implements the collaboration model between digital employees:

- CEO AI
- Product Manager AI
- Marketing AI
- Sales AI
- Operations AI
- Finance AI
- HR AI

Workers are coordinated through **AI Workforce**, **Workflow Engine**, **AI Runtime**, **AI Brain**, and **Decision Engine**.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation) / `service.impl.ts`
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers, no network calls; every collaborator (AI Runtime, AI Brain, Workflow Engine) is injected
- Dependency injection only — every `create*` factory takes its dependencies explicitly, defaulting to real in-memory implementations when omitted

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Agent Registry | `agent` | register / deactivate / setAvailability, backed by a real in-memory repository |
| Agent Directory | `agent` | findByRole / findAvailable / findByCapability over the registry |
| Agent Discovery | `agent` | picks the earliest-registered available match; throws `NoSuitableAgentError` |
| Agent Groups | `agent` | named groupings of workers |
| Agent Session | `session` | join/leave semantics for a worker's live engagement in a mission (idempotent start) |
| Agent Communication Bus | `conversation` | conversations, discussions, message history |
| Message Routing | `conversation` | `send()` broadcasts to every other active participant and returns the real recipient list |
| Delegation | `delegation` | requests/responses with real chain-depth computation enforced against policy `maxDepth` |
| Shared Context | `shared-context` | mission-scoped business context, memory references, decision references (versioned) |
| Shared Working Memory | `working-memory` | mission-scoped key/value blackboard (versioned per write) |
| Conflict Detection | `conflict` | flags ≥2 competing `submitted` proposals in the same discussion/conversation |
| Conflict Resolution | `conflict` | role-weighted vote tally, leader decision, or escalation |
| Coordination Policies | `coordination` | per-mission voting strategy / escalation threshold / delegation depth / auto-start policy |
| Agent Teams | `team` | assembles a mission team with a leader and required roles |
| Query Layer | `queries` | read-only `CollaborationQueries` port — missions, teams, negotiations, reviews, consensus results, agents, conflicts, working memory, active sessions, coordination plans |
| Event Bus | `events` | typed `CollaborationEventMap`; every declared event is genuinely published by the service that triggers it |

Also implemented: Mission Lifecycle (real state machine), Negotiation, Consensus (deterministic vote tallying under `unanimous` / `majority` / `weighted_by_role` / `leader_veto` / `decision_engine` strategies), Review, Escalation, the real Collaboration Orchestrator, and Execution finalization.

## Real integrations

- **AI Runtime** — `MultiAgentRuntime.registerAgent()` cross-validates against an injected `AgentRegistryService.getRegistry()` when the descriptor references a `runtimeAgentId`, throwing `AgentNotRegisteredError` if that runtime agent isn't actually registered there.
- **AI Brain** — the Escalation service consults an injected `Brain.process()` for `'ceo_ai'`-level escalations; a confident reflection (`!shouldRevise`) auto-resolves the escalation with Brain's own reasoning summary, otherwise it stays open for a human/worker to resolve.
- **Workflow Engine** — the Collaboration Orchestrator genuinely starts a `WorkflowRuntime` instance at a coordination step's `ready → running` transition when both a `WorkflowRuntime` and a step-to-definition mapping are injected, and reflects the resulting `WorkflowInstance.status` back onto the step.
- **Shared Kernel** — every repository is `createInMemoryRepository`; the event bus is `createEventBus`.

## Event bus

`CollaborationEventMap` declares 14 events, each genuinely published by the real service that causes it — there are no unpublished/placeholder events:

`agent.registered`, `agent.availability_changed`, `mission.started`, `mission.completed`, `mission.escalated`, `session.started`, `session.ended`, `message.routed`, `delegation.requested`, `delegation.responded`, `consensus.reached`, `conflict.detected`, `conflict.resolved`, `coordination_step.advanced`.

## Usage

```typescript
import { createMultiAgentRuntime } from '@lateen-os/multi-agent';

const runtime = createMultiAgentRuntime();

await runtime.registerAgent('org-1', { workerId: 'w1', role: 'sales_ai', capabilities: [], displayName: 'Sales' });

const mission = await runtime.missions.create({
  organizationId: 'org-1',
  code: 'q3-launch',
  title: 'Q3 product launch',
  description: 'Coordinate the Q3 launch across teams.',
  priority: 'high',
  leadWorkerRole: 'ceo_ai',
});

const team = await runtime.team.assemble({
  organizationId: 'org-1',
  missionId: mission.id,
  name: 'Launch team',
  leaderWorkerId: 'ceo-worker',
  leaderRole: 'ceo_ai',
  requiredRoles: ['sales_ai'],
});
await runtime.team.addMember('org-1', team.id, 'w1', { role: 'sales_ai', responsibilities: [], decisionAuthority: 'approve' });

const planId = await runtime.orchestrator.startMission('org-1', mission.id);
```

To wire in the real cross-package collaborators:

```typescript
const runtime = createMultiAgentRuntime({
  runtimeAgentRegistry: aiRuntimeAgentRegistryService,
  brain: aiBrain,
  workflowRuntime: workflowEngineRuntime,
  workflowDefinitionIdForStep: (step) => stepDefinitionMap[step.assignedRole],
});
```

## Modules

| Module | Key types |
| ------ | --------- |
| `mission` | Mission, MissionObjective, MissionPriority, MissionStatus, MissionContext |
| `team` | MissionTeam, MissionMember, MissionLeader, MissionRole |
| `agent` | AgentDescriptor, AgentRegistration, AgentGroup, AgentAvailability |
| `session` | AgentSession |
| `working-memory` | SharedWorkingMemoryEntry |
| `conversation` | Conversation, Message, Discussion, DecisionProposal |
| `delegation` | DelegationRequest, DelegationResponse, DelegationPolicy |
| `negotiation` | Negotiation, NegotiationRound, NegotiationOutcome |
| `consensus` | ConsensusResult, VotingStrategy, Agreement |
| `review` | ReviewRequest, ReviewResult, ReviewComment |
| `escalation` | EscalationRequest, EscalationLevel, EscalationDecision |
| `conflict` | Conflict, ConflictStatus, ConflictResolutionMethod |
| `coordination` | Coordinator, CoordinationPlan, CoordinationStep, CoordinationPolicy, CollaborationOrchestrator |
| `shared-context` | SharedBusinessContext, SharedMemoryReference, SharedDecisionReference |
| `execution` | MissionExecution, ExecutionStage, ExecutionResult |
| `queries` | CollaborationQueries (11 query methods) |
| `events` | CollaborationEventMap (14 event types) |

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/institutional-memory`
- `@lateen-os/decision-engine`
- `@lateen-os/ai-runtime`
- `@lateen-os/ai-workforce`
- `@lateen-os/ai-brain`
- `@lateen-os/workflow-engine`

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MISSION_MODEL.md](./MISSION_MODEL.md)

## Verification

```bash
pnpm --filter @lateen-os/multi-agent build
pnpm --filter @lateen-os/multi-agent typecheck
pnpm --filter @lateen-os/multi-agent test
pnpm --filter @lateen-os/multi-agent lint
```
