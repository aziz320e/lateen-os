---
title: Shared Kernel
title_ar: النواة المشتركة
version: 1.0.0
status: active
package: "@lateen-os/shared-kernel"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/KNOWN_TECHNICAL_DEBT.md
related_packages:
  - business-dna
---

# العربية

## الغرض

`@lateen-os/shared-kernel` هو **الطبقة صفر** (Layer Zero) لنظام Lateen OS بأكمله: لبنات بناء أساسية من نمط تصميم يقوده النطاق (DDD) يستهلكها كل حزمة أخرى تقريبًا في المنصة. لا يعتمد على **أي** حزمة أخرى في المنصة — هو الأساس الذي تُبنى فوقه كل الحزم الأخرى، وليس مثالًا على قالب "عصر 2" (Era 2) — بل هو الأساس الذي يُبنى ذلك القالب فوقه.

## المسؤوليات

- كيانات أساسية: `Entity`، `AggregateRoot`، `ValueObject`، `DomainEvent`/`DomainEventName`، `DomainError`، `Result`/`Ok`/`Err`، `GuardClause`، `Specification` (في `core/`).
- الهوية: `UUID`، `Identifier`، `BrandedIdentifier` (في `identity/`).
- بدائيات مشتركة: `Money`، `CurrencyCode`، `Address`، `Email`، `Phone`، `Percentage`، `TimeRange`، `GeoLocation` (في `common/`).
- التدقيق: `AuditInfo`، `VersionInfo` (في `audit/`).
- تعدد المستأجرين: `TenantId`، `OrganizationId`، `BranchId` (في `tenant/`).
- الوقت: `Timestamp`، `DateOnly`، منفذ `Clock` (في `time/`).
- المراقبة الأساسية: `Logger`، `withRetry`، `withSpan` (في `observability/`، مبنية فوق `pino` و`@opentelemetry/api` الحقيقيتين).
- ناقل الأحداث العام: `createEventBus<TEventMap>()` (في `events/`) — الأساس الذي تبني فوقه كل حزمة ناقل أحداثها المكتوب النوع الخاص.
- المستودع العام في الذاكرة: `createInMemoryRepository()` (في `repository/`) — الأساس الذي تبني فوقه كل حزمة مستودعاتها الخاصة.

## خارج نطاق المسؤولية

- لا كيانات عمل (Business Entities) — فقط لبنات بناء عامة.
- لا تنفيذ فعلي لناقل أحداث خاص بنطاق معين، ولا منطق أعمال من أي نوع.
- لا HTTP/API، لا قاعدة بيانات/ORM حقيقية (المستودع في الذاكرة فقط)، لا واجهة مستخدم، لا أطر عمل.

## وقت التشغيل العام

**لا يوجد** `runtime.ts` أو ما يعادله في هذه الحزمة — وهذا صحيح معماريًا وليس نقصًا: `shared-kernel` مكتبة بدائيات (primitives library)، تُصدّر أنواعًا ودوال `create*` مستقلة (`createEventBus`، `createInMemoryRepository`، `createLogger`) بدلًا من كائن تشغيل واحد مُركَّب — إذ لا يوجد شيء لتركيبه: لا حالة، لا مستودعات داخلية، لا متعاونين شقيقين لحقنهم. مُصدَّرة عبر `src/index.ts` بالإضافة إلى مسارات فرعية مُخصصة (`./core`، `./identity`، `./common`، `./audit`، `./tenant`، `./time`، `./observability`، `./events`، `./repository`).

## الاستعلامات العامة

**لا توجد** طبقة `queries/` في هذه الحزمة — صحيح معماريًا: لا توجد حالة نطاق مملوكة لتُستعلَم عنها؛ هذه مكتبة بدائيات بحتة.

## الأحداث المكتوبة النوع

**لا توجد** خريطة أحداث نطاق (Domain EventMap) محددة في هذه الحزمة — بدلًا من ذلك، تُصدّر `createEventBus<TEventMap>()` العامة والمُعامَلة بنوع (generic)، وهي الأساس الذي تبني فوقه كل حزمة أخرى (31 من أصل 39) ناقل أحداثها الخاص المكتوب النوع (`create<X>EventBus()` + `type <X>EventMap`).

## الاعتماديات

