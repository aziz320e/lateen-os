---
title: Workflow Engine
title_ar: محرك سير العمل
version: 1.0.0
status: active
package: "@lateen-os/workflow-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/KNOWN_TECHNICAL_DEBT.md
related_packages:
  - ai-runtime
  - ai-workforce
  - business-dna
  - decision-engine
---

# العربية

## الغرض

`@lateen-os/workflow-engine` هو طبقة التنسيق (Orchestration Layer) القانونية لنظام Lateen OS. **يُنسّق** التنفيذ عبر البشر، عمال الذكاء الاصطناعي، الخدمات، والعمليات التجارية — يُشغّل آلة حالة حقيقية (انتقالات خطوات متسلسلة/شرطية/متوازية، إعادة محاولة، تأخير/انتظار، تعويض، سجل، وأحداث)، لكنه **لا يُنفّذ منطق الأعمال بنفسه**: نوع خطوة له `StepHandler` مُسجَّل يعمل تلقائيًا؛ نوع خطوة بدون معالج يبقى نشطًا/في انتظار نظام خارجي (AI Runtime، واجهة بشرية، Decision Engine، ...) لتبليغ الإكمال عبر `dispatch({command: 'complete' | 'fail'})`.

## المسؤوليات

- تعريفات سير العمل وإصداراتها (مع خطوات وانتقالات مُضمَّنة)، وتخزينها كإصدار مُنشَر جديد عبر `defineWorkflow()`.
- المثيلات وتنسيق الخطوات، استمرارية في الذاكرة.
- خطوات بشرية، ذكاء اصطناعي، خدمة، قرار، وانتظار.
- انتقالات متسلسلة، شرطية، ومتوازية (تشغيل حقيقي بـ `Promise.all` للفروع المتوازية، مع قفل غير متزامن لكل مثيل يُسلسل قراءة-دمج-كتابة المتغيرات وفحوصات اكتمال الالتقاء).
- سياسة إعادة المحاولة (تراجع ثابت/أُسّي بحد أقصى للتأخير) والتعويض (الخطوات المكتملة تُعوَّض بترتيب عكسي عند فشل غير قابل للاسترداد).
- سلاسل الموافقة، السجل، التدقيق، القوالب.
- تقييم الشروط: مجموعتان فرعيتان حقيقيتان `'simple'` و`'jsonlogic'`؛ `'cel'` تُطلق `UnsupportedExpressionLanguageError` بدلًا من تقريبها.
- طبقة استعلامات (`WorkflowQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- **لا يُنفّذ منطق الأعمال بنفسه أبدًا** — خطوة بدون `StepHandler` مُسجَّل تبقى نشطة/في انتظار حتى يُبلّغ نظام خارجي بالنتيجة عبر `dispatch()`.
- لا REST/HTTP، لا قاعدة بيانات/ORM، لا واجهة مستخدم، لا تكامل نموذج لغة كبير مباشر.

## وقت التشغيل العام

جذر التركيب هو `createWorkflowRuntime(deps: WorkflowRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد كائن `WorkflowRuntime` يحوي: `defineWorkflow()` (يُخزّن رسم سير العمل القابل للتنفيذ كتعريف وإصدار جديدين منشورين)، `startWorkflow()` (يُنشئ مثيلًا ويبدأ خطوته الأولى عبر المنسّق)، `orchestrator: WorkflowOrchestrator`، و`queries: WorkflowQueries`. كل المستودعات تُبنى داخل `runtime.ts` فقط ولا تظهر أبدًا على السطح العام المُعاد.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`WorkflowQueries`) تحتوي: `findWorkflow`، `findRunningWorkflows`، `findWaitingTasks`، `findHistory`.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`WorkflowEventMap`، مبني في `events/workflow-event-bus.ts`) يُغطي الأحداث التي ينشرها المنسّق الحقيقي فعليًا: `workflow.defined`، `workflow.published`، `workflow_instance.started`، `workflow_instance.completed`، `workflow_instance.failed`، `workflow_instance.cancelled`، `workflow_instance.suspended`، `workflow_instance.resumed`، `step.started`، `step.completed`، `step.failed`، `step.waiting`، `step.compensated`. (ملف `events/workflow-events.ts` المنفصل يُصدّر أيضًا نوع اتحاد `WorkflowEngineDomainEvent` توثيقيًا — الناقل الفعلي المُوصَّل في `runtime.ts` يستخدم الخريطة أعلاه فقط.)

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel`، `@lateen-os/business-dna`، `@lateen-os/decision-engine`، `@lateen-os/ai-runtime`، `@lateen-os/ai-workforce`. بحثًا فعليًا في `src/`، هذه الاعتماديات الأربع (بخلاف `shared-kernel`) تُستخدم حصرًا كإعادة استخدام أنواع مُعرِّفات (`EmployeeId`/`OrganizationId`/`RoleId` من `business-dna`، `DecisionId` من `decision-engine`، `RuntimeAgentId`/`TaskId` من `ai-runtime`، `WorkerId` من `ai-workforce`) داخل `shared/identifiers.ts` وملفات `step/types.ts`/`action/types.ts`/`approval/types.ts` — **لا يوجد استدعاء سلوكي فعلي (لا استدعاء طريقة تشغيل) لأي من هذه الحزم الأربع في المصدر الحالي**؛ هذا تكامل بنيوي (إعادة استخدام نوع) فقط، وليس تكاملًا سلوكيًا عبر واجهة تشغيل عامة.

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`، عدد كبير من حزم المنصة يعتمد عليها مباشرة، من ضمنها الحزم المشمولة في هذه الدفعة التوثيقية: `marketplace` (`@lateen-os/marketplace-engine`)، `multi-agent`، `observability-engine`، `project-management-engine`، `sales-engine`، `sdk`. كما تعتمد عليها: `ai-brain`، `ai-compliance-engine`، `ai-governance-engine`، `ai-security-engine`، `analytics-engine`، `api-gateway`، `communication-hub`، `document-management-engine`، `finance-engine`، `hr-engine`، `inventory-engine`، `marketing-engine`.

