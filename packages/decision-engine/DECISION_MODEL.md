# Decision Model

> Canonical decision model for Lateen OS v1.0

## Core principle

**AI agents recommend. The Decision Engine decides.**

AI Workforce agents (Architecture v1.0) operate in Reactive and Proactive modes but may only **submit recommendations**. Final approval, rejection, prioritization, escalation, and execution authorization flow through this engine.

## Decision aggregate

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `DecisionId` | Stable identifier |
| `organizationId` | `OrganizationId` | Tenant |
| `title` | `string` | Short title |
| `description` | `string` | Full description |
| `category` | `DecisionCategory` | approval, rejection, prioritization, escalation, optimization, … |
| `status` | `DecisionStatus` | Lifecycle state |
| `requestedBy` | `DecisionRequester` | Employee, AI agent, or system (request only) |
| `requestedAt` | `Timestamp` | When submitted |
| `decidedAt` | `Timestamp?` | When finalized |
| `confidence` | `ConfidenceScore` | Evaluation confidence |
| `risk` | `RiskLevel` | Assessed risk |
| `priority` | `PriorityLevel` | Processing priority |

## Decision lifecycle

```
draft → submitted → evaluating → pending_approval
                                      ↓
                    approved / rejected / escalated
                                      ↓
                              executing → completed
                    (or cancelled / archived at any stage)
```

## DecisionContext

Assembled references from upstream packages:

| Section | Source package |
| ------- | -------------- |
| `businessDnaRefs` | Business DNA (+ Domain Graph node types) |
| `capabilityRefs` | Capability Engine |
| `domainGraphRef` | Domain Graph snapshots / focus nodes |
| `institutionalMemoryRef` | Institutional Memory |
| `currentMetrics` | Business DNA KPIs |
| `currentPolicies` | Business DNA Policy + DecisionPolicy |

## Evaluation

| Type | Purpose |
| ---- | ------- |
| `EvaluationCriteria` | Weighted criteria for scoring |
| `EvaluationScore` | Per-criterion score |
| `EvaluationResult` | Overall pass/fail with confidence |

## Policy & rules

| Type | Purpose |
| ---- | ------- |
| `DecisionPolicy` | Scoped policy with constraints |
| `PolicyScope` | Where policy applies |
| `PolicyConstraint` | Mandatory/optional constraint |
| `DecisionRule` | Base rule |
| `BusinessRule` | Commercial/operational |
| `TechnicalRule` | System/capability |
| `ComplianceRule` | Regulatory |

## Recommendation

| Type | Purpose |
| ---- | ------- |
| `Recommendation` | Proposed action (from AI or human) |
| `Alternative` | Other options considered |
| `RecommendationScore` | Ranked score + confidence |

## Approval

| Type | Purpose |
| ---- | ------- |
| `ApprovalFlow` | Multi-step approval for a decision |
| `ApprovalStep` | Single approval gate |
| `Approver` | Employee or role holder |

## Risk & priority

| Type | Purpose |
| ---- | ------- |
| `RiskAssessment` | Overall risk with factors |
| `RiskFactor` | Individual risk contributor |
| `RiskLevel` | critical → negligible |
| `PriorityScore` | Computed priority |
| `PriorityLevel` | urgent → deferred |
| `PriorityStrategy` | fifo, impact_first, risk_first, … |

## Execution

| Type | Purpose |
| ---- | ------- |
| `DecisionExecutionPlan` | Steps to execute approved decision |
| `ExecutionStep` | Single execution step |
| `RollbackPlan` | Recovery if execution fails |

## Reasoning ports

| Port | Responsibility |
| ---- | -------------- |
| `Reasoner` | Apply reasoning strategy to decision + context |
| `DecisionResolver` | Resolve final outcome from evaluation + approval |
| `ConflictResolver` | Detect and resolve conflicting recommendations/rules |
| `ContextResolver` | Assemble DecisionContext from upstream packages |

## Query port

`DecisionQueries`:

- `findDecision`
- `findRecommendations`
- `findPendingApprovals`
- `findRisks`
- `findPolicyViolations`
- `findAlternativeDecisions`

## Domain events

Every aggregate emits typed `{aggregate}.{action}` events on lifecycle transitions. Events are types only — dispatch lives in Core (Layer 2).
