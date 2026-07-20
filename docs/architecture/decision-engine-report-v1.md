# Decision Engine — Architecture Report (Sprint 6)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Sprint 6 introduces `@lateen-os/decision-engine`, the canonical decision layer for Lateen OS. The package enforces that no AI agent makes business decisions directly — it defines decision aggregates, context assembly, evaluation, policies, rules, recommendations, approval flows, risk/priority models, execution plans, reasoning ports, and query ports. No AI, persistence, or business logic is included.

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/decision-engine` package | Done |
| Decision aggregate | Done |
| DecisionContext (4 upstream sources) | Done |
| Evaluation module | Done |
| Policy & rule modules | Done |
| Recommendation module | Done |
| Approval module | Done |
| Risk & priority modules | Done |
| Execution module | Done |
| Reasoning ports (4) | Done |
| DecisionQueries (6 methods) | Done |
| Domain events (all aggregates) | Done |
| Repository ports (all aggregates) | Done |
| README, ARCHITECTURE, DECISION_MODEL | Done |
| Flow + lifecycle + dependency diagrams | Done |
| Typecheck | Passed |

## Core architectural rule

Per Architecture v1.0 Proactive AI and authorization principles:

- AI agents **recommend** — they do not finalize business decisions
- The Decision Engine **evaluates, approves, and authorizes execution**
- All decision contracts are typed in this package

## Aggregates & modules (10)

| Module | Primary types |
| ------ | ------------- |
| `decision` | Decision |
| `context` | DecisionContext |
| `evaluation` | EvaluationResult, EvaluationCriteria, EvaluationScore |
| `policy` | DecisionPolicy, PolicyScope, PolicyConstraint |
| `rule` | DecisionRule, BusinessRule, TechnicalRule, ComplianceRule |
| `recommendation` | Recommendation, Alternative, RecommendationScore |
| `approval` | ApprovalFlow, ApprovalStep, Approver |
| `risk` | RiskAssessment, RiskFactor, RiskLevel |
| `priority` | PriorityScore, PriorityLevel, PriorityStrategy |
| `execution` | DecisionExecutionPlan, ExecutionStep, RollbackPlan |

## Reasoning ports

- `Reasoner` — reasoning over decision + context + recommendations
- `DecisionResolver` — final outcome from evaluation + approval
- `ConflictResolver` — conflicting recommendations/rules
- `ContextResolver` — assemble context from upstream packages

## Query port

`DecisionQueries`: findDecision, findRecommendations, findPendingApprovals, findRisks, findPolicyViolations, findAlternativeDecisions

## Dependencies

| Package | Role |
| ------- | ---- |
| `@lateen-os/shared-kernel` | Entity, Timestamp, Identifier |
| `@lateen-os/business-dna` | OrganizationId, EmployeeId, AgentId, PolicyId, KpiId |
| `@lateen-os/capability-engine` | CapabilityId |
| `@lateen-os/domain-graph` | GraphNodeType, GraphNodeId, GraphSnapshotId |
| `@lateen-os/institutional-memory` | ConfidenceScore, memory IDs |

No upstream packages modified. Dependency graph is acyclic.

## Constraints honored

- Pure TypeScript DDD
- No UI, API, ORM, database, persistence
- No LLM / AI implementation
- No business logic — types and ports only

## Verification

```
pnpm typecheck — all packages pass (including decision-engine)
```

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [Decision Engine ARCHITECTURE.md](../packages/decision-engine/ARCHITECTURE.md)
- [DECISION_MODEL.md](../packages/decision-engine/DECISION_MODEL.md)
- [Institutional Memory](../packages/institutional-memory/ARCHITECTURE.md)
- [Domain Graph](../packages/domain-graph/ARCHITECTURE.md)
