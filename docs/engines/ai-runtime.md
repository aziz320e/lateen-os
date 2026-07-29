---
title: AI Runtime Engine
title_ar: محرك وقت تشغيل الذكاء الاصطناعي
version: 1.0.0
status: active
package: "@lateen-os/ai-runtime"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/08_PROJECT_STATUS.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-provider-hub
  - ai-brain
  - ai-workforce
  - decision-engine
  - intelligence-engine
  - business-dna
  - domain-graph
  - institutional-memory
  - capability-engine
  - ai-security-engine
  - ai-governance-engine
  - api-gateway
  - multi-agent
  - workflow-engine
  - sdk
---

# العربية

## وقت تشغيل الذكاء الاصطناعي (AI Runtime)

### 1. الغرض

`ai-runtime` هو "نظام تشغيل وكلاء الذكاء الاصطناعي" في Lateen OS (حزمة من الحقبة الأولى): يدير دورة حياة الوكيل الكاملة — المحادثة، قائمة/مُنفِّذ المهام، إطار تنفيذ الأدوات، المخطِّط، الذاكرة العاملة، الجدولة، التنسيق، سجل الوكلاء — وطبقة استعلام موحّدة.

### 2. المسؤوليات

- سجل الوكلاء ودورة حياتهم (`AgentRegistryService`).
- حالة جلسة وقت التشغيل (`RuntimeSession`).
- قائمة/مُنفِّذ المهام (`TaskQueueService`، `TaskExecutor`).
- خطط ونتائج التنفيذ (`ExecutionPlan`، `ExecutionResult`).
- وقت تشغيل المحادثة (`ConversationRuntimeService`) — المستهلك الحقيقي الوحيد (مع المخطِّط) لـ `ai-provider-hub` من أجل استدلال فعلي.
- الذاكرة العاملة (`WorkingMemoryService`)، سياق الوكيل.
- المخطِّط (`Planner`)، الجدولة (`Scheduler`)، التنسيق (`Orchestrator` لتدفقات متعددة الوكلاء).
- إطار تنفيذ الأدوات (`ToolExecutionFramework`)، تحميل/عرض المطالبات (`PromptLoader`/`renderPrompt`).
- طبقة استعلام موحّدة (`createRuntimeQueries`) وناقل أحداث مكتوب النوع (`createRuntimeEventBus`).

### 3. خارج نطاق المسؤولية

- لا تقرر متى يُنفَّذ شيء — هذا دور `ai-brain` عبر `workflow-engine`/`multi-agent`.
- لا تُخزِّن بيانات دائمة خارج المستودعات داخل الذاكرة لكل نطاق فرعي.
- لا تُعرِّف سياسات الأمن أو الحوكمة بنفسها — `ai-security-engine`/`ai-governance-engine` تستهلكان سطحها القرائي فقط عبر أنواع `Pick<RuntimeQueries, '...'>` ضيقة.
- باستثناء المحادثة والمخطِّط، بقية الحزمة حتمية بالكامل وقابلة للاستخدام دون مزوّد حي.

### 4. وقت التشغيل العام

**انحراف مُصرَّح به وموثَّق**: لا يوجد جذر تركيب موحّد واحد (`createXRuntime()`). بدلًا من ذلك، تُصدِّر الحزمة مصانع على مستوى الوحدة لكل نطاق فرعي — من أبرزها: `createAgentRegistryService`، `createConversationRuntimeService`، `createTaskQueueService`، `createTaskExecutor`، `createPlanner`، `createScheduler`، `createOrchestrator`، `createToolExecutionFramework` — بالإضافة إلى طبقة استعلام موحّدة `createRuntimeQueries(deps)` وناقل أحداث موحّد `createRuntimeEventBus()`. هذا موثَّق صراحةً في `docs/handbook/08_PROJECT_STATUS.md` §21 و`docs/certification/ARCHITECTURE_AUDIT.md` F3: الحزمة مُصمَّمة كمجموعة قدرات قابلة للتركيب الجزئي من قِبل مستهلك (وعلى رأسه `ai-brain`)، وليس ككتلة واحدة. **لا يجوز اعتبار هذا خللًا أو محاولة "إصلاحه" بفرض غلاف Runtime.**

### 5. الاستعلامات العامة

`RuntimeQueries` (من `queries/runtime-queries.ts`): `findAgent`، `findTasks`، `findSessions`، `findConversations`، `findRuntimeState`، `findExecutionHistory` (6 طرق).

### 6. الأحداث المكتوبة النوع

