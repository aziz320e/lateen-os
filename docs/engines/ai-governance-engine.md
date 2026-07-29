---
title: AI Governance Engine
title_ar: محرك الحوكمة الذكية
version: 1.0.0
status: active
package: "@lateen-os/ai-governance-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-brain
  - ai-runtime
  - ai-security-engine
  - business-dna
  - communication-hub
  - workflow-engine
  - admin-console
  - ai-compliance-engine
  - analytics-engine
  - api-gateway
  - observability-engine
---

# العربية

## محرك الحوكمة الذكية (AI Governance Engine)

### 1. الغرض

يوفّر `ai-governance-engine` سياسات الحوكمة، حوكمة الذكاء الاصطناعي/النماذج/الوكلاء/سير العمل، الموافقة البشرية، حوكمة المخاطر، تتبع القرار، ومحرك قواعد الحوكمة — يعتمد على طبقة الأمن المكتملة قبله مباشرة (حسب تسلسل التزامات المرحلة 1).

### 2. المسؤوليات

- محرك سياسات الحوكمة وإصداراتها (`GovernancePolicyEngine`).
- خدمة حوكمة الذكاء الاصطناعي (`AiGovernanceService`).
- حوكمة النماذج (`ModelGovernanceService`).
- حوكمة الوكلاء (`AgentGovernanceService`) — مُركَّبة مع سجل وكلاء `ai-runtime` عبر `agentRuntimeRegistry`.
- حوكمة سير العمل (`WorkflowGovernanceService`) — مُركَّبة مع استعلامات `workflow-engine` عبر `workflowQueries`.
- محرك الموافقة البشرية (`ApprovalEngine`) — مُركَّب مباشرة مع خدمة تتبع القرار.
- سجل المخاطر (`RiskRegister`)، خدمة تتبع القرار (`DecisionTrackingService`)، محرك قواعد الحوكمة (`GovernanceRulesEngine`).
- طبقة العلاقات (أمن الذكاء الاصطناعي، وقت تشغيل الذكاء الاصطناعي، العقل الاصطناعي، سير العمل، Business DNA، مركز الاتصال)، طبقة الاستعلام، وناقل الأحداث.

### 3. خارج نطاق المسؤولية

