# Governance Model

> Real, implemented model for the AI Governance Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Governance Policies

`policy/engine.impl.ts`'s `createGovernancePolicyEngine()` implements the full lifecycle across all 7 policy types (`security`, `workflow`, `ai`, `communication`, `business`, `approval`, `runtime`):

- **`create()`** — starts a policy at `status: 'draft'`, `currentVersion: 1`, and snapshots version 1 immediately. Publishes `policy.created`.
- **`update()`** — bumps `currentVersion` and snapshots a new version. Rejected on an archived policy (`InvalidPolicyTransitionError`) — you must `restore()` first. Publishes `policy.updated`.
- **`activate()`** / **`deactivate()`** — `draft`/`inactive` → `active` and `active` → `inactive`, each snapshotting a version. Publish `policy.activated` / `policy.deactivated` respectively.
- **`archive()`** — `draft`/`active`/`inactive` → `archived`, stamping `statusBeforeArchive` with whatever status the policy held. No dedicated event (not in the fixed 10-event list).
- **`restore()`** — the deliberate asymmetry: `archived`'s row in `POLICY_TRANSITIONS` has **no outgoing edges** — `canTransitionPolicy('archived', anything)` is always `false`. `restore()` is a distinct operation, not a transition-table lookup: it requires the current status to be `archived`, then returns the policy directly to its `statusBeforeArchive` (defaulting to `draft` if archived directly from creation). This means `activate()`/`deactivate()` can never be used to sneak an archived policy back to life — only `restore()` can, and only to the correct prior status.
- **`getVersionHistory()`** — every version snapshot, ascending by version number — a complete, queryable history of every create/update/activate/deactivate/archive/restore.

---

## AI Governance

`ai-governance/service.impl.ts`'s `createAiGovernanceService()` is a single, uniform governance ledger over the 6 required AI target kinds (`provider`, `model`, `agent`, `worker`, `brain`, `runtime`):

- **`approve()`** / **`block()`** / **`restrict()`** — each upserts **one** record per `(targetType, targetId)`; re-deciding the same target updates the existing record's `status` rather than accumulating a new one, keeping "the current governance decision for X" a single, unambiguous lookup.
- **`getStatus()`** — returns `null` for an ungoverned target (no decision has ever been recorded), distinguishing "explicitly approved" from "never evaluated."

The richer, lifecycle-aware registers for models and agents — with proper state machines, not just a status field — live in their own modules below.

---

## Model Governance

`model-governance/service.impl.ts`'s `createModelGovernanceService()` implements approved/blocked/deprecated lifecycle plus version tracking, one record per model id:

- **`approveModel()`** — creates a new record on first use, or transitions an existing `blocked` record back to `approved`. Rejects transitioning a `deprecated` model directly to `approved` (`InvalidModelTransitionError`) — deprecation is a considered decision, not reversible by a bare re-approval.
- **`blockModel()`** — `approved` → `blocked`.
- **`deprecateModel()`** — `approved` → `deprecated`, optionally recording a `supersededByModelId` pointing at the model's real replacement.
- **`trackVersion()`** — updates `modelVersion` independently of status, so a model's governance decision and its currently-tracked version evolve separately.

`MODEL_TRANSITIONS`: `approved → {blocked, deprecated}`, `blocked → {approved}`, `deprecated → {blocked}` (deprecated cannot go straight back to approved).

---

## Agent Governance

`agent-governance/service.impl.ts`'s `createAgentGovernanceService()` implements registration approval, suspension, retirement, capability restrictions, and runtime permissions:

- **`requestRegistration()`** — creates a `pending` record with empty `capabilityRestrictions`/`runtimePermissions`.
- **`approveRegistration()`** — `pending` → `approved`.
- **`suspend()`** — `approved` → `suspended` (reversible via `approveRegistration()` again).
- **`retire()`** — terminal from any non-retired status; `AGENT_TRANSITIONS.retired` is `[]`.
- **`restrictCapabilities()`** / **`setRuntimePermissions()`** — independently replace the respective list on the record, with no interaction between the two.
- **`isAgentRegisteredInRuntime()`** — a real, optional cross-check against an injected AI Runtime agent registry's `getRegistry()`. Returns `false` — not an error — when AI Runtime is not injected, or when the agent is present but `active: false`.

---

## Workflow Governance

`workflow-governance/service.impl.ts`'s `createWorkflowGovernanceService()` implements approval, version policy, and execution policy for workflow definitions (keyed by `workflowCode`):

