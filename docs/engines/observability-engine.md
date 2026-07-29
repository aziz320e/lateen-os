---
title: Observability Engine
title_ar: محرك المراقبة (Observability)
version: 1.0.0
status: active
package: "@lateen-os/observability-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-runtime
  - workflow-engine
  - communication-hub
  - ai-security-engine
  - ai-governance-engine
  - ai-compliance-engine
  - analytics-engine
---

# العربية

## الغرض

`@lateen-os/observability-engine` هو منصة المراقبة (Observability Platform) — طبقة الرؤية التشغيلية القانونية لنظام Lateen OS. يملك التسجيل المُهيكل (Structured Logging)، مُجمّع المقاييس (Metrics)، التتبع الموزّع (Distributed Tracing)، محرك الصحة (Health)، محرك التنبيهات (Alerting)، محرك الأداء (Performance)، الخط الزمني للتدقيق (Audit Timeline)، ومحرك اللقطات (Snapshot) — وهو الحزمة التي تقرأ من AI Runtime وWorkflow Engine وCommunication Hub وAI Security Engine وAI Governance Engine وAI Compliance Engine وAnalytics Engine، حصرًا عبر الواجهة العامة لكل حزمة. هذه الحزمة تُنتج رؤية للقراءة فقط — لا تكتب أبدًا رجوعًا إلى أي محرك مُدمَج.

## المسؤوليات

- التسجيل المُهيكل: ستة مستويات (trace/debug/info/warn/error/fatal) بحقول مُهيكلة ونطاقات وفئات ومعرّفات ارتباط (correlation ids).
- مُجمّع المقاييس: عدادات تراكمية، مقاييس لحظية (gauges)، مدرّجات تكرارية (histograms)، مؤقتات، ومتوسطات متحركة.
- التتبع الموزّع: آثار (traces) وامتدادات (spans) متداخلة، بربط أب/ابن، مدة، وحالة.
- محرك الصحة: صحة مكوّن مُبلَّغ ذاتيًا، بالإضافة إلى صحة اعتماديات حقيقية من AI Runtime وWorkflow Engine.
- محرك التنبيهات: تنبيهات حتمية — عتبة خطأ، عتبة تحذير، عدم نشاط، تدهور صحة، فشل سير عمل، أحداث أمنية.
- محرك الأداء: زمن التنفيذ، زمن انتظار الطابور، مدة سير العمل، إنتاجية الرسائل، استغلال وقت التشغيل — بتكامل حقيقي مع AI Runtime وWorkflow Engine وCommunication Hub.
- الخط الزمني للتدقيق: يُجمّع أحداث تدقيق حقيقية من الأمن والحوكمة والامتثال وسير العمل والاتصالات في عرض زمني واحد.
- محرك اللقطات: لقطات حتمية لوقت التشغيل وسير العمل والاتصالات والتحليلات والأمن.
- طبقة علاقات (`relationship-management`) تُضيف إشارة حقيقية إضافية واحدة لكل حزمة من السبع المُدمجة.
- طبقة استعلامات (`ObservabilityQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- لا كتابة رجوعًا إلى أي محرك مُدمَج — رؤية للقراءة فقط دومًا.
- لا نموذج لغة كبير في أي مكان بهذه الحزمة — كل رقم سجل/مقياس/أثر/تنبيه/أداء حساب ثابت فوق بيانات حقيقية.
- لا تعديل لأي من الحزم السبع الشقيقة لخدمة هذه الحزمة.

## وقت التشغيل العام

جذر التركيب هو `createObservabilityRuntime(deps: ObservabilityRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد كائن `ObservabilityRuntime` يحوي: `logging`، `metrics`، `tracing`، `health`، `alerts`، `performance`، `auditTimeline`، `snapshots`، `relationships`، `queries`، و`events`. المستودعات الثمانية تُبنى داخل `runtime.ts` فقط ولا تظهر أبدًا على السطح العام المُعاد.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`ObservabilityQueries`) تحتوي: `findLogs`، `findMetrics`، `findTraces`، `findAlerts`، `findSnapshots`، `findHealth`، `findPerformance`، `searchObservability`.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`ObservabilityEventMap`، 7 أحداث)، كل حدث منشور فعليًا من قِبل الخدمة الحقيقية التي تُسببه: `log.created`، `metric.updated`، `trace.completed`، `alert.created`، `alert.resolved`، `health.changed`، `snapshot.created`.

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel`، وكمتعاونين اختياريين حقيقيين: `@lateen-os/ai-runtime` (صحة/أداء/لقطات/طبقة علاقات)، `@lateen-os/workflow-engine` (صحة/تنبيهات/أداء/خط زمني/لقطات/طبقة علاقات؛ أيضًا مصدر `OrganizationId` المُعاد استخدامه)، `@lateen-os/communication-hub` (أداء/خط زمني/لقطات/طبقة علاقات)، `@lateen-os/ai-security-engine` (تنبيهات/خط زمني/لقطات/طبقة علاقات)، `@lateen-os/ai-governance-engine` (خط زمني/طبقة علاقات)، `@lateen-os/ai-compliance-engine` (خط زمني/طبقة علاقات)، `@lateen-os/analytics-engine` (لقطات/طبقة علاقات).

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`، تعتمد عليها: `@lateen-os/admin-console`، `@lateen-os/api-gateway`، `@lateen-os/marketplace` (`@lateen-os/marketplace-engine`).

