---
title: Multi-Agent Collaboration Engine
title_ar: محرك التعاون متعدد الوكلاء
version: 1.0.0
status: active
package: "@lateen-os/multi-agent"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
related_packages:
  - ai-brain
  - ai-runtime
  - ai-workforce
  - business-dna
  - decision-engine
  - institutional-memory
  - shared-kernel
  - workflow-engine
---

# العربية

## الغرض

`@lateen-os/multi-agent` هو طبقة التنسيق (Coordination Layer) فوق AI Workforce في منصة Lateen OS. يُتيح لعدة عاملي ذكاء اصطناعي (CEO AI، Product Manager AI، Marketing AI، Sales AI، Operations AI، Finance AI، HR AI) التعاون على هدف عمل واحد عبر المهمات (Missions)، الفرق (Teams)، التفاوض، والإجماع — تشغيل حقيقي وحتمي وداخل الذاكرة بالكامل، محقون التبعيات.

## المسؤوليات

- سجل الوكلاء (تسجيل/إلغاء تفعيل/ضبط التوفر)، دليل الوكلاء، اكتشاف الوكلاء (أقدم مطابقة متاحة مسجلة)، ومجموعات الوكلاء.
- جلسة الوكيل: دلالة انضمام/مغادرة لمشاركة عامل حية في مهمة (بدء متكرر الاستدعاء بأمان/idempotent).
- ناقل الاتصال (محادثات، نقاشات، سجل رسائل) وتوجيه الرسائل (`send()` يُذيع لكل مشارك نشط آخر ويُعيد قائمة المستلمين الحقيقية).
- التفويض (Delegation): طلبات/استجابات بحساب حقيقي لعمق سلسلة التفويض مُطبَّق مقابل حد `maxDepth` في السياسة.
- السياق المشترك والذاكرة العاملة المشتركة (لوحة مفاتيح/قيم بنسخ لكل كتابة).
- كشف التعارض (يُعلم عند وجود مقترحين متنافسين على الأقل `submitted` في نفس النقاش) وحله (تصويت مرجّح بالدور، قرار القائد، أو تصعيد).
- سياسات التنسيق لكل مهمة (استراتيجية تصويت، حد تصعيد، عمق تفويض، سياسة بدء تلقائي).
- فرق الوكلاء، دورة حياة المهمة (آلة حالة حقيقية)، التفاوض، الإجماع (تصويت حتمي بأربع استراتيجيات + `decision_engine`)، المراجعة، التصعيد، منسّق التعاون الحقيقي، وإنهاء التنفيذ.
- طبقة استعلامات (`CollaborationQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- لا تنفيذ فعلي لمنطق الأعمال داخل الوكلاء أنفسهم — هذا من اختصاص AI Workforce وAI Runtime.
- لا استدلال ذكاء اصطناعي مباشر — الاستشارة مع `ai-brain` اختيارية ومحقونة فقط، وتقتصر على تصعيدات مستوى `'ceo_ai'`.
- لا تنفيذ فعلي لخطوات سير العمل — يُشغّل فقط مثيل `WorkflowRuntime` حقيقيًا حين يتم حقنه.

## وقت التشغيل العام

جذر التركيب هو `createMultiAgentRuntime(deps: MultiAgentRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد كائن `MultiAgentRuntime` يحوي: `agentRegistry`، `agentDirectory`، `agentDiscovery`، `agentGroups`، `sessions`، `workingMemory`، `communicationBus`، `delegation`، `negotiation`، `consensus`، `review`، `escalation`، `coordinationPolicies`، `orchestrator`، `sharedContext`، `execution`، `team`، `missions`، `conflictDetector`، `conflictResolver`، `queries`، `eventBus`، ودالة `registerAgent()`. المستودعات كلها تُبنى داخل `runtime.ts` فقط.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`CollaborationQueries`) تحتوي 10 طرق: `findMission`، `findTeams`، `findOpenNegotiations`، `findPendingReviews`، `findConsensus`، `findAgents`، `findConflicts`، `findWorkingMemory`، `findActiveSessions`، `findCoordinationPlan`.

## الأحداث المكتوبة النوع

ناقل الأحداث الفعلي (`CollaborationEventBus`، المبني في `events/collaboration-event-bus.ts`) يُصرّح بـ 14 حدثًا يُنشر فعليًا من قِبل الخدمة الحقيقية التي تُسببها: `mission.started`، `mission.completed`، `mission.escalated`، `agent.registered`، `agent.availability_changed`، `session.started`، `session.ended`، `message.routed`، `delegation.requested`، `delegation.responded`، `coordination_step.advanced`، `conflict.detected`، `conflict.resolved`، `consensus.reached`. (ملف `events/collaboration-events.ts` المنفصل يُصدّر أيضًا نوع اتحاد أضيق `CollaborationDomainEvent` بستة أحداث فقط لأغراض توثيقية/استهلاك خارجي — الناقل الفعلي المُوصَّل في `runtime.ts` يستخدم خريطة الـ 14 حدثًا أعلاه.)

## الاعتماديات

حسب `package.json`: `@lateen-os/ai-brain`، `@lateen-os/ai-runtime`، `@lateen-os/ai-workforce`، `@lateen-os/business-dna`، `@lateen-os/decision-engine`، `@lateen-os/institutional-memory`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

## الحزم المعتمِدة

`@lateen-os/ai-brain` (طرف الاعتمادية الدائرية الموثقة — انظر أدناه) و`@lateen-os/sdk` (اعتمادية معلَنة لكن غير مستخدمة فعليًا في مصدر `sdk`؛ انظر توثيق حزمة `sdk`).

## نقاط التكامل

هذه الحزمة **لا تملك مجلد `relationship-management/`** — تكاملاتها الحقيقية مع الحزم الشقيقة مضمّنة مباشرة داخل ملفات التنفيذ الفرعية بدلًا من طبقة علاقات مركزية واحدة. هذا نمط معماري معروف وموثّق في `docs/certification/KNOWN_TECHNICAL_DEBT.md` (البند 4) ويشمل تسع حزم من عصر التأسيس (Era 1)، من بينها `multi-agent` و`workflow-engine` — **لا يُعتبر خرقًا لحدود المعمارية** (كل استدعاء لا يزال يمر عبر واجهة تشغيل عامة للحزمة الشقيقة، أبدًا عبر مستودع)، وليس شيئًا يجب إصلاحه ضمن هذه المهمة التوثيقية. التكاملات الفعلية:

- **AI Runtime** — `registerAgent()` في `runtime.ts` تُقارن فعليًا مقابل `AgentRegistryService.getRegistry()` مُحقونة حين يشير الوصف إلى `runtimeAgentId`، وتطلق `AgentNotRegisteredError` إن لم يكن ذلك الوكيل مسجلًا فعلًا هناك.
- **AI Brain** — خدمة التصعيد (`escalation/service.impl.ts`) تستشير `Brain.process()` مُحقونة فقط لتصعيدات `'ceo_ai'`؛ انعكاس واثق (`!shouldRevise`) يُحل التصعيد تلقائيًا بملخص استدلال Brain نفسه، وإلا يبقى مفتوحًا لحل بشري/عامل — **هذا هو الاعتماد المتبادل الموثق الوحيد في المنصة**: `ai-brain` تستورد نوع `MissionId` من `multi-agent`، و`multi-agent` تستورد نوع `Brain` من `ai-brain` لمتعاون تصعيد اختياري محقون — انظر `docs/certification/DEPENDENCY_AUDIT.md` النتيجة F1. لم يُصلح هذا الاعتماد الدائري ضمن هذه المهمة التوثيقية ولن يُصلح هنا.
- **Workflow Engine** — منسّق التعاون (`orchestrator`) يبدأ فعليًا مثيل `WorkflowRuntime` عند انتقال خطوة تنسيق من `ready` إلى `running`، حين يُحقن كل من `WorkflowRuntime` وتخطيط خطوة-إلى-تعريف، ويعكس حالة `WorkflowInstance` الناتجة على الخطوة.
- **Shared Kernel** — كل مستودع هو `createInMemoryRepository`؛ ناقل الأحداث هو `createEventBus`.

## ملاحظات معمارية

- **اعتمادية دائرية حقيقية وموثقة مع `ai-brain`** (`ai-brain` ⇄ `multi-agent`) — العيب المعماري الوحيد المعروف في المنصة بأكملها، سابق لعصر Milestone 2، ومسجَّل في `docs/certification/DEPENDENCY_AUDIT.md` (F1) و`docs/adr/0003-no-cyclic-dependencies.md`. لا يُصلح هنا؛ إصلاحه يتطلب التزامًا (commit) مخصصًا يستخرج النوع المشترك (`Brain` أو `MissionId`) إلى طبقة أدنى.
- لا يوجد مجلد `relationship-management/` — تكامل مباشر داخل الوحدات الفرعية (`escalation/service.impl.ts`، `runtime.ts`) بدلًا من طبقة علاقات مركزية، موثّق في `KNOWN_TECHNICAL_DEBT.md`.

## قرارات التصميم

- كل متعاون شقيق محقون اختياريًا (`brain`، `runtimeAgentRegistry`، `workflowRuntime`) ومُكتوب كـ `Pick<Sibling, '...'>` ضيق النطاق حتى بدون طبقة علاقات مركزية.
- كل مستودع افتراضيًا `createInMemoryRepository` من `shared-kernel`، وناقل الأحداث اختياري يُنشأ افتراضيًا عبر `createCollaborationEventBus()`.
- استراتيجيات الإجماع الخمس (`unanimous` / `majority` / `weighted_by_role` / `leader_veto` / `decision_engine`) حتمية بالكامل — بدون نموذج تصويت احتمالي.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات تعاون متعدد الوكلاء يجب أن تستهلك `createMultiAgentRuntime()` العام فقط. **لا يجوز إصلاح الاعتمادية الدائرية مع `ai-brain` كأثر جانبي** لأي تغيير في هذه الحزمة — ذلك يتطلب التزامًا مخصصًا خاصًا به يتبع الحل الموصوف في ADR 0003.

## المحركات ذات الصلة

- [AI Brain](./ai-brain.md)
- [AI Runtime](./ai-runtime.md)
- [AI Workforce](./ai-workforce.md)
- [Business DNA](./business-dna.md)
- [Decision Engine](./decision-engine.md)
- [Institutional Memory](./institutional-memory.md)
- [Shared Kernel](./shared-kernel.md)
- [Workflow Engine](./workflow-engine.md)

---

# English

## Purpose

`@lateen-os/multi-agent` is the coordination layer above AI Workforce for Lateen OS. It lets multiple AI workers (CEO AI, Product Manager AI, Marketing AI, Sales AI, Operations AI, Finance AI, HR AI) cooperate on a single business objective through missions, teams, negotiation, and consensus — a real, deterministic, fully in-memory, dependency-injected runtime.

## Responsibilities

- Agent Registry (register/deactivate/set availability), Agent Directory, Agent Discovery (earliest-registered available match), and Agent Groups.
- Agent Session: join/leave semantics for a worker's live engagement in a mission (idempotent start).
- Communication Bus (conversations, discussions, message history) and Message Routing (`send()` broadcasts to every other active participant and returns the real recipient list).
- Delegation: requests/responses with real chain-depth computation enforced against policy `maxDepth`.
- Shared Context and Shared Working Memory (a mission-scoped key/value blackboard, versioned per write).
- Conflict Detection (flags ≥2 competing `submitted` proposals in the same discussion) and Conflict Resolution (role-weighted vote tally, leader decision, or escalation).
- Coordination Policies per mission (voting strategy, escalation threshold, delegation depth, auto-start policy).
- Agent Teams, Mission Lifecycle (a real state machine), Negotiation, Consensus (deterministic vote tallying under 4 strategies plus `decision_engine`), Review, Escalation, the real Collaboration Orchestrator, and Execution finalization.
- A `CollaborationQueries` query layer and a typed event bus.

## Non-responsibilities

- No real execution of business logic inside the agents themselves — that belongs to AI Workforce and AI Runtime.
- No direct AI inference — consulting `ai-brain` is optional and injected only, and limited to `'ceo_ai'`-level escalations.
- No real execution of workflow steps — it only genuinely starts a `WorkflowRuntime` instance when one is injected.

## Public Runtime

The composition root is `createMultiAgentRuntime(deps: MultiAgentRuntimeDeps = {})` in `src/runtime.ts`, returning a `MultiAgentRuntime` object with: `agentRegistry`, `agentDirectory`, `agentDiscovery`, `agentGroups`, `sessions`, `workingMemory`, `communicationBus`, `delegation`, `negotiation`, `consensus`, `review`, `escalation`, `coordinationPolicies`, `orchestrator`, `sharedContext`, `execution`, `team`, `missions`, `conflictDetector`, `conflictResolver`, `queries`, `eventBus`, and a `registerAgent()` function. Every repository is constructed only inside `runtime.ts`.

## Public Queries

A real `queries/` layer (`CollaborationQueries`) with 10 methods: `findMission`, `findTeams`, `findOpenNegotiations`, `findPendingReviews`, `findConsensus`, `findAgents`, `findConflicts`, `findWorkingMemory`, `findActiveSessions`, `findCoordinationPlan`.

## Typed Events

The real event bus (`CollaborationEventBus`, built in `events/collaboration-event-bus.ts`) declares 14 events, each genuinely published by the real service that causes it: `mission.started`, `mission.completed`, `mission.escalated`, `agent.registered`, `agent.availability_changed`, `session.started`, `session.ended`, `message.routed`, `delegation.requested`, `delegation.responded`, `coordination_step.advanced`, `conflict.detected`, `conflict.resolved`, `consensus.reached`. (A separate file, `events/collaboration-events.ts`, also exports a narrower `CollaborationDomainEvent` union with only 6 events for documentation/external-consumption purposes — the actual bus wired in `runtime.ts` uses the 14-event map above.)

## Dependencies

Per `package.json`: `@lateen-os/ai-brain`, `@lateen-os/ai-runtime`, `@lateen-os/ai-workforce`, `@lateen-os/business-dna`, `@lateen-os/decision-engine`, `@lateen-os/institutional-memory`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

## Dependents

`@lateen-os/ai-brain` (the other side of the documented circular dependency — see below) and `@lateen-os/sdk` (a declared dependency, but not actually imported anywhere in `sdk`'s current source — see the `sdk` engine document).

## Integration Points

This package **has no `relationship-management/` folder** — its real sibling integrations are embedded directly inside subdomain implementation files rather than centralized in one Relationship Layer. This is a known, documented architectural pattern recorded in `docs/certification/KNOWN_TECHNICAL_DEBT.md` (item 4), shared by nine Era-1 packages including `multi-agent` and `workflow-engine` — **not a boundary violation** (every call still goes through a sibling's public runtime, never a repository), and not something this documentation task is meant to fix. The real integrations:

- **AI Runtime** — `registerAgent()` in `runtime.ts` genuinely cross-validates against an injected `AgentRegistryService.getRegistry()` when the descriptor references a `runtimeAgentId`, throwing `AgentNotRegisteredError` if that runtime agent isn't actually registered there.
- **AI Brain** — the Escalation service (`escalation/service.impl.ts`) consults an injected `Brain.process()` only for `'ceo_ai'`-level escalations; a confident reflection (`!shouldRevise`) auto-resolves the escalation with Brain's own reasoning summary, otherwise it stays open for human/worker resolution — **this is the platform's one documented mutual dependency**: `ai-brain` imports the type `MissionId` from `multi-agent`, and `multi-agent` imports the type `Brain` from `ai-brain` for an optional injected escalation collaborator — see `docs/certification/DEPENDENCY_AUDIT.md` finding F1. This circular dependency is not fixed by, and will not be fixed by, this documentation task.
- **Workflow Engine** — the Collaboration Orchestrator genuinely starts a `WorkflowRuntime` instance at a coordination step's `ready → running` transition when both a `WorkflowRuntime` and a step-to-definition mapping are injected, and reflects the resulting `WorkflowInstance.status` back onto the step.
- **Shared Kernel** — every repository is `createInMemoryRepository`; the event bus is `createEventBus`.

## Architecture Notes

- **A real, documented circular dependency with `ai-brain`** (`ai-brain` ⇄ `multi-agent`) — the platform's one known architectural defect, predating Milestone 2, recorded in `docs/certification/DEPENDENCY_AUDIT.md` (F1) and `docs/adr/0003-no-cyclic-dependencies.md`. Not fixed here; fixing it requires a dedicated commit extracting the shared concept (`Brain` or `MissionId`) down into a lower layer.
- No `relationship-management/` folder — sibling integration is embedded directly in subdomain modules (`escalation/service.impl.ts`, `runtime.ts`) rather than centralized, as recorded in `KNOWN_TECHNICAL_DEBT.md`.

## Design Decisions

- Every optional sibling collaborator (`brain`, `runtimeAgentRegistry`, `workflowRuntime`) is typed as a narrow `Pick<Sibling, '...'>` slice, even without a centralized Relationship Layer.
- Every repository defaults to `createInMemoryRepository` from `shared-kernel`; the event bus is optional, defaulting to a fresh `createCollaborationEventBus()`.
- All five consensus strategies (`unanimous` / `majority` / `weighted_by_role` / `leader_veto` / `decision_engine`) are fully deterministic — no probabilistic voting model.

## Extension Points

Any future package needing multi-agent collaboration data should consume only the public `createMultiAgentRuntime()`. **The circular dependency with `ai-brain` must never be fixed as a side effect** of any change to this package — that requires its own dedicated commit following the remedy prescribed in ADR 0003.

## Related Engines

- [AI Brain](./ai-brain.md)
- [AI Runtime](./ai-runtime.md)
- [AI Workforce](./ai-workforce.md)
- [Business DNA](./business-dna.md)
- [Decision Engine](./decision-engine.md)
- [Institutional Memory](./institutional-memory.md)
- [Shared Kernel](./shared-kernel.md)
- [Workflow Engine](./workflow-engine.md)
