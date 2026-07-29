---
title: Capability Engine
title_ar: محرك القدرات
version: 1.0.0
status: active
package: "@lateen-os/capability-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/KNOWN_TECHNICAL_DEBT.md
related_packages:
  - business-dna
  - domain-graph
  - decision-engine
---

# العربية

## الغرض

`@lateen-os/capability-engine` يمثّل ما تستطيع الشركة فعله فعليًا، بمعزل عن أي آلة محددة. الـ **القدرة (Capability)** هي وصف مجرد لقدرة إنتاجية (مثل الطباعة بالأشعة فوق البنفسجية، القطع بالليزر، التركيب الميداني)، وتُقدَّم من قِبل آلة أو أكثر، ويحتاجها منتج أو أكثر، ويستهلكها خدمة أو أكثر. هذا يفصل "ما يمكننا فعله" عن "أي آلة تفعله"، مما يمكّن تخطيط الطاقة الإنتاجية وتحليل الفجوات دون ربط مباشر بالعتاد.

هذه حزمة دعم منصّي (platform-support) من الحقبة الأولى (Era 1) وتسبق اصطلاح `relationship-management/` + `queries/` + `runtime.ts` — وهي حقيقية وتعمل فعليًا، لكن شكلها الداخلي لا يطابق حزم الحقبة الثانية (Era 2). هذا ليس عيبًا يتطلب "إصلاحًا"، بل دَين تقني موثّق في `docs/certification/KNOWN_TECHNICAL_DEBT.md`.

## المسؤوليات

- تعريف تجميع القدرة (`Capability`) وفئاتها وحالاتها.
- تعريف علاقات: آلة↔قدرة (`MachineCapability`)، منتج↔قدرة (`ProductCapability`)، خدمة↔قدرة (`ServiceCapability`).
- توفير منافذ مستودع (Repository ports) لكل من هذه الأربعة تجميعات.
- توفير **عقد** استعلام (`CapabilityQueries`) لتحليل القدرات عبر التجميعات — بدون تنفيذ فعلي داخل هذه الحزمة نفسها.

## خارج نطاق المسؤولية

- **لا تنفيذ فعلي لطبقة الاستعلامات**: `queries/capability-queries.ts` عقد فقط؛ التعليق التوثيقي في الملف نفسه يذكر صراحة أن "التنفيذ يعيش خارج هذه الحزمة (طبقة البنية التحتية/التطبيق)". لا يوجد ملف `*.impl.ts` لأي استعلام في هذه الحزمة.
- لا ناقل أحداث نطاق مكتوب النوع: لا يوجد مجلد `events/` في هذه الحزمة على الإطلاق.
- لا جذر تركيب (`runtime.ts` أو ما يعادله): هذا صحيح معماريًا وليس نقصًا — الحزمة تُصدّر عقود تعريف/تسجيل قدرات دون معاونين (collaborators) محقونين أو حالة تحتاج إلى تركيب.
- **لا مجموعة اختبارات على الإطلاق** — فجوة حقيقية وموثقة في `KNOWN_TECHNICAL_DEBT.md` (البند 3)، على عكس حزم أخرى في المنصة.
- لا UI، لا API/HTTP، لا قاعدة بيانات/ORM، لا منطق أعمال يتجاوز تعريفات الأنواع.

## وقت التشغيل العام

**لا يوجد** جذر تركيب في هذه الحزمة (لا `runtime.ts` ولا دالة `createXRuntime`-معادلة). هذا صحيح معماريًا: الحزمة تُصدّر أنواعًا وواجهات تسجيل قدرات بدون أي حالة أو معاونين يحتاجون إلى التوصيل معًا — لا يوجد شيء "ليُركَّب".

## الاستعلامات العامة