## نقاط التكامل

مجلد `relationship-management/` حقيقي يُضيف إشارة حقيقية إضافية واحدة مميزة لكل حزمة من السبع، بحيث تُمارَس كل نقطة تكامل دون تكرار للمنطق مع الوحدات الأخرى التي تُكامل مع نفس الحزمة لغرض مختلف:

- **AI Runtime** — محرك الصحة (`findRuntimeState`)، محرك الأداء (`findExecutionHistory`، `findTasks`، `findRuntimeState`)، محرك اللقطات (`findRuntimeState`)، طبقة العلاقات (`findAgent`).
- **Workflow Engine** — محرك الصحة (`findRunningWorkflows`)، محرك التنبيهات (`findRunningWorkflows`)، محرك الأداء (`findRunningWorkflows`)، الخط الزمني (`findRunningWorkflows`)، محرك اللقطات (`findRunningWorkflows`)، طبقة العلاقات (`findWaitingTasks`).
- **Communication Hub** — محرك الأداء (`findMessages`)، الخط الزمني (`findTimeline`)، محرك اللقطات (`findMessages`، `findTimeline`)، طبقة العلاقات (`findNotifications`).
- **AI Security Engine** — محرك التنبيهات (`findViolations`)، الخط الزمني (`findViolations`)، محرك اللقطات (`findViolations`، `findThreats`)، طبقة العلاقات (`findPolicies`).
- **AI Governance Engine** — الخط الزمني (`findGovernanceEvents`)، طبقة العلاقات (`findApprovals`).
- **AI Compliance Engine** — الخط الزمني (`findAudits`)، طبقة العلاقات (`findFrameworks`).
- **Analytics Engine** — محرك اللقطات (`findKPIs`)، طبقة العلاقات (`findDashboards`).

كل متعاون اختياري يتدهور إلى قيمة فارغة موثقة (`null`، `0`، أو مجموعة فارغة) عند عدم حقنه، فتبقى منصة المراقبة قابلة للاستخدام والاختبار الكامل دون اتصال.

## ملاحظات معمارية

- الحزمة الوحيدة في المنصة التي تُكامل مع سبع حزم شقيقة مختلفة، كل منها عبر أكثر من نقطة تكامل واحدة موزعة عبر الوحدات التي تملك المسؤولية الطبيعية لها (بدلًا من تركيز كل التكامل في `relationship-management` فقط).
- طبقة العلاقات نفسها تُضيف إشارة واحدة إضافية ومميزة لكل حزمة فقط، لتجنب تكرار المنطق الموجود أصلًا في الوحدات الأخرى.
- لا نموذج لغة كبير في أي مكان بهذه الحزمة.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية.
- كل متعاون شقيق مُكتوب كـ `Pick<SiblingRuntime, '...'>` ضيق النطاق — أبدًا النوع الكامل للتشغيل، وأبدًا مستودع.
- أسماء الأحداث تتبع اصطلاح `noun.verb` بصيغة الماضي.

