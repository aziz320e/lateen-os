---
title: Governance Architecture
title_ar: عمارة الحوكمة
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - SECURITY_ARCHITECTURE.md
  - RELATIONSHIP_MODEL.md
related_engines:
  - ai-governance-engine
related_commits:
  - "35"
---

# العربية

## عمارة الحوكمة

### 1. البنية الفعلية لـ `ai-governance-engine`

تحقّقنا مباشرة من `packages/ai-governance-engine/src/`: 9 وحدات نطاقية فرعية (`agent-governance`, `ai-governance`, `approval`, `decision`, `model-governance`, `policy`, `risk`, `rules-engine`, `workflow-governance`) بالإضافة إلى `events/`, `queries/`, `relationship-management/`, `runtime.ts`. جذر التركيب `createGovernanceRuntime(deps = {})` (في `runtime.ts`) يُرجع `GovernanceRuntime` واحدًا يضم:

```ts
export interface GovernanceRuntime {
  readonly policies: GovernancePolicyEngine;
  readonly aiGovernance: AiGovernanceService;
  readonly modelGovernance: ModelGovernanceService;
  readonly agentGovernance: AgentGovernanceService;
  readonly workflowGovernance: WorkflowGovernanceService;
  readonly approvals: ApprovalEngine;
  readonly risks: RiskRegister;
  readonly decisions: DecisionTrackingService;
  readonly rules: GovernanceRulesEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: GovernanceQueries;
  readonly events: GovernanceEventBus;
}
```

### 2. محرك الموافقة البشرية (Human Approval Engine) — حقيقي، متحقَّق منه

`packages/ai-governance-engine/src/approval/service.impl.ts` يُنفّذ محرك موافقة بشرية حتميًا لخمس فئات حقيقية:

```ts
export type ApprovalCategory = 'policy_change' | 'security_exception' | 'workflow_publication' | 'model_approval' | 'provider_approval';
```

السطح العام:

- `requestApproval(organizationId, input)` — يُنشئ طلبًا في حالة `pending`.
- `approve(organizationId, approvalRequestId, input)` / `reject(...)` — ينقل الحالة إلى `approved`/`rejected`، ويرفض أي انتقال من حالة غير `pending` (`InvalidApprovalTransitionError`).
- عند الموافقة على طلب من فئة `security_exception` تحديدًا، يُنشئ المحرك تلقائيًا سجل `GovernanceException` دائمًا — تكامل حقيقي بين وحدتي `approval` و`decision` (كل قرار مكتمل، موافقة أو رفض، يُسجَّل عبر `DecisionTrackingService` المُحقن).

هذا يُطابق `docs/handbook/03_CONSTITUTION.md` §14.1 حرفيًا: "أي قرار يتطلب موافقة بشرية يمر عبر محرك الموافقة البشرية في `ai-governance-engine`."

### 3. حوكمة النماذج والوكلاء وسير العمل (مركزية، لا تكرار محلي)

- `agentGovernance` — يُركَّب مع سجل وكلاء AI Runtime الحقيقي (`agentRuntimeRegistry` — `Pick<RuntimeQueries, 'findAgent'>`) لتشغيل `isAgentRegisteredInRuntime()`.
- `workflowGovernance` — يُركَّب مع استعلامات Workflow Engine الحقيقية (`workflowQueries`) لتشغيل `checkExecutionPolicy()`.
- `rules` (`GovernanceRulesEngine`) — محرك قواعد قابل للتقييم يُنشئ ويؤرشف قواعد الحوكمة ويُقيّم مدخلات (`evaluate()`) — لا تكرار: قواعد النموذج/الوكيل/سير العمل جميعها تمر عبر هذا المحرك الواحد، بدلًا من تكرار المنطق محليًا في كل محرك أعمال — يُطابق `03_CONSTITUTION.md` §14.2.

### 4. سياسات الحوكمة (`GovernancePolicyEngine`)

وحدة `policy/` تُدير سياسات الحوكمة مع تحكّم إصدارات (`policyVersionRepository` منفصل عن `policyRepository`) — يسمح بتتبّع تاريخ كل سياسة عبر الزمن، لا استبدالًا صامتًا.

### 5. طبقة العلاقات الحقيقية

`packages/ai-governance-engine/src/relationship-management/types.ts` (محقّق مباشرة، انظر أيضًا [RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md)): يتكامل مع `ai-brain`, `ai-runtime` (`Pick<RuntimeQueries, 'findAgent' | 'findRuntimeState'>`)، `ai-security-engine`, `business-dna`, `communication-hub`, `workflow-engine` — ست شرائح متعاون، كل واحدة مُضيَّقة إلى الطرق المُستدعاة فعليًا فقط.

