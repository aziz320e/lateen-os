---
title: CEO Engine
title_ar: محرك الرئيس التنفيذي
version: 1.0.0
status: active
package: "@lateen-os/ceo-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - sdk
---

# العربية

## الغرض

`@lateen-os/ceo-engine` هو طبقة التنسيق (orchestration) التي تُفوّض "المهام" (Missions) إلى وكلاء تنفيذيين متخصصين في Lateen OS (`seo`, `marketing`, `sales`, `product`, `operations`, `finance`). يملك دورة حياة المهمة ويوجّه كل مهمة إلى الوكيل المناسب، وينسّق التخطيط والتعيين وحالة التنفيذ، ويُسجّل النتائج مرة أخرى على المهمة — لكنه **لا ينفّذ الوكلاء أنفسهم**.

## المسؤوليات

- دورة حياة المهمة: `pending → running → completed | failed`، مدعومة بمستودع داخل الذاكرة مُنطاق حسب المنظمة (من `@lateen-os/shared-kernel`).
- تخطيط حتمي بدون اتصال: مطابقة عنوان/وصف المهمة مقابل مفردات كل وكيل، وإنتاج مهام وكيل (`AgentTask`) مرتبة، مع الرجوع إلى `operations` إن لم تُطابق أي كلمة مفتاحية.
- تعيين الوكيل الرئيسي للمهمة، بدء تنفيذها، وتطبيق نتائج الوكلاء (`AgentResult`) على دورة حياة المهمة.

## خارج نطاق المسؤولية

- لا تنفيذ فعلي للوكلاء التنفيذيين أنفسهم.
- لا استدلال ذكاء اصطناعي/نماذج لغة كبيرة — التخطيط حتمي بالكامل قائم على مطابقة كلمات مفتاحية.
- لا استمرارية تتجاوز التخزين داخل الذاكرة.
- لا UI/API/HTTP.
- **غير موصول بعد بمحرك وكلاء تنفيذيين حقيقي** — نتائج `AgentResult` تُبلَّغ حاليًا من قِبل المستدعي (caller)، وليست منتَجة من وكلاء حيّة (موثّق صراحة في `README.md` الخاص بالحزمة تحت "Status").

## وقت التشغيل العام

جذر التركيب الفعلي هو **`createCEOEngine(deps: CEOEngineDeps = {})`** في `src/ceo.ts` (وليس `createCeoEngine()` كما هو مذكور في بعض تقارير الشهادة — انظر "ملاحظات معمارية" أدناه). يُعيد كائن `CEOEngine` بالتوقيعات التالية: `submitMission`، `dispatchMission`، `reportResult`، `getMission`، `listMissions`. هذا اصطلاح تسمية من الحقبة الأولى يسبق معيار `createXRuntime()` في الحقبة الثانية، ويؤدي نفس الغرض وظيفيًا: تجميع خدمات الحزمة في سطح عام واحد.

## الاستعلامات العامة

لا يوجد مجلد `queries/` في هذه الحزمة، ولا طبقة CQRS منفصلة. القراءة تتم مباشرة عبر `getMission()` و`listMissions()` المُصدَّرتين من `CEOEngine` نفسه، فوق `MissionRepository` داخل الذاكرة.

## الأحداث المكتوبة النوع

لا يوجد. لا مجلد `events/` ولا ناقل أحداث نطاق مكتوب النوع في هذه الحزمة.

## الاعتماديات

`@lateen-os/shared-kernel` فقط (حسب `package.json`).

## الحزم المعتمِدة

`sdk` هو المعتمِد الحقيقي الوحيد الموجود حاليًا (بحث في `package.json` عبر المستودع).

## نقاط التكامل

لا يوجد مجلد `relationship-management/` ولا تكامل حقيقي مع أي حزمة شقيقة في الشيفرة المصدرية — هذا صحيح: الحزمة لا تعتمد على أي شيء سوى `shared-kernel`.

## ملاحظات معمارية

**تناقض حقيقي مُكتشف**: تقارير الشهادة (`ARCHITECTURE_AUDIT.md`، `RUNTIME_AUDIT.md`) وتوجيهات هذه المهمة التوثيقية تذكر جذر التركيب باسم `createCeoEngine()` (بحرف C وحيد كبير في "Ceo"). لكن الشيفرة المصدرية الفعلية في `src/ceo.ts` تُصدّر **`createCEOEngine()`** (بأحرف "CEO" كبيرة بالكامل). هذا فرق حالة أحرف (casing) حقيقي بين توثيق الشهادة والشيفرة الفعلية — تم توثيقه هنا كما هو، دون تعديل الشيفرة المصدرية (خارج نطاق هذه المهمة التوثيقية).

