# @lateen-os/ai-governance-engine

AI Governance Engine — governance policies, AI/model/agent/workflow governance, the human approval engine, risk governance, decision tracking, and the governance rules engine for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The AI Governance Engine is the canonical governance layer for Lateen OS's AI surface: it owns Governance Policies, AI Governance (providers, models, agents, workers, brain, runtime), Model Governance, Agent Governance, Workflow Governance, the Human Approval Engine, Risk Governance, Decision Tracking, and the Governance Rules Engine — and is the package that integrates AI Security Engine, AI Runtime, AI Brain, Workflow Engine, Business DNA, and Communication Hub on behalf of the governance domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (the Governance Rules Engine is fixed, attribute-based conditions, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createGovernanceRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Governance Policies | `policy` | create / update / activate / deactivate / archive / restore, plus full version history, across all 7 policy types |
| AI Governance | `ai-governance` | A single, uniform governance ledger over AI Providers, Models, Agents, Workers, Brain, and Runtime — approve / block / restrict |
| Model Governance | `model-governance` | Approved / blocked / deprecated model lifecycle plus version tracking |
| Agent Governance | `agent-governance` | Registration approval, suspension, retirement, capability restrictions, and runtime permissions, composed with the real AI Runtime agent registry |
| Workflow Governance | `workflow-governance` | Workflow approval, version policy (allow/deny lists), and execution policy, composed with the real Workflow Engine queries |
| Human Approval Engine | `approval` | Deterministic approval workflows for policy changes, security exceptions, workflow publication, model approval, and provider approval — approving a security exception grants a durable `GovernanceException` |
| Risk Governance | `risk` | Risk register, risk levels, mitigation plans, acceptance, and escalation |
| Decision Tracking | `decision` | Immutable, append-only audit history of every approval/rejection — reviewer, timestamp, and rationale |
| Governance Rules Engine | `rules-engine` | Deterministic rule evaluation (deny wins, then flag, then allow) against runtime actions, workflow executions, AI provider usage, communication requests, and business operations |
| Relationship Layer | `relationship-management` | Integrates AI Security Engine, AI Runtime, AI Brain, Workflow Engine, Business DNA, and Communication Hub — see below |
| Query Layer | `queries` | Real, read-only `GovernanceQueries` port — `findPolicies` / `findPolicyVersions` / `findApprovals` / `findRisks` / `findExceptions` / `findGovernanceEvents` / `searchGovernance` |
| Event Bus | `events` | Typed `GovernanceEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with AI Security Engine, AI Runtime, AI Brain, Workflow Engine, Business DNA, and Communication Hub

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 6 required packages has a real, genuine integration point:

- **AI Security Engine** — behavioral, via `relationship-management`. `getSecurityViolationsContext()` fetches real security violations via `queries.findViolations()`. Optional — injected as `Pick<SecurityRuntime, 'queries'>`.
- **AI Runtime** — behavioral, in two places. `agent-governance`'s `isAgentRegisteredInRuntime()` checks a real, injected agent registry's `getRegistry()`. `relationship-management`'s `getRuntimeAgentContext()` / `getRuntimeStateContext()` call the real `RuntimeQueries.findAgent()` / `findRuntimeState()`. Optional in both places.
- **AI Brain** — behavioral, via `relationship-management`. `getBrainPlanContext()` fetches a real plan explanation via `queries.explainPlan()`. Optional — injected as `{ queries: Pick<BrainQueries, 'explainPlan'> }`.
- **Workflow Engine** — behavioral, in two places. `workflow-governance`'s `checkExecutionPolicy()` counts real running instances via `WorkflowQueries.findRunningWorkflows()`. `relationship-management`'s `raiseGovernanceWorkflowRequest()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine governance-review workflow instance. Optional in both places.
- **Business DNA** — structural (`shared/identifiers.ts` reuses `OrganizationId` / `EmployeeId`) and behavioral, via `relationship-management`'s `getBusinessProfileContext()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Communication Hub** — behavioral, via `relationship-management`. `notifyGovernanceEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.

Every optional collaborator degrades to a documented no-op (`null` or `false`) when not injected, so the AI Governance Engine is fully usable — and fully tested — completely offline.

