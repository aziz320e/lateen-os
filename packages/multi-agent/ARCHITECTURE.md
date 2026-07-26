# Multi-Agent — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)** — Collaboration layer above AI Workforce

## Purpose

`@lateen-os/multi-agent` defines how multiple AI workers cooperate on a single business objective. It sits **above** `@lateen-os/ai-workforce` and coordinates workers through missions, teams, negotiation, consensus, and escalation — without executing business logic or LLM calls.

---

## Layer relationship

```
Business DNA (org structure & policies)
        │
        ▼
Multi-Agent ── coordinates workers on missions
        │
        ├── AI Workforce ── digital employee management
        ├── Workflow Engine ── process orchestration (coordination steps)
        ├── Decision Engine ── approval & policy
        ├── AI Runtime ── task execution (agent registry cross-validation)
        ├── AI Brain ── ceo_ai-level escalation reasoning
        └── Institutional Memory ── shared knowledge
```

---

## Module map

| Module | Types | Repository |
| ------ | ----- | ---------- |
| `mission` | Mission, MissionObjective, MissionContext | MissionRepository, MissionObjectiveRepository |
| `team` | MissionTeam, MissionMember, MissionLeader, MissionRole | MissionTeamRepository, MissionMemberRepository |
| `conversation` | Conversation, Message, Discussion, DecisionProposal | ConversationRepository, MessageRepository, … |
| `delegation` | DelegationRequest, DelegationResponse, DelegationPolicy | DelegationRequestRepository, DelegationPolicyRepository |
| `negotiation` | Negotiation, NegotiationRound, NegotiationOutcome | NegotiationRepository, NegotiationRoundRepository |
| `consensus` | ConsensusResult, VotingStrategy, Agreement | ConsensusResultRepository, AgreementRepository |
| `review` | ReviewRequest, ReviewResult, ReviewComment | ReviewRequestRepository, ReviewCommentRepository |
| `escalation` | EscalationRequest, EscalationLevel, EscalationDecision | EscalationRequestRepository, EscalationDecisionRepository |
| `coordination` | Coordinator, CoordinationPlan, CoordinationStep | CoordinatorRepository, CoordinationPlanRepository, … |
| `shared-context` | SharedBusinessContext, SharedMemoryReference, SharedDecisionReference | SharedBusinessContextRepository, … |
| `execution` | MissionExecution, ExecutionStage, ExecutionResult | MissionExecutionRepository, ExecutionStageRepository |
| `queries` | CollaborationQueries | — |
| `events` | CollaborationDomainEvent | — |

---

## Orchestration port

`CollaborationOrchestrator` is the primary coordination port:

```typescript
interface CollaborationOrchestrator {
  startMission(missionId: MissionId): Promise<CoordinationPlanId>;
  assignWorker(missionId, workerId, stepId): Promise<void>;
  advanceStep(stepId): Promise<CoordinationStepStatus>;
  escalate(missionId, reason): Promise<EscalationRequestId>;
  completeMission(missionId): Promise<MissionExecutionId>;
}
```

Implemented by `createCollaborationOrchestrator` in `coordination/orchestrator.impl.ts`. It builds a real `CoordinationPlan`/`CoordinationStep` chain from a mission's assembled team, advances steps through a real `pending → ready → running → completed` progression, genuinely starts a `@lateen-os/workflow-engine` `WorkflowRuntime` instance at the `ready → running` transition when one is injected, escalates through the real Escalation service (which may itself consult AI Brain), and finalizes missions through the real Execution service and Mission Lifecycle.

---

## Dependency rules

| May depend on | Must not depend on |
| ------------- | ------------------ |
| All listed platform packages | Apps, services, UI |
| shared-kernel types | Database ORMs |
| | LLM SDKs |
| | HTTP frameworks |
| | Persistence implementations |

---

## Governance principle

Multi-agent collaboration **proposes and coordinates** — it does **not** finalize business decisions. Decision finalization flows through `@lateen-os/decision-engine`.

See [MISSION_MODEL.md](./MISSION_MODEL.md) for sequence and collaboration diagrams.