حسب `package.json`، **لا توجد أي اعتمادية على أي حزمة `@lateen-os/*` أخرى** — الحزمة الوحيدة (إلى جانب `business-dna`) التي لا تعتمد على أي حزمة شقيقة على الإطلاق. تعتمد فقط على مكتبتين خارجيتين حقيقيتين: `@opentelemetry/api` و`pino` (للمراقبة الأساسية).

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`، تعتمد عليها 33 من أصل الحزم الـ38 الأخرى في المنصة مباشرة — الاستثناءات الخمسة الوحيدة التي لا تعتمد عليها مباشرة: `connector-base`، `integration-contracts`، `integration-tests`، `kernel`، `typescript-config`.

## نقاط التكامل

لا يوجد مجلد `relationship-management/` ولا أي تكامل حقيقي مع أي حزمة شقيقة — وهذا صحيح معماريًا: `shared-kernel` هي الحزمة الوحيدة التي "كل حزمة أخرى قد تُعاملها كحزمة مجانية" (`docs/AI_PROJECT_CONTEXT.md` §4، القاعدة 8)؛ التكامل يسير في اتجاه واحد فقط من كل حزمة أخرى نحوها.

## ملاحظات معمارية

- **الطبقة صفر** الحقيقية للمنصة بأكملها — أعلى مركزية استقبال (fan-in) في رسم الاعتماديات كله، وصفر اعتماديات صادرة على أي حزمة `@lateen-os/*`.
- بنية الحزمة (`core/`، `identity/`، `common/`، `audit/`، `tenant/`، `time/`، `events/`، `repository/`، بالإضافة إلى `observability/`) لا تُطابق قالب "مجلد فرعي واحد لكل نطاق عمل" المُتبع في حزم الأعمال (Era 2) — وهذا متوقع: هذه الحزمة هي الأساس الذي يُبنى فوقه ذلك القالب، وليست مثالًا عليه.
- **لا يوجد ملف `*_MODEL.md`** لهذه الحزمة — فجوة توثيقية حقيقية معروفة ومسجَّلة في `docs/certification/KNOWN_TECHNICAL_DEBT.md` (البند 7)، لم تُصلح ضمن هذه المهمة التوثيقية (لا يجوز اختلاق محتوى MODEL غير موجود).
- **ملاحظة عدم اتساق حقيقية**: جدول "الوحدات" في `README.md` الحالي يذكر ستة وحدات فقط (`core/`، `identity/`، `common/`، `audit/`، `tenant/`، `time/`) ولا يذكر `events/`، `repository/`، أو `observability/` — رغم أن الثلاثة موجودة فعليًا في `src/` ومُصدَّرة من `index.ts` وتُشكّل جزءًا أساسيًا من الاستخدام الفعلي عبر المنصة (ناقل الأحداث والمستودع في الذاكرة يُستخدمان حرفيًا في كل حزمة أخرى تقريبًا). هذا عدم اتساق حقيقي بين التوثيق والمصدر — تم الإبلاغ عنه فقط، ولم يُصلح ضمن هذه المهمة.

## قرارات التصميم

- كل بدائية مُصدَّرة كنوع (type) بحت أو دالة `create*` مستقلة — لا كائن تشغيل واحد يُجمّعها.
- مسارات فرعية مُخصصة (`exports` في `package.json`) لكل وحدة، تُتيح لأي حزمة استيراد `@lateen-os/shared-kernel/time` مثلًا دون سحب كل الحزمة.
- `createInMemoryRepository()` و`createEventBus()` هما النمطان العامان المُعاد استخدامهما حرفيًا (216 ملفًا حسب `docs/certification/DEPENDENCY_AUDIT.md`) عبر كل حزمة أخرى تقريبًا، بدلًا من أن تخترع كل حزمة نسختها الخاصة.

## نقاط التوسعة

أي حزمة جديدة تحتاج بدائية أساسية (معرّف، طابع زمني، مبلغ مالي، ناقل أحداث، مستودع في الذاكرة) يجب أن تستوردها من `@lateen-os/shared-kernel` (أو مساراتها الفرعية) بدلًا من اختراع مكافئ محلي — هذا إلزامي حسب `docs/AI_PROJECT_CONTEXT.md` §4 القاعدة 8. لا يجوز أبدًا تعديل هذه الحزمة لخدمة حاجة حزمة واحدة فقط؛ أي إضافة بدائية جديدة يجب أن تكون عامة الفائدة عبر المنصة بأكملها.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)

---

# English

## Purpose

`@lateen-os/shared-kernel` is **Layer Zero** for the entire Lateen OS platform: foundational Domain-Driven Design (DDD) building blocks consumed by nearly every other package on the platform. It depends on **no** other package in the platform — it is the foundation every other package builds on, not an instance of the "Era 2" business-engine template — it is the foundation that template itself builds upon.

## Responsibilities

- Core building blocks: `Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`/`DomainEventName`, `DomainError`, `Result`/`Ok`/`Err`, `GuardClause`, `Specification` (in `core/`).
- Identity: `UUID`, `Identifier`, `BrandedIdentifier` (in `identity/`).
- Shared primitives: `Money`, `CurrencyCode`, `Address`, `Email`, `Phone`, `Percentage`, `TimeRange`, `GeoLocation` (in `common/`).
- Audit: `AuditInfo`, `VersionInfo` (in `audit/`).
- Multi-tenancy: `TenantId`, `OrganizationId`, `BranchId` (in `tenant/`).
- Time: `Timestamp`, `DateOnly`, a `Clock` port (in `time/`).
- Foundational observability: `Logger`, `withRetry`, `withSpan` (in `observability/`, built on real `pino` and `@opentelemetry/api`).
- The generic event bus: `createEventBus<TEventMap>()` (in `events/`) — the foundation every package builds its own typed event bus on.
- The generic in-memory repository: `createInMemoryRepository()` (in `repository/`) — the foundation every package builds its own repositories on.

## Non-responsibilities

- No business entities — only generic building blocks.
- No implementation of any domain-specific event bus, and no business logic of any kind.
- No HTTP/API, no real database/ORM (in-memory repository only), no UI, no frameworks.

## Public Runtime

There is **no** `runtime.ts` or equivalent in this package — architecturally correct, not a gap: `shared-kernel` is a primitives library, exporting standalone types and `create*` functions (`createEventBus`, `createInMemoryRepository`, `createLogger`) rather than one composed runtime object — because there is nothing to compose: no state, no internal repositories, no sibling collaborators to inject. Exported through `src/index.ts` plus dedicated subpaths (`./core`, `./identity`, `./common`, `./audit`, `./tenant`, `./time`, `./observability`, `./events`, `./repository`).

## Public Queries

There is **no** `queries/` layer in this package — architecturally correct: there is no owned domain state to query; this is a pure primitives library.

## Typed Events

There is **no** package-specific domain EventMap defined here — instead, it exports the generic, type-parameterized `createEventBus<TEventMap>()`, the foundation every other package (31 of 39) builds its own typed event bus on (`create<X>EventBus()` + `type <X>EventMap`).

## Dependencies

Per `package.json`, **it depends on no other `@lateen-os/*` package** — the only package (alongside `business-dna`) with zero dependency on any sibling package whatsoever. It depends only on two real external libraries: `@opentelemetry/api` and `pino` (for foundational observability).

## Dependents

Verified by grepping every `package.json`: 33 of the other 38 packages on the platform depend on it directly — the only five that do not: `connector-base`, `integration-contracts`, `integration-tests`, `kernel`, `typescript-config`.

## Integration Points

There is no `relationship-management/` folder and no real integration with any sibling package — architecturally correct: `shared-kernel` is the one package "every other package may treat as free" (`docs/AI_PROJECT_CONTEXT.md` §4, rule 8); integration flows strictly one-way, from every other package toward it.

## Architecture Notes

- The platform's real **Layer Zero** — the highest fan-in of any package in the entire dependency graph, and zero outbound dependency on any `@lateen-os/*` package.
- The package's structure (`core/`, `identity/`, `common/`, `audit/`, `tenant/`, `time/`, `events/`, `repository/`, plus `observability/`) does not match the "one subfolder per business subdomain" template used by business engines (Era 2) — expected: this package is the foundation that template is built on, not an instance of it.
- **No `*_MODEL.md` document exists** for this package — a real, known documentation gap recorded in `docs/certification/KNOWN_TECHNICAL_DEBT.md` (item 7), not fixed by this documentation task (fabricating MODEL content that doesn't exist would violate the no-fabrication rule).
- **A real inconsistency found**: the current `README.md`'s "Modules" table lists only six modules (`core/`, `identity/`, `common/`, `audit/`, `tenant/`, `time/`) and omits `events/`, `repository/`, and `observability/` — even though all three genuinely exist in `src/`, are exported from `index.ts`, and form a core part of real platform-wide usage (the event bus and in-memory repository are used literally by nearly every other package). This is a real inconsistency between the documentation and the source — reported here only, not fixed as part of this task.

## Design Decisions

- Every primitive is exported as a pure type or a standalone `create*` function — no single runtime object aggregates them.
- Dedicated subpath exports (`exports` in `package.json`) per module, letting any package import e.g. `@lateen-os/shared-kernel/time` without pulling in the whole package.
- `createInMemoryRepository()` and `createEventBus()` are the two generic patterns literally reused (216 files, per `docs/certification/DEPENDENCY_AUDIT.md`) across nearly every other package, instead of each package inventing its own equivalent.

## Extension Points

Any new package needing a foundational primitive (an identifier, a timestamp, a monetary amount, an event bus, an in-memory repository) should import it from `@lateen-os/shared-kernel` (or its subpaths) rather than inventing a local equivalent — mandatory per `docs/AI_PROJECT_CONTEXT.md` §4 rule 8. This package must never be modified to accommodate a single package's need; any new primitive added here must be generically useful platform-wide.

## Related Engines

- [Business DNA](./business-dna.md)
