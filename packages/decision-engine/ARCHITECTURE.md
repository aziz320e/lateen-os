# Decision Engine — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)**

## Purpose

`@lateen-os/decision-engine` is the **canonical decision layer** for Lateen OS. It ensures that no AI agent makes business decisions directly — all recommendations, approvals, rejections, prioritizations, escalations, and optimization requests pass through typed contracts defined here.

The package consumes context from Business DNA, Capability Engine, Domain Graph, and Institutional Memory. It defines models and ports only — no AI, persistence, or business logic.

---

## Architectural rule

```
AI Agent ──proposes──▶ Recommendation
                            │
                            ▼
                    Decision Engine
                     (evaluate → approve → execute)
                            │
                            ▼
                    Authorized outcome
```

---

## Module map

| Module | Types | Events | Repository |
| ------ | ----- | ------ | ---------- |
| `decision` | Decision | ✓ | DecisionRepository |
| `context` | DecisionContext | ✓ | DecisionContextRepository |
| `evaluation` | EvaluationResult, Criteria, Score | ✓ | EvaluationResultRepository |
| `policy` | DecisionPolicy, Scope, Constraint | ✓ | DecisionPolicyRepository |
| `rule` | DecisionRule, Business/Technical/Compliance | ✓ | DecisionRuleRepository |
| `recommendation` | Recommendation, Alternative, Score | ✓ | RecommendationRepository |
| `approval` | ApprovalFlow, Step, Approver | ✓ | ApprovalFlowRepository |
| `risk` | RiskAssessment, Factor, Level | ✓ | RiskAssessmentRepository |
| `priority` | PriorityScore, Level, Strategy | ✓ | PriorityScoreRepository |
| `execution` | ExecutionPlan, Step, Rollback | ✓ | DecisionExecutionPlanRepository |
| `reasoning` | 4 ports | — | — |
| `queries` | DecisionQueries | — | — |

---

## Dependency rules

```
┌──────────────────────────────────────────────┐
│  AI Workforce (recommendations only)         │
│  Applications, Intelligence                  │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│         @lateen-os/decision-engine           │
└──┬────────┬────────┬────────┬────────┬───────┘
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
  SK       BD       CE       DG       IM
```

SK = shared-kernel, BD = business-dna, CE = capability-engine, DG = domain-graph, IM = institutional-memory

### Forbidden

- LLM / AI frameworks in this package
- Persistence, ORM, UI, HTTP
- Upstream packages importing decision-engine
- AI agents bypassing the engine for final decisions

---

## Dependency diagram

```mermaid
flowchart BT
  subgraph consumers [Consumers]
    AI[AI Workforce]
    APP[Applications]
    INT[Intelligence]
  end

  subgraph de ["@lateen-os/decision-engine"]
    IDX[index.ts]
    DEC[decision]
    CTX[context]
    EVL[evaluation]
    POL[policy]
    RUL[rule]
    REC[recommendation]
    APR[approval]
    RSK[risk]
    PRI[priority]
    EXE[execution]
    REA[reasoning]
    Q[queries]
  end

  subgraph upstream [Upstream Packages]
    SK[shared-kernel]
    BD[business-dna]
    CE[capability-engine]
    DG[domain-graph]
    IM[institutional-memory]
  end

  AI --> IDX
  APP --> IDX
  INT --> IDX

  IDX --> DEC & CTX & EVL & POL & RUL & REC & APR & RSK & PRI & EXE & REA & Q
  CTX --> BD & CE & DG & IM
  DEC --> CTX & EVL & REC & APR & RSK & PRI & EXE
  REA --> DEC & CTX & EVL & REC & RUL

  BD --> SK
  CE --> BD
  DG --> BD & CE
  IM --> BD & DG
```

---

## Decision flow diagram

```mermaid
flowchart TD
  START([Request submitted]) --> CTX[Assemble DecisionContext]
  CTX --> REC[Receive Recommendations]
  REC --> EVL[Evaluate against criteria]
  EVL --> POL{Policy & rules check}
  POL -->|violations| REJ[Reject / escalate]
  POL -->|pass| RSK[Assess risk & priority]
  RSK --> APR{Approval required?}
  APR -->|yes| FLOW[ApprovalFlow]
  APR -->|no| RES[DecisionResolver]
  FLOW -->|approved| RES
  FLOW -->|rejected| REJ
  RES --> EXEC[DecisionExecutionPlan]
  EXEC --> DONE([Completed])
  REJ --> END([Closed])
```

---

## Decision lifecycle diagram

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> submitted
  submitted --> evaluating
  evaluating --> pending_approval
  evaluating --> rejected
  pending_approval --> approved
  pending_approval --> rejected
  pending_approval --> escalated
  approved --> executing
  executing --> completed
  rejected --> archived
  escalated --> evaluating
  completed --> archived
  draft --> cancelled
  submitted --> cancelled
  cancelled --> archived
  archived --> [*]
```

---

## Public API

```typescript
import {
  decision,
  reasoning,
  type Decision,
  type DecisionQueries,
  type ContextResolver,
} from '@lateen-os/decision-engine';
```

---

## Version alignment

| Artifact | Count |
| -------- | ----- |
| Aggregates / core types | 10 |
| Reasoning ports | 4 |
| Query methods | 6 |
| Upstream dependencies | 5 |