## قرارات التصميم

- التخطيط قائم على مطابقة كلمات مفتاحية حتمية بحتة، مع رجوع مضمون (`operations`) بدلًا من فشل بلا نتيجة.
- الحزمة مقسّمة إلى وحدات صغيرة واضحة المسؤولية: `types.ts`، `mission.ts` (دورة الحياة)، `planner.ts` (التخطيط)، `dispatcher.ts` (التعيين والتنفيذ)، `ceo.ts` (جذر التركيب).

## نقاط التوسعة

أي حزمة مستقبلية تريد ربط وكلاء تنفيذيين حقيقيين يجب أن تفعل ذلك عبر حقن `MissionRepository` مخصص أو باستهلاك `createCEOEngine()` العام وتزويد `AgentResult`s من منفّذ خارجي حقيقي — دون تعديل هذه الحزمة نفسها لتتوافق مع منفّذ وكلاء بعينه.

## المحركات ذات الصلة

- [Decision Engine](./decision-engine.md)

---

# English

## Purpose

`@lateen-os/ceo-engine` is the orchestration layer that delegates "missions" to Lateen OS's specialized executive agents (`seo`, `marketing`, `sales`, `product`, `operations`, `finance`). It owns the mission lifecycle and routes each mission to the right agent, coordinates planning, assignment, and execution status, and reports outcomes back onto the mission — but it **does not implement the agents themselves**.

## Responsibilities

- Mission lifecycle: `pending → running → completed | failed`, backed by an in-memory, organization-scoped repository (from `@lateen-os/shared-kernel`).
- Deterministic, offline planning: matches a mission's title/description against each agent's keyword vocabulary and produces ordered `AgentTask`s, falling back to `operations` when nothing matches.
- Assigns a mission's lead agent, starts it, and applies `AgentResult`s back onto the mission lifecycle.

## Non-responsibilities

- No implementation of the executive agents themselves.
- No LLM/AI reasoning — planning is entirely deterministic, keyword-match based.
- No persistence beyond in-memory storage.
- No UI/API/HTTP.
- **Not yet wired to a real executive-agent runtime** — `AgentResult`s are currently reported by the caller, not produced by live agents (explicitly stated in the package's own `README.md` under "Status").

## Public Runtime

The actual composition root is **`createCEOEngine(deps: CEOEngineDeps = {})`** in `src/ceo.ts` (not `createCeoEngine()` as stated in some certification reports — see "Architecture Notes" below). It returns a `CEOEngine` object with: `submitMission`, `dispatchMission`, `reportResult`, `getMission`, `listMissions`. This is an Era-1 naming convention that predates Era-2's `createXRuntime()` standard, and it serves the same functional purpose: aggregating the package's services into one public surface.

## Public Queries

There is no `queries/` folder in this package, and no separate CQRS layer. Reads happen directly through `getMission()` and `listMissions()`, exported from `CEOEngine` itself, over an in-memory `MissionRepository`.

## Typed Events

None. There is no `events/` folder and no typed domain event bus in this package.

## Dependencies

`@lateen-os/shared-kernel` only (per `package.json`).

## Dependents

`sdk` is the only real dependent currently in the workspace (verified by grepping `package.json` across the repository).

## Integration Points

No `relationship-management/` folder exists, and there is no real integration with any sibling package in the source code — this is correct: the package depends on nothing but `shared-kernel`.

## Architecture Notes

**A real inconsistency was found**: the certification reports (`ARCHITECTURE_AUDIT.md`, `RUNTIME_AUDIT.md`) and this documentation sprint's own briefing refer to the composition root as `createCeoEngine()` (single capital "C" in "Ceo"). The actual source code in `src/ceo.ts` exports **`createCEOEngine()`** (fully capitalized "CEO"). This is a real casing discrepancy between the certification documentation and the actual code — recorded here as observed, without modifying the source (out of scope for this documentation-only task).

## Design Decisions

- Planning is based purely on deterministic keyword matching, with a meaningful fallback (`operations`) rather than a no-result failure.
- The package is split into small, single-responsibility modules: `types.ts`, `mission.ts` (lifecycle), `planner.ts` (planning), `dispatcher.ts` (assignment and execution), `ceo.ts` (composition root).

## Extension Points

Any future package wanting to wire in real executive agents should do so by injecting a custom `MissionRepository` or consuming the public `createCEOEngine()` and supplying `AgentResult`s from a real external executor — without modifying this package itself to accommodate a specific executor.

## Related Engines

- [Decision Engine](./decision-engine.md)
