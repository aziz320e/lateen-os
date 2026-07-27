# @lateen-os/ai-compliance-engine

AI Compliance Engine — compliance frameworks, controls, control mapping, evidence, assessments, gap analysis, remediation, audits, retention, and reporting for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The AI Compliance Engine is the canonical compliance layer for Lateen OS: it owns the Compliance Framework Registry, Compliance Controls, Control Mapping, Evidence Management, the Assessment Engine, Gap Analysis, the Remediation Engine, the Audit Engine, the Retention Engine, and Compliance Reports — and is the package that integrates AI Security Engine, AI Governance Engine, Business DNA, Workflow Engine, and Communication Hub on behalf of the compliance domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (the Assessment Engine and Gap Analysis are fixed, explainable rules — status × implementation status × expiry × evidence presence — not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createComplianceRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Compliance Framework Registry | `framework` | create / update / activate / deactivate / archive / restore, plus full version history, across all 8 supported frameworks |
| Compliance Controls | `control` | create / update / approve / retire across the 4 required control types |
| Control Mapping | `control-mapping` | Deterministic many-to-many mappings between a control and policies, governance rules, security controls, workflows, or business processes |
| Evidence Management | `evidence` | Evidence records, attachment metadata (no real file storage), sources, collection timestamps — immutable, append-only history |
| Assessment Engine | `assessment` | Deterministic compliant / partially_compliant / non_compliant / not_assessed classification; computes score, failed, passed, and pending controls |
| Gap Analysis | `gap-analysis` | Missing controls, expired controls, missing evidence, and orphaned policies (real AI Governance Engine integration); generates a deterministic remediation plan |
| Remediation Engine | `remediation` | Create, assign owner, due dates, and a guarded status lifecycle (open → in_progress → blocked → completed / cancelled) |
| Audit Engine | `audit-engine` | Audit plans, execution, findings (observations, recommendations, and corrective actions linking to the Remediation Engine) |
| Retention Engine | `retention` | Deterministic retention rules for audit evidence, compliance reports, assessment history, and policy history |
| Compliance Reports | `report` | Deterministic per-framework reports (score, findings, gaps, remediation progress), composed internally from Assessment + Gap Analysis + Remediation |
| Relationship Layer | `relationship-management` | Integrates AI Security Engine, Business DNA, Workflow Engine, and Communication Hub — see below |
| Query Layer | `queries` | Real, read-only `ComplianceQueries` port — `findFrameworks` / `findControls` / `findAssessments` / `findEvidence` / `findAudits` / `findReports` / `findRemediations` / `findComplianceStatus` / `searchCompliance` |
| Event Bus | `events` | Typed `ComplianceEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with AI Security Engine, AI Governance Engine, Business DNA, Workflow Engine, and Communication Hub

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 5 required packages has a real, genuine integration point:

- **AI Security Engine** — behavioral, via `relationship-management`. `getSecurityViolationsContext()` fetches real security violations via `queries.findViolations()`. Optional — injected as `Pick<SecurityRuntime, 'queries'>`.
- **AI Governance Engine** — behavioral, via `gap-analysis`. The "orphaned policies" check cross-references every real, active governance policy (via `GovernanceQueries.findPolicies()`) against this package's own Control Mapping records. Optional — injected as `Pick<GovernanceQueries, 'findPolicies'>`.
- **Business DNA** — structural (`shared/identifiers.ts` reuses `OrganizationId` / `EmployeeId`) and behavioral, via `relationship-management`'s `getBusinessProfileContext()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Workflow Engine** — behavioral, via `relationship-management`. `raiseComplianceWorkflowRequest()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine compliance-review workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — behavioral, via `relationship-management`. `notifyComplianceEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.

Every optional collaborator degrades to a documented no-op (`null` or an empty list) when not injected, so the AI Compliance Engine is fully usable — and fully tested — completely offline.

## Event bus

`ComplianceEventMap` declares the 11 required events, each genuinely published by the real service that causes it:

`framework.created`, `framework.updated`, `assessment.completed`, `control.failed`, `control.passed`, `evidence.collected`, `audit.started`, `audit.completed`, `remediation.created`, `remediation.completed`, `compliance.report.generated`.

## Usage

```typescript
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';

const runtime = createComplianceRuntime();

const framework = await runtime.frameworks.create('org-1', { frameworkCode: 'SOC2', name: 'SOC2 Type II' });
await runtime.frameworks.activate('org-1', framework.id);

const control = await runtime.controls.create('org-1', {
  controlType: 'technical',
  name: 'Encrypt data at rest',
  frameworkId: framework.id,
  implementationStatus: 'implemented',
});
await runtime.controls.approve('org-1', control.id);
await runtime.evidence.collectEvidence('org-1', { controlId: control.id, source: 'system', description: 'KMS audit log export' });

const assessment = await runtime.assessments.runAssessment('org-1', framework.id);
const gaps = await runtime.gapAnalysis.analyze('org-1', framework.id);
const report = await runtime.reports.generateReport('org-1', framework.id);
```

Wiring in the real AI Security Engine / AI Governance Engine / Business DNA / Workflow Engine / Communication Hub collaborators:

```typescript
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';

const governance = createGovernanceRuntime();

const runtime = createComplianceRuntime({
  aiSecurity: createSecurityRuntime(),
  aiGovernance: governance.queries,
  businessDna: createBusinessDnaRuntime(),
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('control.failed', (payload) => {
  console.log(`Control ${payload.controlId} failed: ${payload.reason}`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's/AI Security Engine's/AI Governance Engine's), primitives, id.ts helpers
├── framework/                  # Compliance Framework Registry — 8 frameworks, full lifecycle + version history
├── control/                       # Compliance Controls — 4 types, create/update/approve/retire
├── control-mapping/                  # Deterministic mappings to policies/rules/security controls/workflows/processes
├── evidence/                            # Immutable, append-only Evidence Management
├── assessment/                             # Assessment Engine — deterministic scoring and classification
├── gap-analysis/                              # Gap Analysis, composed with AI Governance Engine
├── remediation/                                  # Remediation Engine — guarded status lifecycle
├── audit-engine/                                    # Audit Engine — plans, execution, findings
├── retention/                                          # Retention Engine — deterministic retention rules
├── report/                                                # Compliance Reports, composed internally
├── relationship-management/                                  # AI Security Engine / Business DNA / Workflow Engine / Communication Hub integration
├── queries/                                                     # Real ComplianceQueries read layer
├── events/                                                         # Typed ComplianceEventMap
├── runtime.ts                                                        # createComplianceRuntime() composition root
└── index.ts
```

See [COMPLIANCE_MODEL.md](./COMPLIANCE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `EmployeeId`; optional Relationship Layer collaborator
- `@lateen-os/ai-security-engine` — `IdentityId`; optional Relationship Layer collaborator
- `@lateen-os/ai-governance-engine` — `GovernancePolicyId`; optional Gap Analysis collaborator
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/ai-compliance-engine build
pnpm --filter @lateen-os/ai-compliance-engine typecheck
pnpm --filter @lateen-os/ai-compliance-engine test
pnpm --filter @lateen-os/ai-compliance-engine lint
```