## نقاط التكامل

هذه الحزمة **لا تملك مجلد `relationship-management/`** — نمط معماري معروف وموثّق في `docs/certification/KNOWN_TECHNICAL_DEBT.md` (البند 4)، مشترك مع ثماني حزم أخرى من عصر التأسيس (Era 1). التكامل الفعلي الوحيد الموجود حاليًا هو إعادة استخدام أنواع مُعرِّفات (انظر "الاعتماديات" أعلاه) — لا يوجد استدعاء سلوكي فعلي لأي طريقة تشغيل من `ai-runtime` أو `ai-workforce` أو `decision-engine` أو `business-dna` داخل مصدر هذه الحزمة حاليًا. هذا **ليس خرقًا لحدود المعمارية** (لا يوجد وصول لمستودع، ولا تعديل لحزمة شقيقة)، وليس شيئًا يجب إصلاحه ضمن هذه المهمة التوثيقية.

## ملاحظات معمارية

- لا يوجد مجلد `relationship-management/` رغم اعتماديات `@lateen-os/*` حقيقية مُعلَنة — موثّق في `KNOWN_TECHNICAL_DEBT.md` (البند 4) كنمط معروف من عصر التأسيس، وليس عيبًا حدوديًا.
- الاعتماديات الأربع على `business-dna`/`decision-engine`/`ai-runtime`/`ai-workforce` بنيوية بحتة (إعادة استخدام نوع مُعرِّف) في المصدر الحالي — لا استدعاء سلوكي فعلي لأي منها.
- قفل غير متزامن حقيقي لكل مثيل يضمن أن الفروع المتوازية لا تُفسد مخرجات بعضها البعض ولا تُطلق التقاءً (join) مزدوجًا.
- تقييم شروط `'cel'` غير مدعوم ويُطلق خطأً صريحًا بدلًا من تقريب غير دقيق — قرار تصميم متعمَّد وموثّق في المصدر.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية (ساعة قابلة للحقن للاختبار الحتمي).
- كل نوع خطوة يُسجَّل بمعالج (`StepHandler`) اختياري — المحرك نفسه لا يُنفّذ منطق أعمال أبدًا؛ هذا هو "منفذ حقن التبعية" (DI seam) الأساسي للحزمة.
- أسماء الأحداث تتبع اصطلاح `noun.verb`/`noun_noun.verb` بصيغة الماضي.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج تنسيق سير عمل يجب أن تستهلك `createWorkflowRuntime()` العام فقط، وتُسجّل `StepHandler` خاصًا بها لنوع الخطوة الذي تملكه — لا يجوز أبدًا تعديل هذه الحزمة لتنفيذ منطق أعمال حزمة أخرى بنفسها. أي حزمة تريد تكاملًا سلوكيًا حقيقيًا (وليس مجرد إعادة استخدام نوع) يجب أن تُضيفه عبر التزام (commit) مخصص، ويُفضَّل أن يُصاحبه استخراج التكامل الحالي المُضمَّن ضمن `relationship-management/` مخصصة كجزء من معالجة دين `KNOWN_TECHNICAL_DEBT.md` البند 4، لا أن يُضاف تكامل جديد بنفس النمط المُبعثَر.

