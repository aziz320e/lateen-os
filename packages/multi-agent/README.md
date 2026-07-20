# Multi-Agent Collaboration Engine

The **coordination layer above AI Workforce** for Lateen OS — allows multiple AI workers to cooperate on a single business objective.

## Purpose

`@lateen-os/multi-agent` is **not another AI agent**. It defines the contracts and orchestration model for collaboration between digital employees:

- CEO AI
- Product Manager AI
- Marketing AI
- Sales AI
- Operations AI
- Finance AI
- HR AI

Workers are coordinated through **AI Workforce**, **Workflow Engine**, and **Decision Engine**.

## Stack

- Pure TypeScript
- DDD bounded context
- Framework agnostic
- **Contracts only** — no UI, REST, database, persistence, or LLM SDK

## Modules

| Module | Key types |
| ------ | --------- |
| `mission` | Mission, MissionObjective, MissionPriority, MissionStatus, MissionContext |
| `team` | MissionTeam, MissionMember, MissionLeader, MissionRole |
| `conversation` | Conversation, Message, Discussion, DecisionProposal |
| `delegation` | DelegationRequest, DelegationResponse, DelegationPolicy |
| `negotiation` | Negotiation, NegotiationRound, NegotiationOutcome |
| `consensus` | ConsensusResult, VotingStrategy, Agreement |
| `review` | ReviewRequest, ReviewResult, ReviewComment |
| `escalation` | EscalationRequest, EscalationLevel, EscalationDecision |
| `coordination` | Coordinator, CoordinationPlan, CoordinationStep, CollaborationOrchestrator |
| `shared-context` | SharedBusinessContext, SharedMemoryReference, SharedDecisionReference |
| `execution` | MissionExecution, ExecutionStage, ExecutionResult |
| `queries` | CollaborationQueries (5 query methods) |
| `events` | 6 domain event types |

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/institutional-memory`
- `@lateen-os/decision-engine`
- `@lateen-os/ai-runtime`
- `@lateen-os/ai-workforce`
- `@lateen-os/workflow-engine`

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MISSION_MODEL.md](./MISSION_MODEL.md)

## Verification

```bash
pnpm --filter @lateen-os/multi-agent build
pnpm --filter @lateen-os/multi-agent typecheck
```