## نقاط التوسعة

أي حزمة مستقبلية تريد رؤية بيانات مراقبة يجب أن تستهلك `createObservabilityRuntime()` العام فقط (أو أنواعه المُصدَّرة مثل `LogEntry`، `Alert`، `ObservabilitySnapshot`). أي حزمة شقيقة جديدة تريد أن تُصبح مصدر إشارة لمنصة المراقبة تنضم كمتعاون اختياري جديد في `ObservabilityRuntimeDeps` عبر التزام (commit) مخصص لهذه الحزمة نفسها — لا يجوز أبدًا تعديل الحزمة الشقيقة لخدمة هذا التكامل.

## المحركات ذات الصلة

- [AI Runtime](./ai-runtime.md)
- [Workflow Engine](./workflow-engine.md)
- [Communication Hub](./communication-hub.md)
- [AI Security Engine](./ai-security-engine.md)
- [AI Governance Engine](./ai-governance-engine.md)
- [AI Compliance Engine](./ai-compliance-engine.md)
- [Analytics Engine](./analytics-engine.md)

---

# English

## Purpose

`@lateen-os/observability-engine` is the Observability Platform — the canonical runtime-visibility layer for Lateen OS. It owns Structured Logging, the Metrics Collector, Distributed Tracing, the Health Engine, the Alert Engine, the Performance Engine, the Audit Timeline, and the Snapshot Engine — and is the package that reads from AI Runtime, Workflow Engine, Communication Hub, AI Security Engine, AI Governance Engine, AI Compliance Engine, and Analytics Engine, exclusively through each package's public API. This package produces read-only visibility — it never writes back to any integrated engine.

## Responsibilities

- Structured Logging: six levels (trace/debug/info/warn/error/fatal) with structured fields, scopes, categories, and correlation ids.
- Metrics Collector: cumulative counters, gauges, histograms, timers, and moving averages.
- Distributed Tracing: traces and nested spans, with parent/child linkage, duration, and status.
- Health Engine: self-reported component health plus real dependency health from AI Runtime and Workflow Engine.
- Alert Engine: deterministic alerts — error threshold, warning threshold, inactivity, health degradation, workflow failures, security events.
- Performance Engine: execution time, queue latency, workflow duration, message throughput, runtime utilization — with real AI Runtime, Workflow Engine, and Communication Hub integration.
- Audit Timeline: aggregates real audit events from Security, Governance, Compliance, Workflow, and Communication into one chronological view.
- Snapshot Engine: deterministic snapshots for runtime, workflows, communications, analytics, and security.
- A `relationship-management` layer adding one additional, distinct real signal per integrated package.
- An `ObservabilityQueries` query layer and a typed event bus.

## Non-responsibilities

- No write-back to any integrated engine — always read-only visibility.
- No LLM anywhere in this package — every log/metric/trace/alert/performance figure is a fixed computation over real data.
- No modification of any of the 7 sibling packages to accommodate this package.

## Public Runtime

The composition root is `createObservabilityRuntime(deps: ObservabilityRuntimeDeps = {})` in `src/runtime.ts`, returning an `ObservabilityRuntime` object with: `logging`, `metrics`, `tracing`, `health`, `alerts`, `performance`, `auditTimeline`, `snapshots`, `relationships`, `queries`, and `events`. All eight repositories are constructed only inside `runtime.ts` and never appear on the returned surface.

## Public Queries

A real `queries/` layer (`ObservabilityQueries`) exposes: `findLogs`, `findMetrics`, `findTraces`, `findAlerts`, `findSnapshots`, `findHealth`, `findPerformance`, `searchObservability`.

## Typed Events