- **`requestApproval()`** / **`approveWorkflow()`** / **`rejectWorkflow()`** — a simple `pending` → `approved`/`rejected` decision per workflow code.
- **`setVersionPolicy()`** / **`isVersionAllowed()`** — the same deny-wins rule as AI Security Engine's Provider Security: an empty `allowedVersions` list means every version not explicitly denied is allowed; a non-empty list restricts to only listed versions; `deniedVersions` always wins regardless of the allow list.
- **`setExecutionPolicy()`** / **`checkExecutionPolicy()`** — `maxConcurrentInstances`, checked against the **real**, injected Workflow Engine `WorkflowQueries.findRunningWorkflows()` count. Without an `maxConcurrentInstances` set, execution is unconditionally allowed. With a limit set but no Workflow Engine injected, the check still allows (offline-safe) but reports `reason: 'workflow_engine_not_injected'` so callers can distinguish a genuine pass from an unenforceable one.

---

## Human Approval Engine

`approval/service.impl.ts`'s `createApprovalEngine()` implements deterministic approval workflows for the 5 required categories (`policy_change`, `security_exception`, `workflow_publication`, `model_approval`, `provider_approval`):

- **`requestApproval()`** — creates a `pending` request. Publishes `approval.requested`.
- **`approve()`** / **`reject()`** — both terminal from `pending` only (`InvalidApprovalTransitionError` on a second decision); both publish the single `approval.completed` event with `outcome: 'approved' | 'rejected'` — there is no separate `approval.rejected` event, since the fixed 10-event list names only `approval.completed` and it is genuinely accurate for either outcome.
- **Granting a `GovernanceException`** — approving a `security_exception`-category request additionally creates a durable `GovernanceException` record (`grantedBy`, `rationale`, optional `expiresAt`) — the artifact a caller checks later to confirm a waiver is still in force. No other category grants an exception.
- **Recording the decision** — every `approve()`/`reject()` call also records the outcome through the injected Decision Tracking service (`recordDecision()`), so the Human Approval Engine never keeps its own separate decision log.

---

## Risk Governance

`risk/service.impl.ts`'s `createRiskRegister()` implements a risk register with 4 risk levels (`low`, `medium`, `high`, `critical`) and a 5-status lifecycle:

- **`createRisk()`** — starts at `open`. Publishes `risk.created`.
- **`addMitigationPlan()`** — `open`/`mitigating` → `mitigating`, recording the plan text.
- **`accept()`** — → `accepted`, stamping `acceptedBy` and `acceptedAt`.
- **`escalate()`** — → `escalated`. Publishes `risk.escalated`.
- **`close()`** — → `closed`, terminal (`RISK_TRANSITIONS.closed` is `[]`).

`RISK_TRANSITIONS` allows `escalated → mitigating` (an escalated risk can return to active mitigation) but never allows leaving `closed`.

---

## Decision Tracking

`decision/service.impl.ts`'s `createDecisionTrackingService()` is an append-only, immutable audit history:

- **`recordDecision()`** — the only write operation; there is deliberately no `update()` or `delete()` on the service's public surface. Publishes `governance.audit.created`.
- **`findBySubject()`** / **`findByReviewer()`** — filtered views over the one immutable stream.
- **`getHistory()`** — every decision ever recorded for the organization, sorted oldest-first.

This mirrors AI Security Engine's "one shared audit sink" principle: nothing in this package keeps a second, duplicate decision log.

---

## Governance Rules Engine

`rules-engine/engine.impl.ts`'s `createGovernanceRulesEngine()` evaluates deterministic rules against the 5 required contexts (`runtime_action`, `workflow_execution`, `provider_usage`, `communication_request`, `business_operation`):

- **Conditions** — a rule's `conditions` are attribute checks (`eq` / `neq` / `in`) combined with **AND** semantics via the pure `matchesConditions()`.
- **`evaluate()`'s deterministic order** — among active rules matching the target and whose conditions all match the given attributes, sorted by rule id: **(1)** the first matching `deny` rule wins outright and publishes `governance.violation.detected`; **(2)** absent a deny, the first matching `flag` rule allows but returns its name as `reason` (no violation event — a flag is a surfaced signal, not a block); **(3)** absent both, the first matching `allow` rule is reported explicitly; **(4)** absent any match, the default is allow.
- Archived rules (`archiveRule()`) are never matched by `evaluate()`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 6 required packages, each exclusively through its public API:

- **`getSecurityViolationsContext()`** — real AI Security Engine `queries.findViolations()`.
- **`getRuntimeAgentContext()`** / **`getRuntimeStateContext()`** — real AI Runtime `RuntimeQueries.findAgent()` / `findRuntimeState()`.
- **`getBrainPlanContext()`** — real AI Brain `queries.explainPlan()`, with the thrown `PlanNotFoundError` caught and translated to `null`.
- **`raiseGovernanceWorkflowRequest()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyGovernanceEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.

Every method degrades to a documented `null` when its collaborator was not injected, so the AI Governance Engine remains fully usable — and fully tested — completely offline.