يوجد عقد `CapabilityQueries` حقيقي في `src/queries/capability-queries.ts` بالتوقيعات التالية: `findCapabilitiesByMachine`، `findCapabilitiesByProduct`، `findProductsByCapability`، `findMachinesByCapability`، `findServicesByCapability`، `findUnusedCapabilities`، `findMissingCapabilities`، `findHighDemandCapabilities`. لكنه **عقد بدون تنفيذ** — لا يوجد `capability-queries.impl.ts`؛ التنفيذ الفعلي متروك لطبقة تطبيق تستهلك هذه الحزمة.

## الأحداث المكتوبة النوع

لا يوجد. لا مجلد `events/` ولا أي تعريف لحدث نطاق في شجرة `src/` الخاصة بهذه الحزمة.

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel` و`@lateen-os/business-dna` (لاستيراد `MachineId`، `ProductId`، `ServiceId`، `OrganizationId`).

## الحزم المعتمِدة

تعتمد عليها فعليًا (بحث في `package.json` عبر المستودع): `ai-runtime`، `decision-engine`، `domain-graph`، `intelligence-engine`.

## نقاط التكامل

لا يوجد مجلد `relationship-management/`. الحزم التي تعتمد عليها (`decision-engine`، `domain-graph`) تفعل ذلك عبر استيراد نوع `CapabilityId` فقط على مستوى الأنواع (type-only)، وليس عبر استدعاء أي خدمة تشغيلية — لا يوجد تكامل تشغيلي حقيقي "صادر" من هذه الحزمة نحو أي حزمة شقيقة.

## ملاحظات معمارية

- حزمة من الحقبة الأولى تسبق اصطلاح الحقبة الثانية بالكامل: لا `relationship-management/`، لا `queries/*.impl.ts`، لا `events/`، لا `runtime.ts`.
- غياب مجموعة الاختبارات والتنفيذ الفعلي لطبقة الاستعلامات هما فجوتان حقيقيتان موثقتان، وليستا اختراعًا في هذا المستند.
- لا وثيقة `*_MODEL.md` لهذه الحزمة (موثّق في `ARCHITECTURE_AUDIT.md` F5) — يوجد فقط `README.md` و`ARCHITECTURE.md`.

## قرارات التصميم

- فصل "القدرة" عن "الآلة" عبر ثلاثة تجميعات علاقة منفصلة (آلة، منتج، خدمة) بدلًا من حقل واحد متعدد الأغراض — يتيح تحليل الفجوة (قدرات مطلوبة بلا آلة موفرة) والطلب المرتفع (قدرات يتجاوز الطلب عليها العرض) كاستعلامات مستقلة.
- إعادة استخدام معرّفات `business-dna` (`MachineId`, `ProductId`, `ServiceId`, `OrganizationId`) بدلًا من تعريف معرّفات مكافئة محليًا.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات القدرات يجب أن تنفّذ عقد `CapabilityQueries` بنفسها في طبقة البنية التحتية الخاصة بها (أو تستهلك تنفيذًا قائمًا في مكان آخر) — لا يجوز تعديل هذه الحزمة لإضافة `runtime.ts` أو ناقل أحداث لمجرد خدمة مستهلك واحد؛ أي احتياج حقيقي لذلك يستحق دراسة معمارية مخصصة، ليس تعديلًا صامتًا.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)
- [Domain Graph](./domain-graph.md)
- [Decision Engine](./decision-engine.md)

---

# English

## Purpose

`@lateen-os/capability-engine` models what the company is actually able to do, independent of any specific machine. A **Capability** is an abstract description of a production ability (e.g. UV printing, laser cutting, on-site installation), provided by one or more machines, required by one or more products, and consumed by one or more services. This separates "what we can do" from "which machine does it," enabling capacity planning and gap analysis without coupling to specific hardware.

This is an Era-1 platform-support package that predates the `relationship-management/` + `queries/` + `runtime.ts` convention — it is real, working code, but its internal shape does not match Era-2 packages. This is not a defect to "fix"; it is documented technical debt in `docs/certification/KNOWN_TECHNICAL_DEBT.md`.

## Responsibilities

- Defines the `Capability` aggregate, its categories, and its statuses.
- Defines the machine↔capability (`MachineCapability`), product↔capability (`ProductCapability`), and service↔capability (`ServiceCapability`) relations.
- Provides repository ports for all four aggregates.
- Provides a query **contract** (`CapabilityQueries`) for cross-aggregate capability analysis — with no implementation inside this package.

## Non-responsibilities

- **No real query-layer implementation**: `queries/capability-queries.ts` is a contract only; its own doc comment states explicitly that "implementations live outside this package (infrastructure / application layer)." There is no `*.impl.ts` file for any query in this package.
- No typed domain event bus: there is no `events/` folder in this package at all.
- No composition root (`runtime.ts` or equivalent): this is architecturally correct, not a gap — the package exports capability-definition/registration types with no injected collaborators or state to compose.
- **No test suite at all** — a real, disclosed gap recorded in `KNOWN_TECHNICAL_DEBT.md` (item 3), unlike most other packages on the platform.
- No UI, no API/HTTP, no database/ORM, no business logic beyond type definitions.

## Public Runtime

There is **no composition root** in this package (no `runtime.ts`, no `createXRuntime()`-equivalent). This is architecturally correct: the package exports capability-definition/registration types and interfaces with no state or collaborators that need wiring together — there is nothing to compose.

## Public Queries

A real `CapabilityQueries` contract exists in `src/queries/capability-queries.ts` with these signatures: `findCapabilitiesByMachine`, `findCapabilitiesByProduct`, `findProductsByCapability`, `findMachinesByCapability`, `findServicesByCapability`, `findUnusedCapabilities`, `findMissingCapabilities`, `findHighDemandCapabilities`. It is a **contract without an implementation** — there is no `capability-queries.impl.ts`; the actual implementation is left to a consuming application layer.

## Typed Events

None. There is no `events/` folder and no domain event declaration anywhere in this package's `src/` tree.

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel` and `@lateen-os/business-dna` (for `MachineId`, `ProductId`, `ServiceId`, `OrganizationId`).

## Dependents

Real dependents (verified by grepping `package.json` across the workspace): `ai-runtime`, `decision-engine`, `domain-graph`, `intelligence-engine`.

## Integration Points

No `relationship-management/` folder exists. The packages that depend on it (`decision-engine`, `domain-graph`) do so purely by importing the `CapabilityId` type at the type level — not by calling any runtime service — so there is no real outbound runtime integration from this package toward any sibling.

## Architecture Notes

- An Era-1 package that predates the Era-2 convention entirely: no `relationship-management/`, no `queries/*.impl.ts`, no `events/`, no `runtime.ts`.
- The missing test suite and the missing query-layer implementation are both real, documented gaps, not an invention of this document.
- No `*_MODEL.md` document exists for this package (recorded in `ARCHITECTURE_AUDIT.md` F5) — only a `README.md` and `ARCHITECTURE.md`.

## Design Decisions

- Capability is decoupled from Machine through three separate relation aggregates (machine, product, service) rather than one multi-purpose field — enabling gap analysis (required capabilities with no providing machine) and high-demand analysis (capabilities where demand exceeds supply) as independent queries.
- Reuses `business-dna`'s identifiers (`MachineId`, `ProductId`, `ServiceId`, `OrganizationId`) rather than defining locally equivalent identifiers.

## Extension Points

Any future package that needs capability data should implement the `CapabilityQueries` contract itself in its own infrastructure layer (or consume an implementation that exists elsewhere) — this package must not be modified to add a `runtime.ts` or event bus just to serve one consumer; a genuine need for that deserves a dedicated architectural review, not a silent change.

## Related Engines

- [Business DNA](./business-dna.md)
- [Domain Graph](./domain-graph.md)
- [Decision Engine](./decision-engine.md)