## المحركات ذات الصلة

- [AI Runtime](./ai-runtime.md)
- [AI Workforce](./ai-workforce.md)
- [Business DNA](./business-dna.md)
- [Decision Engine](./decision-engine.md)

---

# English

## Purpose

`@lateen-os/workflow-engine` is the canonical orchestration layer for Lateen OS. It **coordinates** execution across humans, AI workers, services, and business processes — running a real state machine (sequential/conditional/parallel step transitions, retries, delay/wait, compensation, history, and events) — but it **does not execute business logic itself**: a step type with a registered `StepHandler` runs automatically; a step type with none stays active/waiting for an external system (AI Runtime, a human UI, Decision Engine, ...) to report completion via `dispatch({command: 'complete' | 'fail'})`.

## Responsibilities

- Workflow definitions and versions (with embedded steps and transitions), persisted as a newly published version via `defineWorkflow()`.
- Instances and step coordination, in-memory persistence.
- Human, AI, service, decision, and wait steps.
- Sequential, conditional, and parallel transitions (real `Promise.all` concurrency for parallel branches, with a per-instance async lock serializing the read-merge-write of instance variables and join-completion checks).
- Retry policy (fixed/exponential backoff with a delay cap) and compensation (completed steps are compensated in reverse order on irrecoverable failure).
- Approval chains, history, audit, templates.
- Condition evaluation: real `'simple'` and `'jsonlogic'` subsets; `'cel'` throws `UnsupportedExpressionLanguageError` rather than approximating it.
- A `WorkflowQueries` query layer and a typed event bus.

## Non-responsibilities

- **Never executes business logic itself** — a step with no registered `StepHandler` stays active/waiting until an external system reports the outcome via `dispatch()`.
- No REST/HTTP, no database/ORM, no UI, no direct LLM integration.

## Public Runtime