`createRuntimeEventBus()` يبني `RuntimeEventMap` يغطي فقط: `conversation.started`/`message_added`، `task.queued`/`assigned`/`started`/`completed`/`failed`، `orchestration.started`/`paused`/`resumed`/`cancelled` (11 مفتاحًا).
**ملاحظة دقة مهمة**: تعليق الكود في `events/runtime-event-bus.ts` نفسه ينص صراحةً على أن هذه الخريطة **ليست شاملة** مقارنةً باتحاد `AiRuntimeDomainEvent` المُعرَّف في `events/index.ts` عبر 16 نطاقًا فرعيًا (وكيل، سجل، جلسة، مهمة، تنفيذ، محادثة، ذاكرة، سياق، مخطِّط، جدولة، تنسيق، تواصل، أدوات، صلاحيات، مراقبة، تيليمتري) — "معظمها بلا ناشر حتى الآن" (نص التعليق حرفيًا). هذا يُشكِّل **تناقضًا حقيقيًا** مع ادعاء `docs/AI_PROJECT_CONTEXT.md` §8 بأنه "لا توجد إعلانات أحداث تطلعية/غير مستخدمة في أي مكان بالكود القاعدي (تم التحقق في الالتزام 35)" — إذ إن حزمة `ai-runtime` نفسها توثِّق بوضوح وجود مثل هذه الفجوة.

### 7. الاعتماديات

من `package.json`: `ai-provider-hub`، `business-dna`، `capability-engine`، `decision-engine`، `domain-graph`، `institutional-memory`، `intelligence-engine`، `shared-kernel` (8 اعتماديات، زائد `zod` خارجية).

### 8. الحزم المعتمِدة

