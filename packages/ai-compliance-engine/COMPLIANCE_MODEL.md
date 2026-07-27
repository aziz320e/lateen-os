# Compliance Model

> Real, implemented model for the AI Compliance Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Compliance Framework Registry

`framework/engine.impl.ts`'s `createComplianceFrameworkEngine()` implements the full lifecycle across all 8 supported frameworks (`GDPR`, `ISO27001`, `SOC2`, `HIPAA`, `PCI_DSS`, `NIST_CSF`, `ISO42001`, `EU_AI_ACT`):

- **`create()`** — starts a framework at `status: 'draft'`, `currentVersion: 1`, defaulting `requiredControlTypes` to all four control types unless overridden. Snapshots version 1 immediately. Publishes `framework.created`.
- **`update()`** — bumps `currentVersion` and snapshots a new version. Rejected on an archived framework (`InvalidFrameworkTransitionError`) — you must `restore()` first. Publishes `framework.updated`.
- **`activate()`** / **`deactivate()`** — `draft`/`inactive` → `active` and `active` → `inactive`, each snapshotting a version.
- **`archive()`** — any non-archived status → `archived`, stamping `statusBeforeArchive`.
- **`restore()`** — the same deliberate asymmetry proven in AI Governance Engine's Governance Policy engine: `archived`'s row in `FRAMEWORK_TRANSITIONS` has **no outgoing edges**, so `activate()`/`deactivate()` can never resurrect an archived framework. `restore()` is a distinct operation that returns the framework directly to its `statusBeforeArchive` (defaulting to `draft`).
- **`getVersionHistory()`** — every version snapshot, ascending by version number.

---

## Compliance Controls

`control/service.impl.ts`'s `createComplianceControlService()` implements create/update/approve/retire across the 4 required control types (`administrative`, `technical`, `operational`, `physical`):

- **`create()`** — starts a control at `status: 'draft'`, `implementationStatus: 'not_implemented'` by default, optionally scoped to a framework via `frameworkId` and given an `expiresAt`.
- **`update()`** — mutates name/description/implementation status/expiry. Rejected on a retired control.
- **`approve()`** — `draft` → `approved`.
- **`retire()`** — terminal from either `draft` or `approved`; `CONTROL_TRANSITIONS.retired` is `[]`.

---

## Control Mapping

`control-mapping/service.impl.ts`'s `createControlMappingService()` implements deterministic many-to-many mappings between one control and the 5 required artifact kinds (`policy`, `governance_rule`, `security_control`, `workflow`, `business_process`):

- **`mapControl()`** / **`unmapControl()`** — plain create/delete over `ControlMapping` records; a control may hold any number of mappings across any number of mapped types simultaneously.
- **`findMappingsForControl()`** / **`findControlIdsForMappedRecord()`** — the two directions of lookup this package's own Gap Analysis (orphaned policies) and Query Layer rely on.

---

## Evidence Management

`evidence/service.impl.ts`'s `createEvidenceService()` implements evidence records, attachment metadata (no real file storage — every attachment is `{ fileName, mimeType?, sizeBytes?, url? }`, a pointer, never content), sources (`manual`, `system`, `integration`, `audit`), and collection timestamps over an **immutable, append-only** history:

- **`collectEvidence()`** — the only write operation; there is deliberately no `update()` or `delete()` on the service's public surface. Publishes `evidence.collected`.
- **`getHistory()`** — every evidence record ever collected for the organization, sorted oldest-first — mirrors AI Governance Engine's Decision Tracking "one shared, immutable stream" principle.

---

## Assessment Engine

`assessment/engine.impl.ts`'s `createAssessmentEngine()` implements deterministic per-control classification and per-framework scoring — no AI model, every decision is a fixed, explainable rule:

- **`evaluateControlOutcome()`** (pure) — a control not `approved` is `pending`; an `approved` control past its `expiresAt` is `failed`; an `approved`, `not_implemented` control is `failed`; an `approved`, `implemented` control **with evidence on file** is `passed`; everything else (`partially_implemented`, or `implemented` without evidence) is `pending`. Retired controls are excluded from scope entirely by the caller (`runAssessment()`).
- **`computeComplianceStatus()`** (pure) — `not_assessed` if no controls are in scope; `non_compliant` if any control failed; `compliant` if every control passed with none pending; `partially_compliant` otherwise.
- **`computeComplianceScore()`** (pure) — passed controls as a percentage of every control in scope, rounded to two decimals.
- **`runAssessment()`** — classifies every in-scope control, publishing `control.passed` / `control.failed` (with a specific `reason`: `expired` or `not_implemented`) per control as it goes, then persists one `ComplianceAssessment` snapshot and publishes `assessment.completed`.