### 6. حدود ما تفعله `ai-governance-engine` (لا اختراع قدرات)

هذا المحرك يتتبّع القرارات ويُنفّذ الموافقات ويُقيّم القواعد — لا يُنفّذ هو نفسه أي إجراء تنفيذي على النظام؛ ذلك يبقى حصرًا مسؤولية `decision-engine` (المبدأ التأسيسي، انظر [SYSTEM_OVERVIEW](./SYSTEM_OVERVIEW.md)). لم نجد أي كود يُشير إلى أن `ai-governance-engine` يُنفّذ عمليات نيابة عن حزمة أخرى.

---

# English

## Governance Architecture

### 1. `ai-governance-engine`'s Real Structure

Verified directly against `packages/ai-governance-engine/src/`: 9 subdomain modules (`agent-governance`, `ai-governance`, `approval`, `decision`, `model-governance`, `policy`, `risk`, `rules-engine`, `workflow-governance`) plus `events/`, `queries/`, `relationship-management/`, `runtime.ts`. The composition root `createGovernanceRuntime(deps = {})` (in `runtime.ts`) returns one `GovernanceRuntime`:

```ts
export interface GovernanceRuntime {
  readonly policies: GovernancePolicyEngine;
  readonly aiGovernance: AiGovernanceService;
  readonly modelGovernance: ModelGovernanceService;
  readonly agentGovernance: AgentGovernanceService;
  readonly workflowGovernance: WorkflowGovernanceService;
  readonly approvals: ApprovalEngine;
  readonly risks: RiskRegister;
  readonly decisions: DecisionTrackingService;
  readonly rules: GovernanceRulesEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: GovernanceQueries;
  readonly events: GovernanceEventBus;
}
```

### 2. The Human Approval Engine — Real, Verified

`packages/ai-governance-engine/src/approval/service.impl.ts` implements a deterministic human-approval engine across five real categories:

```ts
export type ApprovalCategory = 'policy_change' | 'security_exception' | 'workflow_publication' | 'model_approval' | 'provider_approval';
```

Its public surface:

- `requestApproval(organizationId, input)` — creates a request in `pending` state.
- `approve(organizationId, approvalRequestId, input)` / `reject(...)` — transitions to `approved`/`rejected`, rejecting any transition from a non-`pending` state (`InvalidApprovalTransitionError`).
- When a `security_exception`-category request is specifically approved, the engine automatically creates a durable `GovernanceException` record — a real integration between the `approval` and `decision` modules (every completed decision, approve or reject, is recorded through the injected `DecisionTrackingService`).

This matches `docs/handbook/03_CONSTITUTION.md` §14.1 verbatim: "Any decision requiring human approval flows through the human approval engine in `ai-governance-engine`."

### 3. Model, Agent, and Workflow Governance (Centralized, No Local Duplication)

- `agentGovernance` — composed with a real AI Runtime agent registry (`agentRuntimeRegistry` — `Pick<RuntimeQueries, 'findAgent'>`) to power `isAgentRegisteredInRuntime()`.
- `workflowGovernance` — composed with real Workflow Engine queries (`workflowQueries`) to power `checkExecutionPolicy()`.
- `rules` (`GovernanceRulesEngine`) — an evaluable rules engine that creates and archives governance rules and evaluates inputs (`evaluate()`) — no duplication: model/agent/workflow rules all flow through this single engine instead of being re-implemented locally in each business engine — matches `03_CONSTITUTION.md` §14.2.

### 4. Governance Policies (`GovernancePolicyEngine`)

The `policy/` module manages governance policies with version control (`policyVersionRepository` kept separate from `policyRepository`) — allows tracking a policy's history over time rather than silently overwriting it.

### 5. The Real Relationship Layer

`packages/ai-governance-engine/src/relationship-management/types.ts` (verified directly, see also [RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md)): integrates with `ai-brain`, `ai-runtime` (`Pick<RuntimeQueries, 'findAgent' | 'findRuntimeState'>`), `ai-security-engine`, `business-dna`, `communication-hub`, `workflow-engine` — six collaborator slices, each narrowed to only the methods actually called.

### 6. The Boundaries of What `ai-governance-engine` Actually Does (No Invented Capabilities)

This engine tracks decisions, executes approvals, and evaluates rules — it never itself executes a system action; that remains exclusively `decision-engine`'s responsibility (the founding principle — see [SYSTEM_OVERVIEW](./SYSTEM_OVERVIEW.md)). No code was found indicating `ai-governance-engine` executes operations on another package's behalf.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- [RELATIONSHIP_MODEL.md](./RELATIONSHIP_MODEL.md)

## Related Engines

`ai-governance-engine`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