ضمن `packages/*`: `ai-brain`، `ai-governance-engine`، `ai-security-engine`، `ai-workforce`، `api-gateway`، `marketplace`، `multi-agent`، `observability-engine`، `sdk`، `workflow-engine` — نمو حقيقي عن عدد "8" المُسجَّل في مصفوفة محركات المرحلة 1 (`08_PROJECT_STATUS.md`) بعد انضمام مستهلكي الحقبة الثانية (`api-gateway`، `marketplace`).

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` — انحراف مُصرَّح به (F4)، الحزمة من الحقبة الأولى وتسبق التعارف. المستهلكون الأشقاء يدمجون معها عبر النمط الضيق الموثَّق `Pick<RuntimeQueries, '...'>` (مثل `findAgent` في `ai-security-engine`/`ai-governance-engine`/`analytics-engine`/`api-gateway`/`admin-console`).

### 10. ملاحظات معمارية

الانحراف المُصرَّح به F3 (القسم 4)، بالإضافة إلى فجوة الأحداث التطلعية الموثَّقة أعلاه (القسم 6) — كلاهما حقيقي وموثَّق في مصدر الحزمة نفسها.

### 11. قرارات التصميم

`conversation`/`planner` هما النطاقان الفرعيان الوحيدان اللذان يستدعيان `ai-provider-hub` لاستدلال حقيقي، حسب تعليق التوثيق الرسمي أعلى الحزمة؛ كل شيء آخر حتمي بالكامل وقابل للاختبار دون شبكة.

### 12. نقاط التوسعة

يُركِّب المستهلك فقط المصانع التي يحتاجها فعليًا (مثل `createAgentRegistryService` + `createRuntimeQueries`) بدلًا من كائن تشغيل واحد — يجب على أي حزمة جديدة اتباع نفس نمط `Pick<RuntimeQueries, '...'>` الضيق المُستخدَم بالفعل في `ai-security-engine`، `ai-governance-engine`، `analytics-engine`، `api-gateway`، `admin-console`، `marketplace`.

### 13. المحركات ذات الصلة

[ai-provider-hub](./ai-provider-hub.md) · [ai-brain](./ai-brain.md) · [ai-workforce](./ai-workforce.md) · [decision-engine](./decision-engine.md) · [intelligence-engine](./intelligence-engine.md) · [business-dna](./business-dna.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [capability-engine](./capability-engine.md) · [ai-security-engine](./ai-security-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [api-gateway](./api-gateway.md) · [multi-agent](./multi-agent.md) · [workflow-engine](./workflow-engine.md) · [sdk](./sdk.md)

---

# English

## AI Runtime

### 1. Purpose

`ai-runtime` is Lateen OS's "operating system for AI agents" (an Era-1 package): it manages the complete agent lifecycle — conversation, task queue/executor, tool execution framework, planner, working memory, scheduler, orchestrator, agent registry — and a unified query layer.

### 2. Responsibilities

- The agent registry and lifecycle (`AgentRegistryService`).
- Runtime session state (`RuntimeSession`).
- The task queue/executor (`TaskQueueService`, `TaskExecutor`).
- Execution plans and results (`ExecutionPlan`, `ExecutionResult`).
- The conversation runtime (`ConversationRuntimeService`) — the only real consumer (along with the planner) of `ai-provider-hub` for genuine inference.
- Working memory (`WorkingMemoryService`), agent context.
- The planner (`Planner`), the scheduler (`Scheduler`), the orchestrator (`Orchestrator` for multi-agent workflows).
- The tool execution framework (`ToolExecutionFramework`), prompt loading/rendering (`PromptLoader`/`renderPrompt`).
- A unified query layer (`createRuntimeQueries`) and a typed event bus (`createRuntimeEventBus`).

### 3. Non-responsibilities

- Does not decide when something executes — that is `ai-brain`'s role, via `workflow-engine`/`multi-agent`.
- Holds no durable data beyond each subdomain's own in-memory repositories.
- Does not define security or governance policy itself — `ai-security-engine`/`ai-governance-engine` only consume its read surface through narrow `Pick<RuntimeQueries, '...'>` types.
- Except for conversation and the planner, the rest of the package is fully deterministic and usable without a live provider.

### 4. Public Runtime

**A sanctioned, documented deviation**: there is no single unified composition root (`createXRuntime()`). Instead, the package exports module-level factories per subdomain — most notably `createAgentRegistryService`, `createConversationRuntimeService`, `createTaskQueueService`, `createTaskExecutor`, `createPlanner`, `createScheduler`, `createOrchestrator`, `createToolExecutionFramework` — plus a unified query layer `createRuntimeQueries(deps)` and a unified event bus `createRuntimeEventBus()`. This is explicitly documented in `docs/handbook/08_PROJECT_STATUS.md` §21 and `docs/certification/ARCHITECTURE_AUDIT.md` F3: the package is designed as a set of partially composable capabilities for a consumer (chiefly `ai-brain`), not as one monolithic block. **This must not be treated as a defect or "fixed" by forcing a Runtime wrapper onto it.**

### 5. Public Queries

`RuntimeQueries` (from `queries/runtime-queries.ts`): `findAgent`, `findTasks`, `findSessions`, `findConversations`, `findRuntimeState`, `findExecutionHistory` (6 methods).

### 6. Typed Events

`createRuntimeEventBus()` builds a `RuntimeEventMap` covering only: `conversation.started`/`message_added`, `task.queued`/`assigned`/`started`/`completed`/`failed`, `orchestration.started`/`paused`/`resumed`/`cancelled` (11 keys).
**An important accuracy note**: the code comment in `events/runtime-event-bus.ts` itself explicitly states this map is **not exhaustive** relative to the `AiRuntimeDomainEvent` union declared in `events/index.ts` across 16 subdomains (agent, registry, runtime, task, execution, conversation, memory, context, planner, scheduler, orchestrator, communication, tooling, permissions, monitoring, telemetry) — "most of which have no publisher yet" (the comment's literal wording). This constitutes a **real inconsistency** with `docs/AI_PROJECT_CONTEXT.md` §8's claim that "there are no aspirational/unused event declarations anywhere in the codebase (verified in Commit 35)" — `ai-runtime`'s own source clearly documents exactly such a gap.

### 7. Dependencies

From `package.json`: `ai-provider-hub`, `business-dna`, `capability-engine`, `decision-engine`, `domain-graph`, `institutional-memory`, `intelligence-engine`, `shared-kernel` (8 dependencies, plus external `zod`).

### 8. Dependents

Within `packages/*`: `ai-brain`, `ai-governance-engine`, `ai-security-engine`, `ai-workforce`, `api-gateway`, `marketplace`, `multi-agent`, `observability-engine`, `sdk`, `workflow-engine` — real growth beyond the "8" recorded in the Phase-1 Engine Matrix (`08_PROJECT_STATUS.md`) after Era-2 consumers (`api-gateway`, `marketplace`) joined.

### 9. Integration Points

No `relationship-management/` folder — a sanctioned deviation (F4); the package predates the convention. Sibling consumers integrate through the documented narrow `Pick<RuntimeQueries, '...'>` pattern (e.g. `findAgent` in `ai-security-engine`/`ai-governance-engine`/`analytics-engine`/`api-gateway`/`admin-console`).

### 10. Architecture Notes

The sanctioned F3 deviation (Section 4), plus the documented aspirational-events gap noted above (Section 6) — both real and documented in the package's own source.

### 11. Design Decisions

`conversation`/`planner` are the only two subdomains that call `ai-provider-hub` for real inference, per the package's own top-level doc comment; everything else is fully deterministic and testable offline.

### 12. Extension Points

A consumer composes only the specific factories it actually needs (e.g., `createAgentRegistryService` + `createRuntimeQueries`) rather than one runtime object — any new package should follow the same narrow `Pick<RuntimeQueries, '...'>` pattern already used by `ai-security-engine`, `ai-governance-engine`, `analytics-engine`, `api-gateway`, `admin-console`, `marketplace`.

### 13. Related Engines

[ai-provider-hub](./ai-provider-hub.md) · [ai-brain](./ai-brain.md) · [ai-workforce](./ai-workforce.md) · [decision-engine](./decision-engine.md) · [intelligence-engine](./intelligence-engine.md) · [business-dna](./business-dna.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [capability-engine](./capability-engine.md) · [ai-security-engine](./ai-security-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [api-gateway](./api-gateway.md) · [multi-agent](./multi-agent.md) · [workflow-engine](./workflow-engine.md) · [sdk](./sdk.md)