---

## Gap Analysis

`gap-analysis/engine.impl.ts`'s `createGapAnalysisEngine()` implements the 4 required gap checks and a deterministic remediation plan:

- **Missing controls** — a framework's `requiredControlTypes` with no approved, implemented control of that type in scope.
- **Expired controls** — in-scope controls whose `expiresAt` has passed the assessing clock.
- **Missing evidence** — approved, implemented controls with zero evidence records on file.
- **Orphaned policies** — the one real, optional **AI Governance Engine** integration point in this package: every real, active governance policy (`GovernanceQueries.findPolicies({ status: 'active' })`) is cross-referenced against this package's own Control Mapping records; a policy with no mapping is orphaned. Returns an empty list — not an error — when AI Governance Engine is not injected.
- **`remediationPlan`** — one `RemediationPlanItem` per detected gap, each carrying a deterministic `suggestedAction` and a fixed `priority` (`expired_control` → `critical`, `missing_control` → `high`, `missing_evidence` → `medium`, `orphaned_policy` → `low`). This is a **plan**, not yet a tracked `Remediation` entity — a caller decides whether to turn a plan item into a real, tracked remediation via the Remediation Engine.

---

## Remediation Engine

`remediation/service.impl.ts`'s `createRemediationEngine()` implements create, owner assignment, due dates, and the 5-status guarded lifecycle (`open`, `in_progress`, `blocked`, `completed`, `cancelled`):

- **`createRemediation()`** — starts at `open`, defaulting `gapType` to `'manual'` unless raised from a Gap Analysis plan item (`missing_control` / `expired_control` / `missing_evidence` / `orphaned_policy` / `audit_finding`). Publishes `remediation.created`.
- **`updateStatus()`** — guarded by `REMEDIATION_TRANSITIONS`: `open → {in_progress, cancelled}`, `in_progress → {blocked, completed, cancelled}`, `blocked → {in_progress, cancelled}`; `completed` and `cancelled` are terminal.
- **`complete()`** — a convenience over `updateStatus('completed')` that also stamps `completedAt` and publishes `remediation.completed`.
- **`frameworkId`** — every remediation may carry the framework it was raised for, which is what lets Compliance Reports compute real, scoped remediation progress (see below).

---

## Audit Engine

`audit-engine/engine.impl.ts`'s `createAuditEngine()` implements audit plans, execution, and findings:

- **`createAuditPlan()`** — starts at `planned` with an empty findings list.
- **`startAudit()`** — `planned` → `in_progress`, stamps `startedAt`, publishes `audit.started`.
- **`recordFinding()`** — appends an `AuditFinding` (severity `observation` / `minor` / `major` / `critical`, a description, an optional recommendation, and an optional `correctiveActionId` pointing at a `Remediation` tracked by this package's own Remediation Engine). Only permitted while `in_progress`.
- **`completeAudit()`** — `in_progress` → `completed`, stamps `completedAt`, publishes `audit.completed` with the real `findingCount`.
- **`cancelAudit()`** — permitted from either `planned` or `in_progress`.

---

## Retention Engine

`retention/engine.impl.ts`'s `createRetentionEngine()` implements deterministic retention rules for the 4 required data categories (`audit_evidence`, `compliance_report`, `assessment_history`, `policy_history`), one rule per category (an upsert, mirroring AI Governance Engine's AI Governance ledger pattern):

- **`isRetentionExpired()`** (pure) — `asOf - createdAt > retentionDays` in milliseconds; exactly at the boundary is **not** expired.
- **`isExpired()`** — the real, stateful check against whatever rule (if any) is configured; returns `false` — not an error — when no rule is configured for the category.

---

## Compliance Reports

`report/engine.impl.ts`'s `createReportEngine()` generates a deterministic report for any framework by composing this package's own engines — intra-package composition, not a new implementation:

- **`generateReport()`** — runs a **fresh** Assessment Engine pass and a **fresh** Gap Analysis pass (both, deliberately, not cached — a report always reflects current state), builds a human-readable `findings` list from both, and computes `remediationProgress` (`total` / `completed` / `percentComplete`) from every real `Remediation` scoped to the framework via `frameworkId`. Persists one `ComplianceReport` and publishes `compliance.report.generated`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates the remaining 4 required packages, each exclusively through its public API (AI Governance Engine is integrated separately, by Gap Analysis — see above):

- **`getSecurityViolationsContext()`** — real AI Security Engine `queries.findViolations()`.
- **`raiseComplianceWorkflowRequest()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyComplianceEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.

Every method degrades to a documented `null` when its collaborator was not injected, so the AI Compliance Engine remains fully usable — and fully tested — completely offline.
