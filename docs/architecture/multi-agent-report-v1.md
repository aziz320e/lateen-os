# Multi-Agent Collaboration Engine — Architecture Report (Epic 11)

> **Date:** 2026-07-19  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Epic 11 introduces `@lateen-os/multi-agent`, the **Multi-Agent Collaboration Engine** — the coordination layer above AI Workforce that allows multiple AI workers to cooperate on a single business objective. The package defines contracts and orchestration models only; no implementation, persistence, UI, or LLM integration.

**No existing packages were modified.**

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/multi-agent` | Done |
| 12 domain modules | Done |
| Mission, Team, Conversation, Delegation, Negotiation, Consensus, Review, Escalation, Coordination, Shared Context, Execution | Done |
| CollaborationQueries (5 methods) | Done |
| CollaborationOrchestrator port | Done |
| 6 domain events | Done |
| Repository ports per module | Done |
| README, ARCHITECTURE, MISSION_MODEL docs | Done |
| Sequence + collaboration diagrams | Done |
| `pnpm build` | Passed |
| `pnpm typecheck` | Passed |

## Goal

Provide the contracts and orchestration model for collaboration between AI workers (CEO, Product Manager, Marketing, Sales, Operations, Finance, HR) through AI Workforce, Workflow Engine, and Decision Engine.

## Package structure

```
packages/multi-agent/
├── src/
│   ├── shared/           # Identifiers, entity, repository, domain-event
│   ├── mission/
│   ├── team/
│   ├── conversation/
│   ├── delegation/
│   ├── negotiation/
│   ├── consensus/
│   ├── review/
│   ├── escalation/
│   ├── coordination/     # CollaborationOrchestrator port
│   ├── shared-context/
│   ├── execution/
│   ├── queries/          # CollaborationQueries
│   ├── events/
│   └── index.ts
├── README.md
├── ARCHITECTURE.md
└── MISSION_MODEL.md
```

## Module coverage

| Module | Entities |
| ------ | -------- |
| mission | Mission, MissionObjective, MissionPriority, MissionStatus, MissionContext |
| team | MissionTeam, MissionMember, MissionLeader, MissionRole |
| conversation | Conversation, Message, Discussion, DecisionProposal |
| delegation | DelegationRequest, DelegationResponse, DelegationPolicy |
| negotiation | Negotiation, NegotiationRound, NegotiationOutcome |
| consensus | ConsensusResult, VotingStrategy, Agreement |
| review | ReviewRequest, ReviewResult, ReviewComment |
| escalation | EscalationRequest, EscalationLevel, EscalationDecision |
| coordination | Coordinator, CoordinationPlan, CoordinationStep |
| shared-context | SharedBusinessContext, SharedMemoryReference, SharedDecisionReference |
| execution | MissionExecution, ExecutionStage, ExecutionResult |

## Queries

| Method | Purpose |
| ------ | ------- |
| `findMission()` | Mission discovery |
| `findTeams()` | Team lookup |
| `findOpenNegotiations()` | Active negotiations |
| `findPendingReviews()` | Pending reviews |
| `findConsensus()` | Consensus results |

## Events

| Event | Name |
| ----- | ---- |
| MissionStarted | `mission.started` |
| MissionCompleted | `mission.completed` |
| WorkerAssigned | `worker.assigned` |
| DelegationCreated | `delegation.created` |
| ConsensusReached | `consensus.reached` |
| MissionEscalated | `mission.escalated` |

## Platform dependencies

| Package | Usage |
| ------- | ----- |
| shared-kernel | Entity, DomainEvent, Identifier |
| business-dna | OrganizationId, ProjectId |
| institutional-memory | KnowledgeEntryId |
| decision-engine | DecisionId |
| ai-runtime | TaskId, RuntimeAgentId |
| ai-workforce | WorkerId |
| workflow-engine | WorkflowInstanceId |

## Verification

```bash
pnpm --filter @lateen-os/multi-agent build
pnpm --filter @lateen-os/multi-agent typecheck
```

| Check | Result |
| ----- | ------ |
| build | Passed |
| typecheck | Passed |

## Architectural boundaries

- Multi-Agent coordinates — does not execute business logic or LLM calls
- AI Workforce manages workers — Multi-Agent assigns them to missions
- Workflow Engine orchestrates processes — Multi-Agent links coordination steps
- Decision Engine finalizes decisions — Multi-Agent submits proposals
- No persistence in this package — repositories are ports only

## Next steps

- Implement CollaborationOrchestrator in a future service
- Wire NATS event publishing for collaboration events
- Build mission dashboard UI (separate epic)
