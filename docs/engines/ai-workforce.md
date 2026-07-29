---
title: AI Workforce Engine
title_ar: محرك القوى العاملة الرقمية
version: 1.0.0
status: active
package: "@lateen-os/ai-workforce"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-runtime
  - business-dna
  - decision-engine
  - institutional-memory
  - intelligence-engine
  - ai-brain
  - analytics-engine
  - communication-hub
  - hr-engine
  - multi-agent
  - project-management-engine
  - sdk
  - workflow-engine
---

# العربية

## القوى العاملة الرقمية (AI Workforce)

### 1. الغرض

`ai-workforce` هي الطبقة التنظيمية فوق `ai-runtime` (حزمة من الحقبة الأولى): "وقت التشغيل (`ai-runtime`) يُنفِّذ الوكلاء؛ القوى العاملة (`ai-workforce`) تُدير الموظفين الرقميين" — أي التسجيل، دورة الحياة، القدرات، السعة، التخصيص، والأداء لكل "موظف رقمي" كوحدة تنظيمية أعلى من الوكيل الفني الخام.

### 2. المسؤوليات

- سجل العمال (`WorkerRegistryService`).
- دورة حياة العامل كآلة حالة (`WorkerLifecycleService`: تعيين/تفعيل/تعليق/استئناف/تقاعد).
- محرك القدرات/المهارات (`CapabilityEngine`).
- محرك السعة (`CapacityEngine`).
- محرك التخصيص الحتمي (`AssignmentEngine`) — يُركِّب السعة والقدرات والأداء معًا.
- محرك الأداء (`PerformanceEngine`).
- طبقة استعلام وقت التشغيل (`WorkforceRuntimeQueries`) وناقل أحداث مكتوب النوع.

### 3. خارج نطاق المسؤولية

