# Multi-Agent — Mission Model

> Contracts-only model for multi-agent collaboration on business objectives.

---

## Mission lifecycle

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> planning
  planning --> active
  active --> negotiating
  negotiating --> awaiting_consensus
  awaiting_consensus --> awaiting_review
  awaiting_review --> completed
  active --> escalated
  escalated --> active
  active --> cancelled
  active --> failed
  completed --> [*]
  cancelled --> [*]
  failed --> [*]
```

---

## Collaboration sequence

```mermaid
sequenceDiagram
  participant CEO as CEO AI
  participant Coord as CollaborationOrchestrator
  participant PM as Product Manager AI
  participant Mkt as Marketing AI
  participant WF as Workflow Engine
  participant DE as Decision Engine

  CEO->>Coord: startMission(missionId)
  Coord->>PM: assignWorker(step: discover)
  Coord->>Mkt: assignWorker(step: validate_market)
  PM->>Coord: advanceStep(discover)
  Mkt->>Coord: advanceStep(validate_market)
  PM->>Mkt: DelegationRequest(scope: analysis)
  Mkt-->>PM: DelegationResponse(accepted)
  PM->>DE: DecisionProposal(submit)
  DE-->>PM: approved
  Coord->>WF: trigger workflow instance
  Coord->>CEO: completeMission(missionId)
```

---

## Team collaboration diagram

```mermaid
flowchart TB
  subgraph Mission["Mission: Launch Product X"]
    CEO["CEO AI\n(Mission Leader)"]
    PM["Product Manager AI"]
    MKT["Marketing AI"]
    SAL["Sales AI"]
    OPS["Operations AI"]
    FIN["Finance AI"]
    HR["HR AI"]
  end

  CEO --> PM
  CEO --> MKT
  CEO --> SAL
  PM --> OPS
  PM --> FIN
  MKT --> SAL
  HR --> PM

  subgraph SharedContext["Shared Business Context"]
    MEM["Institutional Memory refs"]
    DEC["Decision refs"]
  end

  PM --> SharedContext
  MKT --> SharedContext
  FIN --> SharedContext
```

---

## Negotiation → Consensus flow

```mermaid
sequenceDiagram
  participant W1 as Worker A
  participant W2 as Worker B
  participant Neg as Negotiation
  participant Con as Consensus
  participant DE as Decision Engine

  W1->>Neg: open(topic: pricing)
  W2->>Neg: NegotiationRound(proposal)
  W1->>Neg: NegotiationRound(counter)
  Neg->>Con: VotingStrategy(majority)
  Con->>Con: ConsensusResult(reached)
  Con->>DE: Agreement(effective)
  Note over Con,DE: consensus.reached event published
```

---

## Escalation levels

| Level | Resolver |
| ----- | -------- |
| `team_lead` | Mission leader (typically CEO AI) |
| `ceo_ai` | Organization-level CEO AI worker |
| `decision_engine` | Decision Engine policy evaluation |
| `human_operator` | Human-in-the-loop override |

---

## Worker roles

| Role | Typical responsibility |
| ---- | ---------------------- |
| `ceo_ai` | Mission leadership, final escalation |
| `product_manager_ai` | Product discovery, roadmap |
| `marketing_ai` | Market validation, positioning |
| `sales_ai` | Revenue projections, channel fit |
| `operations_ai` | Manufacturing, logistics |
| `finance_ai` | ROI, margin, budget |
| `hr_ai` | Workforce capacity, skills |

---

## Domain events

| Event | When |
| ----- | ---- |
| `mission.started` | Mission enters active execution |
| `mission.completed` | All objectives satisfied |
| `worker.assigned` | Worker assigned to coordination step |
| `delegation.created` | Inter-worker delegation initiated |
| `consensus.reached` | Team agreement finalized |
| `mission.escalated` | Unresolved conflict escalated |

---

## Query ports

| Method | Purpose |
| ------ | ------- |
| `findMission()` | Discover missions by status/code |
| `findTeams()` | List teams for a mission |
| `findOpenNegotiations()` | Active negotiation sessions |
| `findPendingReviews()` | Reviews awaiting action |
| `findConsensus()` | Consensus results by mission |
