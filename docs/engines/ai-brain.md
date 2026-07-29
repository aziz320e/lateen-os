---
title: AI Brain Engine
title_ar: محرك العقل الاصطناعي
version: 1.0.0
status: active
package: "@lateen-os/ai-brain"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
related_packages:
  - ai-runtime
  - ai-workforce
  - business-dna
  - decision-engine
  - domain-graph
  - institutional-memory
  - multi-agent
  - workflow-engine
  - ceo-engine
  - sdk
---

# العربية

## العقل الاصطناعي (AI Brain)

### 1. الغرض

`ai-brain` هو طبقة الاستدلال المركزية للمؤسسة (حزمة من الحقبة الأولى/Era 1). يفهم النية (Intent)، يجمع سياق المؤسسة، يستدل، يخطط، يوجّه (Routing)، يتحقق من الخطة، ويعكس (Reflection) — كل ذلك دون تنفيذ أي منطق أعمال بنفسه: ينسّق فقط خدمات المنصة الأخرى (`ai-runtime`، `workflow-engine`، `multi-agent`) عبر إنتاج خطط تنفيذ مُشكَّلة وفق أنواع معرّفاتها الحقيقية، تاركًا التنفيذ الفعلي لمستهلك أعلى (مثل `ceo-engine` عبر `sdk`).

### 2. المسؤوليات

- التعرّف على النية (`IntentRecognizer`).
- تجميع سياق المؤسسة (`EnterpriseContextAssembler`)، مع إثراء اختياري من `decision-engine`.
- الذاكرة العاملة (`WorkingMemory`).
- الاستدلال المؤسسي (`EnterpriseReasoner`).
- التوجيه (`PlatformRouter`) — يستدعي سجل وكلاء `ai-runtime` عند حقنه.
- التخطيط (`BrainPlanner`) وإنتاج خطط تنفيذ (`ExecutionPlan`).
- التحقق من الخطة (`PlanValidator`: صلاحيات/سياسة/أعمال).
- الانعكاس الذاتي (`BrainReflector`).
- طبقة استعلام (`BrainQueries`) وناقل أحداث مكتوب النوع (`BrainEventBus`).

### 3. خارج نطاق المسؤولية

- "عقود فقط — لا SDK لنموذج لغة، ولا منطق أعمال، ولا تخزين دائم" كما ينص التعليق الرسمي أعلى الحزمة: لا تستدعي أي SDK لنموذج لغة كبير مباشرة.
- لا تُنفّذ الخطط أو الوركفلو أو الوكلاء بنفسها — فقط تُنتج `ExecutionPlan` مُصادَقًا عليها؛ التنفيذ الفعلي مسؤولية مستهلك أعلى.
- لا تُخزِّن بيانات دائمة خارج مخزن الخطط/جلسات الاستدلال داخل الذاكرة الخاصة بها.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي المُجمِّع (بمعامِلات اختيارية `deps = {}`) هو **`createBrainSystem(deps: BrainDeps = {})`** في `brain.impl.ts`، ويُعيد `BrainSystem: { brain: Brain, queries: BrainQueries }` يتشاركان نفس المخازن الأساسية (`planRepository`, `reasoningSessions`).
يوجد أيضًا `createBrain(deps)` وهو دالة أدنى مستوى تتطلب `planRepository` و`reasoningSessions` إلزاميًا (غير اختياريين) وتُعيد `Brain` وحده — هذه هي الدالة التي يستخدمها `createBrainSystem` داخليًا.

### 5. الاستعلامات العامة

`BrainQueries` (من `queries/brain-queries.ts`): `explainPlan`، `explainDecision`، `explainMission`، `findRelevantKnowledge`.

### 6. الأحداث المكتوبة النوع

`BRAIN_EVENT_NAMES` (5 أحداث حقيقية): `intent.recognized`، `plan.created`، `plan.rejected`، `execution.requested`، `reasoning.completed`.

### 7. الاعتماديات

من `package.json`: `ai-runtime`، `ai-workforce`، `business-dna`، `decision-engine`، `domain-graph`، `institutional-memory`، `multi-agent`، `shared-kernel`، `workflow-engine` (9 اعتماديات).

### 8. الحزم المعتمِدة