- لا تُنفِّذ الوكلاء بنفسها — التنفيذ الفعلي مسؤولية `ai-runtime`.
- لا تستدعي أي نموذج لغة كبير.
- لا تُخزِّن أي مستودع كجزء من سطحها العام.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createWorkforceRuntime(deps: WorkforceRuntimeDeps = {})` في `runtime.ts`، ويُعيد `WorkforceRuntime`:
`{ registry, lifecycle, assignment, capacity, performance, capabilities, queries, events }`.

### 5. الاستعلامات العامة

**ملاحظة دقة مهمة**: توجد واجهتا استعلام منفصلتان في هذه الحزمة:
- `WorkforceRuntimeQueries` (من `queries/runtime-queries.ts`, مبنية عبر `createWorkforceRuntimeQueries`) — هذه هي الواجهة **الفعلية** المُركَّبة والمُعادة فعليًا من `createWorkforceRuntime().queries`: `findWorkers`، `findAvailableWorkers`، `findAssignments`، `findCapabilities`، `findPerformance`، `findCapacity` (6 طرق).
- `WorkforceQueries` (من `queries/workforce-queries.ts`) — واجهة أوسع (`findWorkers`، `findTeams`، `findGoals`، `findPerformance`، `findAssignments`، `findAvailability`) **مُصدَّرة كنوع فقط من `index.ts` دون أي مصنع تنفيذ (`createWorkforceQueries`) في الشيفرة**؛ لا يوجد ملف `workforce-queries.impl.ts` في هذه الحزمة. حزم أخرى (مثل `analytics-engine`) تستهلك بالفعل `Pick<WorkforceQueries,'findWorkers'>` كنوع، لكن لا يوجد أي جذر تركيب في هذه الحزمة يُنتِج قيمة فعلية من هذا النوع بالكامل.

### 6. الأحداث المكتوبة النوع

`WORKFORCE_EVENT_NAMES` (10 أحداث): `worker.hired`/`activated`/`suspended`/`resumed`/`retired`، `assignment.created`/`completed`/`failed`، `capacity.changed`، `performance.updated`.

### 7. الاعتماديات

من `package.json`: `ai-runtime`، `business-dna`، `decision-engine`، `institutional-memory`، `intelligence-engine`، `shared-kernel` (6 اعتماديات).

### 8. الحزم المعتمِدة

`ai-brain`، `analytics-engine`، `communication-hub`، `hr-engine`، `multi-agent`، `project-management-engine`، `sdk`، `workflow-engine` (زائد `apps/business-dna-studio` و`workflows/launch-product` خارج نطاق `packages/*`).

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` — انحراف مُصرَّح به (F4 في `ARCHITECTURE_AUDIT.md`): الحزمة من الحقبة الأولى وتسبق التعارف. التكامل مع الأشقاء الحقيقيين (`ai-runtime`، `decision-engine`، `intelligence-engine`، `institutional-memory`، `business-dna`) يحدث مباشرة من داخل ملفات النطاق الفرعي بدلًا من طبقة مركزية واحدة، تحت مسمّى مختلف (وحدة `collaboration/`) لنفس الغرض.

### 10. ملاحظات معمارية

بالإضافة إلى الانحراف F4، تحتوي هذه الحزمة على تناقض داخلي حقيقي في طبقة الاستعلام نفسها (انظر القسم 5): وجود نوع `WorkforceQueries` مُصدَّر بلا أي تنفيذ فعلي مرتبط به في الشيفرة — يجب عدم الخلط بينه وبين `WorkforceRuntimeQueries` (الفعلي والمُركَّب) عند دمج حزمة جديدة معه.

### 11. قرارات التصميم

- ساعة حقن (`now`) افتراضية `nowIso`، وناقل أحداث افتراضي `createWorkforceEventBus()`.
- محرك التخصيص (`assignment`) يستقبل جميع الاعتماديات (المستودع، السعة، القدرات، الأداء، الناقل، الساعة) في كائن معامِلات واحد صريح، وليس معامِلات موضعية متسلسلة.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات القوى العاملة يجب أن تستهلك `WorkforceRuntimeQueries` الفعلية فقط (وليس `WorkforceQueries` غير المُنفَّذة)، عبر `createWorkforceRuntime()`.

### 13. المحركات ذات الصلة

[ai-runtime](./ai-runtime.md) · [business-dna](./business-dna.md) · [decision-engine](./decision-engine.md) · [institutional-memory](./institutional-memory.md) · [intelligence-engine](./intelligence-engine.md) · [ai-brain](./ai-brain.md) · [analytics-engine](./analytics-engine.md) · [communication-hub](./communication-hub.md) · [hr-engine](./hr-engine.md) · [multi-agent](./multi-agent.md) · [project-management-engine](./project-management-engine.md) · [sdk](./sdk.md) · [workflow-engine](./workflow-engine.md)

---

# English

## AI Workforce

### 1. Purpose

`ai-workforce` is the organizational layer above `ai-runtime` (an Era-1 package): "the runtime (`ai-runtime`) executes agents; the workforce (`ai-workforce`) manages digital employees" — i.e. registration, lifecycle, capabilities, capacity, assignment, and performance for each "digital employee" as an organizational unit above the raw technical agent.

### 2. Responsibilities

- The worker registry (`WorkerRegistryService`).
- Worker lifecycle as a state machine (`WorkerLifecycleService`: hire/activate/suspend/resume/retire).
- The capability/skill engine (`CapabilityEngine`).
- The capacity engine (`CapacityEngine`).
- The deterministic assignment engine (`AssignmentEngine`) — composes capacity, capability, and performance together.
- The performance engine (`PerformanceEngine`).
- A runtime query layer (`WorkforceRuntimeQueries`) and a typed event bus.

### 3. Non-responsibilities

- Does not execute agents itself — actual execution is `ai-runtime`'s responsibility.
- Never calls an LLM.
- Never exposes a repository on its public surface.

### 4. Public Runtime

The real composition root is `createWorkforceRuntime(deps: WorkforceRuntimeDeps = {})` in `runtime.ts`, returning `WorkforceRuntime`:
`{ registry, lifecycle, assignment, capacity, performance, capabilities, queries, events }`.

### 5. Public Queries

**An important accuracy note**: this package has two separate query interfaces:
- `WorkforceRuntimeQueries` (from `queries/runtime-queries.ts`, built via `createWorkforceRuntimeQueries`) — this is the interface **actually** composed and returned by `createWorkforceRuntime().queries`: `findWorkers`, `findAvailableWorkers`, `findAssignments`, `findCapabilities`, `findPerformance`, `findCapacity` (6 methods).
- `WorkforceQueries` (from `queries/workforce-queries.ts`) — a broader interface (`findWorkers`, `findTeams`, `findGoals`, `findPerformance`, `findAssignments`, `findAvailability`) **exported as a type only from `index.ts`, with no implementation factory (`createWorkforceQueries`) anywhere in the source** — there is no `workforce-queries.impl.ts` file in this package. Other packages (e.g. `analytics-engine`) do consume `Pick<WorkforceQueries,'findWorkers'>` as a type, but no composition root in this package ever produces a real value of that full type.

### 6. Typed Events

`WORKFORCE_EVENT_NAMES` (10 events): `worker.hired`/`activated`/`suspended`/`resumed`/`retired`, `assignment.created`/`completed`/`failed`, `capacity.changed`, `performance.updated`.

### 7. Dependencies

From `package.json`: `ai-runtime`, `business-dna`, `decision-engine`, `institutional-memory`, `intelligence-engine`, `shared-kernel` (6 dependencies).

### 8. Dependents

`ai-brain`, `analytics-engine`, `communication-hub`, `hr-engine`, `multi-agent`, `project-management-engine`, `sdk`, `workflow-engine` (plus `apps/business-dna-studio` and `workflows/launch-product`, outside `packages/*` scope).

### 9. Integration Points

No `relationship-management/` folder — a sanctioned deviation (F4 in `ARCHITECTURE_AUDIT.md`): an Era-1 package predating the convention. Integration with real siblings (`ai-runtime`, `decision-engine`, `intelligence-engine`, `institutional-memory`, `business-dna`) happens directly from within subdomain files rather than one centralized layer, under a differently-named module (`collaboration/`) serving the same purpose.

### 10. Architecture Notes

Beyond the F4 deviation, this package has a genuine internal inconsistency in its own query layer (see Section 5): an exported `WorkforceQueries` type with no real implementation anywhere in the source — it must not be confused with the real, composed `WorkforceRuntimeQueries` when integrating a new package with it.

### 11. Design Decisions

- An injectable clock (`now`), defaulting to `nowIso`, and a default event bus, `createWorkforceEventBus()`.
- The assignment engine (`assignment`) receives all its dependencies (repository, capacity, capability, performance, bus, clock) in one explicit dependency object rather than chained positional parameters.

### 12. Extension Points

Any future package needing workforce data should consume the real `WorkforceRuntimeQueries` only (not the unimplemented `WorkforceQueries`), via `createWorkforceRuntime()`.

### 13. Related Engines

[ai-runtime](./ai-runtime.md) · [business-dna](./business-dna.md) · [decision-engine](./decision-engine.md) · [institutional-memory](./institutional-memory.md) · [intelligence-engine](./intelligence-engine.md) · [ai-brain](./ai-brain.md) · [analytics-engine](./analytics-engine.md) · [communication-hub](./communication-hub.md) · [hr-engine](./hr-engine.md) · [multi-agent](./multi-agent.md) · [project-management-engine](./project-management-engine.md) · [sdk](./sdk.md) · [workflow-engine](./workflow-engine.md)
