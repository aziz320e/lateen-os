---
title: AI Compliance Engine
title_ar: محرك الامتثال الذكي
version: 1.0.0
status: active
package: "@lateen-os/ai-compliance-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-governance-engine
  - ai-security-engine
  - business-dna
  - communication-hub
  - workflow-engine
  - admin-console
  - analytics-engine
  - api-gateway
  - observability-engine
---

# العربية

## محرك الامتثال الذكي (AI Compliance Engine)

### 1. الغرض

يوفّر `ai-compliance-engine` قدرات الامتثال الشاملة للمنصة: أطر الامتثال، عناصر التحكم، ربط عناصر التحكم، إدارة الأدلة، محرك التقييم، تحليل الفجوات، محرك المعالجة، محرك التدقيق، محرك الاحتفاظ، والتقارير — يعتمد على طبقة الأمن والحوكمة المكتملتين مسبقًا (حسب تسلسل التزامات المرحلة 1).

### 2. المسؤوليات

- سجل أطر الامتثال وإصداراتها (`ComplianceFrameworkEngine`).
- عناصر التحكم (`ComplianceControlService`) وربط عناصر التحكم (`ControlMappingService`).
- إدارة الأدلة (`EvidenceService`).
- محرك التقييم (`AssessmentEngine`) — يعتمد على عناصر التحكم والأدلة.
- تحليل الفجوات (`GapAnalysisEngine`) — مُركَّب مع `ai-governance-engine` عبر متعاون منفصل خاص بهذه الوحدة تحديدًا.
- محرك المعالجة (`RemediationEngine`)، محرك التدقيق (`AuditEngine`)، محرك الاحتفاظ (`RetentionEngine`).
- محرك التقارير (`ReportEngine`) — مُركَّب داخليًا مع التقييمات وتحليل الفجوات ومستودع المعالجة مباشرة.
- طبقة العلاقات (Security/Business DNA/Workflow/Communication Hub)، طبقة الاستعلام، وناقل الأحداث.

### 3. خارج نطاق المسؤولية