The composition root is `createWorkflowRuntime(deps: WorkflowRuntimeDeps = {})` in `src/runtime.ts`, returning a `WorkflowRuntime` object with: `defineWorkflow()` (persists a workflow's executable graph as a new published definition + version), `startWorkflow()` (creates an instance and starts its first step through the orchestrator), `orchestrator: WorkflowOrchestrator`, and `queries: WorkflowQueries`. Every repository is constructed only inside `runtime.ts` and never appears on the returned surface.

## Public Queries

A real `queries/` layer (`WorkflowQueries`) exposes: `findWorkflow`, `findRunningWorkflows`, `findWaitingTasks`, `findHistory`.

## Typed Events

A real event bus (`WorkflowEventMap`, built in `events/workflow-event-bus.ts`) covers the events the real orchestrator actually publishes: `workflow.defined`, `workflow.published`, `workflow_instance.started`, `workflow_instance.completed`, `workflow_instance.failed`, `workflow_instance.cancelled`, `workflow_instance.suspended`, `workflow_instance.resumed`, `step.started`, `step.completed`, `step.failed`, `step.waiting`, `step.compensated`. (A separate file, `events/workflow-events.ts`, also exports a `WorkflowEngineDomainEvent` union for documentation purposes — the actual bus wired in `runtime.ts` uses only the map above.)

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel`, `@lateen-os/business-dna`, `@lateen-os/decision-engine`, `@lateen-os/ai-runtime`, `@lateen-os/ai-workforce`. A real search of `src/` found these four dependencies (beyond `shared-kernel`) used exclusively as identifier-type reuse (`EmployeeId`/`OrganizationId`/`RoleId` from `business-dna`, `DecisionId` from `decision-engine`, `RuntimeAgentId`/`TaskId` from `ai-runtime`, `WorkerId` from `ai-workforce`) inside `shared/identifiers.ts` and the `step/types.ts`/`action/types.ts`/`approval/types.ts` files — **no real behavioral call (no runtime method invocation) to any of these four packages exists in the current source**; this is structural (type-reuse) integration only, not behavioral integration through a public runtime.

## Dependents

Verified by grepping every `package.json`, a large share of the platform depends on it directly, including the packages covered in this documentation batch: `marketplace` (`@lateen-os/marketplace-engine`), `multi-agent`, `observability-engine`, `project-management-engine`, `sales-engine`, `sdk`. Also depending on it: `ai-brain`, `ai-compliance-engine`, `ai-governance-engine`, `ai-security-engine`, `analytics-engine`, `api-gateway`, `communication-hub`, `document-management-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `marketing-engine`.

## Integration Points

This package **has no `relationship-management/` folder** — a known, documented architectural pattern recorded in `docs/certification/KNOWN_TECHNICAL_DEBT.md` (item 4), shared with eight other Era-1 packages. The only integration that genuinely exists today is identifier-type reuse (see Dependencies above) — there is no real behavioral call to any runtime method of `ai-runtime`, `ai-workforce`, `decision-engine`, or `business-dna` anywhere in this package's current source. This is **not a boundary violation** (no repository access, no sibling package modified), and is not something this documentation task is meant to fix.

## Architecture Notes

- No `relationship-management/` folder despite real declared `@lateen-os/*` dependencies — recorded in `KNOWN_TECHNICAL_DEBT.md` (item 4) as a known Era-1 pattern, not a boundary defect.
- The four dependencies on `business-dna`/`decision-engine`/`ai-runtime`/`ai-workforce` are purely structural (identifier-type reuse) in the current source — no real behavioral call to any of them.
- A real per-instance async lock ensures parallel branches never clobber each other's output or double-trigger a join.
- `'cel'` condition evaluation is unsupported and throws an explicit error rather than an inaccurate approximation — a deliberate, source-documented design decision.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to a deterministic `nowIso` (an injectable clock for deterministic testing).
- Every step type is registered with an optional `StepHandler` — the engine itself never executes business logic; this is the package's core dependency-injection seam.
- Event names follow the `noun.verb`/`noun_noun.verb` past-tense convention.

## Extension Points

Any future package needing workflow coordination should consume only the public `createWorkflowRuntime()`, and register its own `StepHandler` for the step type it owns — this package must never be modified to execute another package's business logic itself. Any package wanting genuine behavioral integration (not just type reuse) should add it through a dedicated commit, ideally paired with extracting the current inline integration into a proper `relationship-management/` module as part of addressing `KNOWN_TECHNICAL_DEBT.md` item 4, rather than adding new integration in the same scattered style.

## Related Engines

- [AI Runtime](./ai-runtime.md)
- [AI Workforce](./ai-workforce.md)
- [Business DNA](./business-dna.md)
- [Decision Engine](./decision-engine.md)