## Event bus

`GovernanceEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`policy.created`, `policy.updated`, `policy.activated`, `policy.deactivated`, `approval.requested`, `approval.completed`, `risk.created`, `risk.escalated`, `governance.violation.detected`, `governance.audit.created`.

## Usage

```typescript
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';

const runtime = createGovernanceRuntime();

const policy = await runtime.policies.create('org-1', { name: 'Prompt Security Baseline', policyType: 'security' });
await runtime.policies.activate('org-1', policy.id);

const request = await runtime.approvals.requestApproval('org-1', { category: 'policy_change', subjectId: policy.id });
await runtime.approvals.approve('org-1', request.id, { reviewerId: 'reviewer-1', rationale: 'meets standards' });

const risk = await runtime.risks.createRisk('org-1', { title: 'Prompt injection exposure', category: 'security', riskLevel: 'high' });
await runtime.risks.escalate('org-1', risk.id);

await runtime.rules.createRule('org-1', {
  name: 'Deny high-risk tool calls',
  appliesTo: 'runtime_action',
  conditions: [{ attribute: 'toolId', operator: 'eq', value: 'delete_all' }],
  effect: 'deny',
});
const evaluation = await runtime.rules.evaluate('org-1', { appliesTo: 'runtime_action', attributes: { toolId: 'delete_all' } });
```

Wiring in the real AI Security Engine / AI Runtime / AI Brain / Workflow Engine / Business DNA / Communication Hub collaborators:

```typescript
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createAgentRegistryRepository, createAgentRegistryService } from '@lateen-os/ai-runtime';
import { createBrainSystem } from '@lateen-os/ai-brain';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';

const workflow = createWorkflowRuntime();
const { queries: brainQueries } = createBrainSystem();

const runtime = createGovernanceRuntime({
  aiSecurity: createSecurityRuntime(),
  agentRuntimeRegistry: createAgentRegistryService(createAgentRegistryRepository()),
  aiBrain: { queries: brainQueries },
  workflow,
  workflowQueries: workflow.queries,
  businessDna: createBusinessDnaRuntime(),
  communicationHub: createCommunicationRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('governance.violation.detected', (payload) => {
  console.log(`Rule ${payload.ruleId} blocked a ${payload.appliesTo} request: ${payload.reason}`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's/AI Runtime's/AI Security Engine's), primitives, id.ts helpers
├── policy/                    # Governance Policies — 7 types, full lifecycle + version history
├── ai-governance/               # Uniform AI Providers/Models/Agents/Workers/Brain/Runtime governance ledger
├── model-governance/              # Approved/blocked/deprecated model lifecycle + version tracking
├── agent-governance/                # Registration/suspension/retirement, composed with AI Runtime
├── workflow-governance/               # Approval, version policy, execution policy, composed with Workflow Engine
├── approval/                            # Human Approval Engine + granted GovernanceException records
├── risk/                                  # Risk register — levels, mitigation, acceptance, escalation
├── decision/                                # Immutable Decision Tracking audit history
├── rules-engine/                              # Governance Rules Engine — deny/flag/allow evaluation
├── relationship-management/                     # AI Security Engine / AI Runtime / AI Brain / Workflow Engine / Business DNA / Communication Hub integration
├── queries/                                       # Real GovernanceQueries read layer
├── events/                                          # Typed GovernanceEventMap
├── runtime.ts                                        # createGovernanceRuntime() composition root
└── index.ts
```

See [GOVERNANCE_MODEL.md](./GOVERNANCE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `EmployeeId`; optional Relationship Layer collaborator
- `@lateen-os/ai-security-engine` — `IdentityId`; optional Relationship Layer collaborator
- `@lateen-os/ai-runtime` — `RuntimeAgentId`; optional Agent Governance and Relationship Layer collaborator
- `@lateen-os/ai-brain` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Workflow Governance and Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/ai-governance-engine build
pnpm --filter @lateen-os/ai-governance-engine typecheck
pnpm --filter @lateen-os/ai-governance-engine test
pnpm --filter @lateen-os/ai-governance-engine lint
```