A real event bus (`ObservabilityEventMap`, 7 events), each genuinely published by the real service that causes it: `log.created`, `metric.updated`, `trace.completed`, `alert.created`, `alert.resolved`, `health.changed`, `snapshot.created`.

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel`, plus these real, optional collaborators: `@lateen-os/ai-runtime` (Health/Performance/Snapshot/Relationship Layer), `@lateen-os/workflow-engine` (Health/Alert/Performance/Audit-Timeline/Snapshot/Relationship Layer; also the source of the reused `OrganizationId`), `@lateen-os/communication-hub` (Performance/Audit-Timeline/Snapshot/Relationship Layer), `@lateen-os/ai-security-engine` (Alert/Audit-Timeline/Snapshot/Relationship Layer), `@lateen-os/ai-governance-engine` (Audit-Timeline/Relationship Layer), `@lateen-os/ai-compliance-engine` (Audit-Timeline/Relationship Layer), `@lateen-os/analytics-engine` (Snapshot/Relationship Layer).

## Dependents

Verified by grepping every `package.json`: `@lateen-os/admin-console`, `@lateen-os/api-gateway`, and `@lateen-os/marketplace` (`@lateen-os/marketplace-engine`) depend on it.

## Integration Points

A real `relationship-management/` folder adds one additional, distinct real signal per one of the 7 packages, so every integration point is genuinely exercised without duplicating logic already present elsewhere:

- **AI Runtime** — Health Engine (`findRuntimeState`), Performance Engine (`findExecutionHistory`, `findTasks`, `findRuntimeState`), Snapshot Engine (`findRuntimeState`), Relationship Layer (`findAgent`).
- **Workflow Engine** — Health Engine (`findRunningWorkflows`), Alert Engine (`findRunningWorkflows`), Performance Engine (`findRunningWorkflows`), Audit Timeline (`findRunningWorkflows`), Snapshot Engine (`findRunningWorkflows`), Relationship Layer (`findWaitingTasks`).
- **Communication Hub** — Performance Engine (`findMessages`), Audit Timeline (`findTimeline`), Snapshot Engine (`findMessages`, `findTimeline`), Relationship Layer (`findNotifications`).
- **AI Security Engine** — Alert Engine (`findViolations`), Audit Timeline (`findViolations`), Snapshot Engine (`findViolations`, `findThreats`), Relationship Layer (`findPolicies`).
- **AI Governance Engine** — Audit Timeline (`findGovernanceEvents`), Relationship Layer (`findApprovals`).
- **AI Compliance Engine** — Audit Timeline (`findAudits`), Relationship Layer (`findFrameworks`).
- **Analytics Engine** — Snapshot Engine (`findKPIs`), Relationship Layer (`findDashboards`).

Every optional collaborator degrades to a documented no-op (`null`, `0`, or an empty collection) when not injected, so the Observability Platform stays fully usable — and fully tested — completely offline.

## Architecture Notes

- The one package on the platform integrating with seven distinct sibling packages, each through more than one integration point distributed across the module that naturally owns it (rather than centralizing every integration in `relationship-management` alone).
- The Relationship Layer itself adds only one additional, distinct signal per package, avoiding duplication of logic already present in the other modules.
- No LLM anywhere in this package.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to a deterministic `nowIso`.
- Every sibling collaborator is typed as a narrow `Pick<SiblingRuntime, '...'>` slice — never the sibling's whole runtime type, never a repository.
- Event names follow the `noun.verb` past-tense convention.

## Extension Points

Any future package wanting observability data should consume only the public `createObservabilityRuntime()` (or its exported types, such as `LogEntry`, `Alert`, `ObservabilitySnapshot`). Any new sibling package wanting to become a signal source for the Observability Platform joins as a new optional collaborator in `ObservabilityRuntimeDeps` through a dedicated commit scoped to this package — the sibling package must never be modified to accommodate this integration.

## Related Engines

- [AI Runtime](./ai-runtime.md)
- [Workflow Engine](./workflow-engine.md)
- [Communication Hub](./communication-hub.md)
- [AI Security Engine](./ai-security-engine.md)
- [AI Governance Engine](./ai-governance-engine.md)
- [AI Compliance Engine](./ai-compliance-engine.md)
- [Analytics Engine](./analytics-engine.md)