- لا يفرض سياسات الأمن بنفسه — يستهلك `queries` الخاصة بـ `ai-security-engine` فقط عبر طبقة العلاقات.
- لا يُعرِّف سياسات الحوكمة بنفسه — يستهلك `ai-governance-engine` فقط من خلال متعاون تحليل الفجوات (`GapAnalysisDeps.aiGovernance`)، وليس من خلال طبقة العلاقات العامة.
- لا يُنفِّذ سير عمل فعليًا — فقط يستدعي واجهة `workflow-engine` العامة (`defineWorkflow`/`startWorkflow`) عبر طبقة العلاقات عند الحقن.
- لا يستدعي أي نموذج لغة كبير.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createComplianceRuntime(deps: ComplianceRuntimeDeps = {})` في `runtime.ts`، ويُعيد `ComplianceRuntime`:
`{ frameworks, controls, controlMappings, evidence, assessments, gapAnalysis, remediations, audits, retention, reports, relationships, queries, events }`. جميع المستودعات (11) داخلية فقط.

### 5. الاستعلامات العامة

`ComplianceQueries`: `findFrameworks`، `findControls`، `findAssessments`، `findEvidence`، `findAudits`، `findReports`، `findRemediations`، `findComplianceStatus`، `searchCompliance` (9 طرق).

### 6. الأحداث المكتوبة النوع

`COMPLIANCE_EVENT_NAMES` (11 حدثًا): `framework.created`، `framework.updated`، `assessment.completed`، `control.failed`، `control.passed`، `evidence.collected`، `audit.started`، `audit.completed`، `remediation.created`، `remediation.completed`، `compliance.report.generated`.

### 7. الاعتماديات

من `package.json`: `ai-governance-engine`، `ai-security-engine`، `business-dna`، `communication-hub`، `shared-kernel`، `workflow-engine` (6 اعتماديات).

### 8. الحزم المعتمِدة

`admin-console`، `analytics-engine`، `api-gateway`، `observability-engine`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 4 متعاونين: `aiSecurity: Pick<SecurityRuntime,'queries'>`، `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`، `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`، `communicationHub: Pick<CommunicationRuntime,'notifications'>`. متعاون خامس (`aiGovernance`) موثَّق صراحةً في تعليق الكود على أنه **مُدمَج بشكل منفصل** عبر `GapAnalysisDeps` وليس عبر هذه الطبقة نفسها.

### 10. ملاحظات معمارية

مسار تكامل مزدوج ومقصود: معظم الأشقاء يمرّون عبر `relationship-management/` القياسية، بينما `ai-governance-engine` تحديدًا يُحقن مباشرة في `gap-analysis/` فقط — موثَّق بوضوح في تعليق `RelationshipManagementDeps` نفسه، وليس خللًا.

### 11. قرارات التصميم

- ساعة حقن (`now`) افتراضية `nowIso` في كل خدمة.
- ناقل أحداث افتراضي `createComplianceEventBus()` عند عدم الحقن.
- محرك التقارير لا يُنشئ مستودعات جديدة لإعادة حساب حالة الامتثال، بل يُركِّب مباشرة فوق `assessments`/`gapAnalysis`/`remediationRepository` الموجودة أصلًا.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات امتثال (مثل حالة إطار أو تقرير) يجب أن تستهلك `ComplianceQueries` فقط، أو تُحقن نفسها كمتعاون في `ComplianceRuntimeDeps` عبر التزام مخصص لهذه الحزمة.

### 13. المحركات ذات الصلة

[ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)

---

# English

## AI Compliance Engine

### 1. Purpose

`ai-compliance-engine` provides the platform's comprehensive compliance capabilities: compliance frameworks, controls, control mapping, evidence management, the assessment engine, gap analysis, the remediation engine, the audit engine, the retention engine, and reporting — built on top of the already-completed security and governance trust layers (per the Phase-1 commit sequence).

### 2. Responsibilities

- Compliance framework registry and versions (`ComplianceFrameworkEngine`).
- Controls (`ComplianceControlService`) and control mapping (`ControlMappingService`).
- Evidence management (`EvidenceService`).
- The assessment engine (`AssessmentEngine`) — built on controls and evidence.
- Gap analysis (`GapAnalysisEngine`) — composed with `ai-governance-engine` via a collaborator dedicated specifically to this module.
- The remediation engine (`RemediationEngine`), the audit engine (`AuditEngine`), the retention engine (`RetentionEngine`).
- The report engine (`ReportEngine`) — composed internally, directly with assessments, gap analysis, and the remediation repository.
- The Relationship Layer (Security/Business DNA/Workflow/Communication Hub), the query layer, and the event bus.

### 3. Non-responsibilities

- Does not enforce security policy itself — it only consumes `ai-security-engine`'s `queries` through the Relationship Layer.
- Does not define governance policy itself — it only consumes `ai-governance-engine` through the gap-analysis collaborator (`GapAnalysisDeps.aiGovernance`), not through the general Relationship Layer.
- Does not execute workflows itself — it only calls `workflow-engine`'s public interface (`defineWorkflow`/`startWorkflow`) through the Relationship Layer when injected.
- Never calls an LLM.

### 4. Public Runtime

The real composition root is `createComplianceRuntime(deps: ComplianceRuntimeDeps = {})` in `runtime.ts`, returning `ComplianceRuntime`:
`{ frameworks, controls, controlMappings, evidence, assessments, gapAnalysis, remediations, audits, retention, reports, relationships, queries, events }`. All 11 repositories are internal only.

### 5. Public Queries

`ComplianceQueries`: `findFrameworks`, `findControls`, `findAssessments`, `findEvidence`, `findAudits`, `findReports`, `findRemediations`, `findComplianceStatus`, `searchCompliance` (9 methods).

### 6. Typed Events

`COMPLIANCE_EVENT_NAMES` (11 events): `framework.created`, `framework.updated`, `assessment.completed`, `control.failed`, `control.passed`, `evidence.collected`, `audit.started`, `audit.completed`, `remediation.created`, `remediation.completed`, `compliance.report.generated`.

### 7. Dependencies

From `package.json`: `ai-governance-engine`, `ai-security-engine`, `business-dna`, `communication-hub`, `shared-kernel`, `workflow-engine` (6 dependencies).

### 8. Dependents

`admin-console`, `analytics-engine`, `api-gateway`, `observability-engine`.

### 9. Integration Points

`relationship-management/types.ts` defines 4 collaborators: `aiSecurity: Pick<SecurityRuntime,'queries'>`, `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`, `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`, `communicationHub: Pick<CommunicationRuntime,'notifications'>`. A fifth collaborator (`aiGovernance`) is explicitly documented in the code comment as being **integrated separately**, via `GapAnalysisDeps`, not through this same layer.

### 10. Architecture Notes

A deliberate dual integration path: most siblings go through the standard `relationship-management/`, while `ai-governance-engine` specifically is injected directly into `gap-analysis/` only — clearly documented in `RelationshipManagementDeps`'s own code comment, not a defect.

### 11. Design Decisions

- An injectable clock (`now`), defaulting to `nowIso`, in every service.
- A default event bus, `createComplianceEventBus()`, when none is injected.
- The report engine does not create new repositories to recompute compliance status — it composes directly over the existing `assessments`/`gapAnalysis`/`remediationRepository`.

### 12. Extension Points

Any future package needing compliance data (e.g. a framework's status or a report) should consume `ComplianceQueries` only, or inject itself as a collaborator in `ComplianceRuntimeDeps` via a dedicated commit for this package.

### 13. Related Engines

[ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)
