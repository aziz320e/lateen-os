# @lateen-os/decision-engine

Decision Engine — the canonical decision layer for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

**No AI agent is allowed to make business decisions directly.**

Every recommendation, approval, rejection, prioritization, escalation, and optimization request must pass through the Decision Engine.

The engine consumes:

- **Business DNA** — entity and policy context
- **Capability Engine** — what the organization can do
- **Domain Graph** — semantic relationships
- **Institutional Memory** — long-term organizational knowledge

This package defines decision contracts, evaluation models, policies, reasoning interfaces, and execution workflow — **not AI, not persistence**.

## Scope

| Included | Excluded |
| -------- | -------- |
| Decision aggregate & lifecycle | LLM / AI implementation |
| Context, evaluation, risk, priority models | UI / API / HTTP |
| Policies, rules, recommendations | Database / ORM |
| Approval flows & execution plans | Business logic |
| Reasoning & query ports | Persistence |

## Usage

```typescript
import {
  decision,
  reasoning,
  type Decision,
  type DecisionQueries,
  type DecisionContext,
} from '@lateen-os/decision-engine';

declare const decisionQueries: DecisionQueries;
await decisionQueries.findDecision(orgId, decisionId);
await decisionQueries.findPendingApprovals({ organizationId: orgId });
```

## Structure

```
src/
├── shared/
├── decision/          # Decision aggregate root
├── context/           # DecisionContext (upstream refs)
├── evaluation/        # EvaluationResult, criteria, scores
├── policy/            # DecisionPolicy, constraints
├── rule/              # Business, technical, compliance rules
├── reasoning/         # Reasoner, DecisionResolver, ConflictResolver, ContextResolver
├── recommendation/    # Recommendation, alternatives
├── approval/          # ApprovalFlow, steps, approvers
├── risk/              # RiskAssessment, factors, levels
├── priority/          # PriorityScore, levels, strategies
├── execution/         # ExecutionPlan, rollback
├── queries/
└── index.ts
```

See [DECISION_MODEL.md](./DECISION_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/capability-engine`
- `@lateen-os/domain-graph`
- `@lateen-os/institutional-memory`

## Build

```bash
pnpm --filter @lateen-os/decision-engine build
pnpm --filter @lateen-os/decision-engine typecheck
```