- لا تفرض الأمن بنفسها — تستهلك `ai-security-engine` فقط عبر طبقة العلاقات.
- لا تُنفّذ سير العمل — فقط تتحقق من سياسة التنفيذ عبر `checkExecutionPolicy()` باستخدام استعلامات `workflow-engine` المحقونة.
- لا تُسجِّل وكلاء جددًا — فقط تتحقق من تسجيلهم الفعلي عبر `isAgentRegisteredInRuntime()` باستخدام سجل `ai-runtime` المحقون.
- لا تستدعي أي نموذج لغة كبير.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createGovernanceRuntime(deps: GovernanceRuntimeDeps = {})` في `runtime.ts`، ويُعيد `GovernanceRuntime`:
`{ policies, aiGovernance, modelGovernance, agentGovernance, workflowGovernance, approvals, risks, decisions, rules, relationships, queries, events }`.

### 5. الاستعلامات العامة

`GovernanceQueries`: `findPolicies`، `findPolicyVersions`، `findApprovals`، `findRisks`، `findExceptions`، `findGovernanceEvents`، `searchGovernance` (7 طرق).

### 6. الأحداث المكتوبة النوع

`GOVERNANCE_EVENT_NAMES` (10 أحداث): `policy.created`/`updated`/`activated`/`deactivated`، `approval.requested`/`completed`، `risk.created`/`escalated`، `governance.violation.detected`، `governance.audit.created`.

### 7. الاعتماديات

من `package.json`: `ai-brain`، `ai-runtime`، `ai-security-engine`، `business-dna`، `communication-hub`، `shared-kernel`، `workflow-engine` (7 اعتماديات).

### 8. الحزم المعتمِدة

`admin-console`، `ai-compliance-engine`، `analytics-engine`، `api-gateway`، `observability-engine`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 6 متعاونين: `aiSecurity: Pick<SecurityRuntime,'queries'>`، `aiRuntime: Pick<RuntimeQueries,'findAgent'|'findRuntimeState'>` (النمط الخاص الموثَّق لأن `ai-runtime` بلا جذر تركيب موحّد)، `aiBrain: { queries: Pick<BrainQueries,'explainPlan'> }`، `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`، `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`، `communicationHub: Pick<CommunicationRuntime,'notifications'>`. بالإضافة إلى منفذين مباشرين خارج هذه الطبقة: `agentRuntimeRegistry` و`workflowQueries` في `GovernanceRuntimeDeps` نفسها.

### 10. ملاحظات معمارية

يستخدم النمط الضيق الموثَّق لتكامل `ai-runtime` (`Pick<RuntimeQueries, '...'>`) بدلًا من افتراض جذر تركيب موحّد غير موجود لتلك الحزمة — متوافق تمامًا مع الانحراف المُصرَّح به في `08_PROJECT_STATUS.md` §21.

### 11. قرارات التصميم

- ساعة حقن (`now`) افتراضية `nowIso`.
- ناقل أحداث افتراضي `createGovernanceEventBus()`.
- محرك الموافقة (`approvals`) يُركَّب مباشرة مع مثيل خدمة `decisions` (وليس مجرد مستودع) بحيث يُسجَّل كل قرار موافقة تلقائيًا في تتبع القرار.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات حوكمة يجب أن تستهلك `GovernanceQueries` فقط، أو تُحقن كمتعاون في `GovernanceRuntimeDeps` عبر التزام مخصص.

### 13. المحركات ذات الصلة

[ai-brain](./ai-brain.md) · [ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [ai-compliance-engine](./ai-compliance-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)

---

# English

## AI Governance Engine

### 1. Purpose

`ai-governance-engine` provides governance policies, AI/model/agent/workflow governance, human approval, risk governance, decision tracking, and the governance rules engine — built directly on top of the already-completed security trust layer (per the Phase-1 commit sequence).

### 2. Responsibilities

- Governance policy engine and versions (`GovernancePolicyEngine`).
- AI governance service (`AiGovernanceService`).
- Model governance (`ModelGovernanceService`).
- Agent governance (`AgentGovernanceService`) — composed with `ai-runtime`'s agent registry via `agentRuntimeRegistry`.
- Workflow governance (`WorkflowGovernanceService`) — composed with `workflow-engine`'s queries via `workflowQueries`.
- The human approval engine (`ApprovalEngine`) — composed directly with the decision tracking service.
- The risk register (`RiskRegister`), decision tracking service (`DecisionTrackingService`), and the governance rules engine (`GovernanceRulesEngine`).
- The Relationship Layer (AI Security, AI Runtime, AI Brain, Workflow, Business DNA, Communication Hub), the query layer, and the event bus.

### 3. Non-responsibilities

- Does not enforce security itself — it only consumes `ai-security-engine` through the Relationship Layer.
- Does not execute workflows — it only checks execution policy via `checkExecutionPolicy()` using the injected `workflow-engine` queries.
- Does not register agents — it only checks real registration via `isAgentRegisteredInRuntime()` using the injected `ai-runtime` registry.
- Never calls an LLM.

### 4. Public Runtime

The real composition root is `createGovernanceRuntime(deps: GovernanceRuntimeDeps = {})` in `runtime.ts`, returning `GovernanceRuntime`:
`{ policies, aiGovernance, modelGovernance, agentGovernance, workflowGovernance, approvals, risks, decisions, rules, relationships, queries, events }`.

### 5. Public Queries

`GovernanceQueries`: `findPolicies`, `findPolicyVersions`, `findApprovals`, `findRisks`, `findExceptions`, `findGovernanceEvents`, `searchGovernance` (7 methods).

### 6. Typed Events

`GOVERNANCE_EVENT_NAMES` (10 events): `policy.created`/`updated`/`activated`/`deactivated`, `approval.requested`/`completed`, `risk.created`/`escalated`, `governance.violation.detected`, `governance.audit.created`.

### 7. Dependencies

From `package.json`: `ai-brain`, `ai-runtime`, `ai-security-engine`, `business-dna`, `communication-hub`, `shared-kernel`, `workflow-engine` (7 dependencies).

### 8. Dependents

`admin-console`, `ai-compliance-engine`, `analytics-engine`, `api-gateway`, `observability-engine`.

### 9. Integration Points

`relationship-management/types.ts` defines 6 collaborators: `aiSecurity: Pick<SecurityRuntime,'queries'>`, `aiRuntime: Pick<RuntimeQueries,'findAgent'|'findRuntimeState'>` (the documented special case since `ai-runtime` has no unified composition root), `aiBrain: { queries: Pick<BrainQueries,'explainPlan'> }`, `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`, `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`, `communicationHub: Pick<CommunicationRuntime,'notifications'>`. Plus two direct ports outside this layer: `agentRuntimeRegistry` and `workflowQueries`, declared in `GovernanceRuntimeDeps` itself.

### 10. Architecture Notes

Uses the documented narrow pattern for `ai-runtime` integration (`Pick<RuntimeQueries, '...'>`) instead of assuming a unified composition root that doesn't exist for that package — fully consistent with the sanctioned deviation in `08_PROJECT_STATUS.md` §21.

### 11. Design Decisions

- An injectable clock (`now`), defaulting to `nowIso`.
- A default event bus, `createGovernanceEventBus()`.
- The approval engine (`approvals`) is composed directly with the `decisions` service instance (not just a repository), so every approval outcome is automatically recorded in decision tracking.

### 12. Extension Points

Any future package needing governance data should consume `GovernanceQueries` only, or inject itself as a collaborator in `GovernanceRuntimeDeps` via a dedicated commit.

### 13. Related Engines

[ai-brain](./ai-brain.md) · [ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [ai-compliance-engine](./ai-compliance-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)