`ai-governance-engine`، `ai-security-engine`، `multi-agent`، `sdk` (تعتمد جميعها على `@lateen-os/ai-brain` في `package.json`؛ إضافة إلى ذلك، `ai-compliance-engine` و`ai-governance-engine` تُنمِّطان متعاون `aiBrain` عبر `Pick<BrainQueries,'explainPlan'>` في طبقة العلاقات الخاصة بهما).

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` في هذه الحزمة — وهذا انحراف موثّق ومُصرَّح به (F4 في `ARCHITECTURE_AUDIT.md`): الحزمة من الحقبة الأولى وتسبق هذا التعارف، ونداءات الأشقاء تحدث مباشرة داخل ملفات التنفيذ الفرعية (مثل `contextAssembler` مع `decisionQueries`، و`router` مع `agentRegistry` من `ai-runtime`)، وليس عبر طبقة علاقات مركزية — دون أن يشكّل ذلك أي خرق لحدود المستودعات.

### 10. ملاحظات معمارية

- **اعتمادية دائرية حقيقية وموثّقة** مع `multi-agent` (`DEPENDENCY_AUDIT.md` F1): `ai-brain` يستورد نوع `MissionId` من `multi-agent`، و`multi-agent` يستورد نوع `Brain` من `ai-brain` لمتعاون تصعيد اختياري. هذا هو العيب المعماري الوحيد المسجَّل في المنصة حتى الآن؛ لم يُصلَح عمدًا (خارج نطاق أي التزام حالي)، وهو أعلى بند دَين تقني موثَّق.
- **تناقض حقيقي بين تقارير الشهادة والمصدر الفعلي**: يذكر كل من `ARCHITECTURE_AUDIT.md` و`RUNTIME_AUDIT.md` (الجدول F1) أن جذر التركيب هو `createBrain()`، بينما جذر التركيب الفعلي متعدد المعامِلات الاختيارية (`deps = {}`) والذي يُعيد كلًا من `brain` و`queries` معًا هو `createBrainSystem()` — و`README.md` الخاص بالحزمة نفسها يوثّق `createBrainSystem()` بشكل صحيح ومطابق للمصدر.
- ناقل الأحداث **لا يُبنى تلقائيًا** إن لم يُحقن: خلافًا لمعظم حزم المنصة التي تُهيّئ ناقل أحداث افتراضيًا (`createXEventBus()`) عند غيابه، فإن `createBrain`/`createBrainSystem` لا يُنشئان ناقلًا افتراضيًا — الاستدعاءات كلها عبر `eventBus?.publish(...)`، فإن لم يُحقن ناقل، لا تُنشر أي أحداث إطلاقًا.

### 11. قرارات التصميم

- معرّفات الجلسات/الانعكاس تُولَّد عبر `generateId()` الحتمية.
- كل قدرة (`capabilities`) قابلة للاستبدال جزئيًا عبر `deps.capabilities` — مما يسمح باختبار كل قدرة بمعزل عن الأخريات دون مكتبات محاكاة.
- الخطة النهائية (`finalPlan`) تُحسب بشكل حتمي من نتيجة `validation.approved`، وتُحفظ فقط عند تغيّر الحالة الفعلية.

### 12. نقاط التوسعة

أي مستهلك مستقبلي (مثل `ceo-engine` أو حزمة تنفيذية جديدة) يدمج مع `ai-brain` فقط عبر معامِلات `createBrainSystem` الاختيارية (`agentRegistry`، `decisionQueries`، `eventBus`) أو عبر `BrainQueries` للفحص القرائي فقط — لا تعديل داخلي لهذه الحزمة أبدًا.

### 13. المحركات ذات الصلة

[ai-runtime](./ai-runtime.md) · [ai-workforce](./ai-workforce.md) · [business-dna](./business-dna.md) · [decision-engine](./decision-engine.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [multi-agent](./multi-agent.md) · [workflow-engine](./workflow-engine.md) · [ceo-engine](./ceo-engine.md) · [sdk](./sdk.md)

---

# English

## AI Brain

### 1. Purpose

`ai-brain` is the platform's central enterprise reasoning layer (an Era-1 package). It understands intent, assembles enterprise context, reasons, plans, routes, validates the plan, and reflects — without executing any business logic itself: it only coordinates other platform services (`ai-runtime`, `workflow-engine`, `multi-agent`) by producing execution plans shaped to their real id types, leaving actual execution to a caller above it (e.g. `ceo-engine`, via `sdk`).

### 2. Responsibilities

- Intent recognition (`IntentRecognizer`).
- Enterprise context assembly (`EnterpriseContextAssembler`), optionally enriched from `decision-engine`.
- Working memory (`WorkingMemory`).
- Enterprise reasoning (`EnterpriseReasoner`).
- Routing (`PlatformRouter`) — calls `ai-runtime`'s agent registry when injected.
- Planning (`BrainPlanner`) and `ExecutionPlan` production.
- Plan validation (`PlanValidator`: permission/policy/business).
- Self-reflection (`BrainReflector`).
- A query layer (`BrainQueries`) and a typed event bus (`BrainEventBus`).

### 3. Non-responsibilities

- "Contracts only — no LLM SDK, business logic, or persistence," per the package's own top-level doc comment: it never calls any LLM SDK directly.
- Does not execute plans, workflows, or agents itself — it only produces a validated `ExecutionPlan`; actual execution is a caller's responsibility.
- Holds no durable data beyond its own in-memory plan/reasoning-session stores.

### 4. Public Runtime

The real, aggregating composition root (with optional `deps = {}`) is **`createBrainSystem(deps: BrainDeps = {})`** in `brain.impl.ts`, returning `BrainSystem: { brain: Brain, queries: BrainQueries }` sharing the same underlying stores (`planRepository`, `reasoningSessions`).
A lower-level `createBrain(deps)` also exists, requiring `planRepository` and `reasoningSessions` as mandatory (non-optional) arguments and returning only `Brain` — this is the function `createBrainSystem` wraps internally.

### 5. Public Queries

`BrainQueries` (from `queries/brain-queries.ts`): `explainPlan`, `explainDecision`, `explainMission`, `findRelevantKnowledge`.

### 6. Typed Events

`BRAIN_EVENT_NAMES` (5 real events): `intent.recognized`, `plan.created`, `plan.rejected`, `execution.requested`, `reasoning.completed`.

### 7. Dependencies

From `package.json`: `ai-runtime`, `ai-workforce`, `business-dna`, `decision-engine`, `domain-graph`, `institutional-memory`, `multi-agent`, `shared-kernel`, `workflow-engine` (9 dependencies).

### 8. Dependents

`ai-governance-engine`, `ai-security-engine`, `multi-agent`, `sdk` (all declare `@lateen-os/ai-brain` in `package.json`; additionally, `ai-compliance-engine` and `ai-governance-engine` type an `aiBrain` collaborator as `Pick<BrainQueries,'explainPlan'>` in their own relationship layers).

### 9. Integration Points

This package has no `relationship-management/` folder — a documented, sanctioned deviation (`ARCHITECTURE_AUDIT.md` F4): it is an Era-1 package that predates the convention, and sibling calls happen directly inside subdomain implementation files (e.g., `contextAssembler` with `decisionQueries`, `router` with `ai-runtime`'s `agentRegistry`) rather than through a centralized relationship layer — without this constituting any repository-boundary violation.

### 10. Architecture Notes

- **A real, documented circular dependency** with `multi-agent` (`DEPENDENCY_AUDIT.md` F1): `ai-brain` imports the `MissionId` type from `multi-agent`, and `multi-agent` imports the `Brain` type from `ai-brain` for an optional escalation collaborator. This is the platform's only recorded architectural defect; it has not been fixed deliberately (out of scope for any current commit) and is tracked as the highest-priority technical-debt item.
- **A real inconsistency between the certification reports and the actual source**: both `ARCHITECTURE_AUDIT.md` and `RUNTIME_AUDIT.md` (their F1 table) state the composition root is `createBrain()`, while the real, optional-deps (`deps = {}`) composition root that returns both `brain` and `queries` together is `createBrainSystem()` — and the package's own `README.md` correctly documents `createBrainSystem()`, matching the source.
- The event bus is **not** auto-created if omitted: unlike most platform packages that default to a fresh `createXEventBus()` when none is injected, `createBrain`/`createBrainSystem` never construct a default bus — every publish call is `eventBus?.publish(...)`, so if no bus is injected, no events are ever published.

### 11. Design Decisions

- Session/reflection identifiers are generated via the deterministic `generateId()`.
- Every capability (`capabilities`) can be individually overridden via `deps.capabilities`, allowing each capability to be tested in isolation without mocking libraries.
- The final plan (`finalPlan`) is computed deterministically from `validation.approved`, and only re-saved when its status actually changes.

### 12. Extension Points

Any future consumer (e.g., `ceo-engine` or a new executive-layer package) integrates with `ai-brain` only through `createBrainSystem`'s optional dependencies (`agentRegistry`, `decisionQueries`, `eventBus`) or through `BrainQueries` for read-only inspection — never by modifying this package internally.

### 13. Related Engines

[ai-runtime](./ai-runtime.md) · [ai-workforce](./ai-workforce.md) · [business-dna](./business-dna.md) · [decision-engine](./decision-engine.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [multi-agent](./multi-agent.md) · [workflow-engine](./workflow-engine.md) · [ceo-engine](./ceo-engine.md) · [sdk](./sdk.md)
