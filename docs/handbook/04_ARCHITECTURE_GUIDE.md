---
title: Architecture Guide
title_ar: دليل العمارة
version: 1.0.0
status: active
phase: "Milestone 2 — Enterprise Platform (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - 00_MASTER_PLAN.md
  - 03_CONSTITUTION.md
  - 05_ENGINE_GUIDE.md
  - 06_RUNTIME_GUIDE.md
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## دليل العمارة

هذا الدليل يشرح **كيف** تُطبَّق قواعد [03_CONSTITUTION](./03_CONSTITUTION.md) عمليًا عند قراءة أو بناء حزمة تحت `packages/*`. للقواعد الملزمة نفسها انظر الدستور؛ لتفاصيل كل حزمة على حدة انظر `docs/engines/`.

### 1. الطبقات المعمارية

تُبنى المنصة من تسع طبقات، كل طبقة تعتمد فقط على الطبقات الأدنى منها:

| الطبقة | الحزم |
| --- | --- |
| الأساس | `shared-kernel` |
| تجريد نماذج اللغة | `ai-provider-hub` |
| سلسلة الاستدلال | `decision-engine`, `intelligence-engine`, `ai-runtime`, `ai-brain`, `ceo-engine` |
| التنسيق / العمالة الرقمية | `workflow-engine`, `multi-agent`, `ai-workforce` |
| البنية التحتية للنطاق | `business-dna`, `institutional-memory`, `domain-graph`, `capability-engine` |
| محركات الأعمال | `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine` |
| طبقة الثقة | `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine` |
| أفقي / تشغيلي | `analytics-engine`, `observability-engine` |
| سطح المنصة | `api-gateway`, `admin-console`, `marketplace` (`@lateen-os/marketplace-engine`) |
| سطح المطوّر / بنية تحتية | `sdk`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests` |

**39 حزمة إجمالًا** تحت `packages/*` (تصحيح موثّق: التقارير الأولى لالتزام 35 ذكرت خطأً 38 حزمة — انظر `docs/AI_PROJECT_CONTEXT.md` §3 للتفصيل).

### 2. اتجاه الاعتماديات

يتجه الاعتماد دائمًا من الأعلى إلى الأسفل في الجدول أعلاه، أبدًا العكس. `shared-kernel` هو الطبقة صفر (لا يعتمد على شيء). الاستثناء الحقيقي الوحيد المعروف اليوم: دورة اعتمادية بين `ai-brain` و`multi-agent` (موثّقة، غير مُصلَحة عمدًا — انظر `docs/certification/DEPENDENCY_AUDIT.md`).

### 3. حقبتا بناء الحزم

- **الحقبة 1** (المرحلة 1): الحزم التأسيسية وسلسلة الاستدلال ومحركات الأعمال الأولى. تتفاوت في شكلها الداخلي — بعضها يسبق نمط `relationship-management/`+`queries/`+`runtime.ts` الموحّد.
- **الحقبة 2** (المرحلة 2): `finance-engine` حتى `marketplace`. كل حزمة تتبع نمطًا واحدًا صارمًا حرفيًا: `shared/` ← `events/` ← مجلد فرعي لكل نطاق فرعي ← `relationship-management/` ← `queries/` ← `runtime.ts` ← `index.ts`.

لا تحاول "توحيد" حزم الحقبة 1 لتطابق الحقبة 2 دون التزام مخصص ومراجَع — الانحراف موثّق ومقصود في حالات محددة (انظر `docs/certification/ARCHITECTURE_AUDIT.md`).

### 4. جذر التركيب (Composition Root)

`runtime.ts`'s `createXRuntime(deps = {})` هو المكان الوحيد المخوَّل بـ: إنشاء كل مستودع، ربط كل خدمة بتبعياتها (المستودعات، ناقل الأحداث، `now()`، وشرائح الحزم الشقيقة المحقونة اختياريًا)، وإرجاع السطح العام النهائي. لا شيء فوق جذر التركيب (مستهلك، اختبار، تطبيق) يُنشئ مستودعًا مباشرة.

### 5. طبقة العلاقات (Relationship Layer)

`relationship-management/` (18 من 39 حزمة) هي القائمة المركزية الوحيدة لكل تكامل مع حزمة شقيقة، بطريقة واحدة لكل متعاون، تُعيد `null`/`[]` عند عدم الحقن. النوع دائمًا `Pick<SiblingRuntime, 'الطرق المستخدمة فقط'>` — أبدًا نوع Runtime الكامل للشقيقة.

### 6. طبقة الاستعلام (Query Layer)

`queries/` (31 من 39 حزمة) طبقة قراءة فقط، لا تُعدِّل الحالة أبدًا، مبنية على `paginate()` (تقطيع مصفوفة بسيط) و`scoreLabel()` (تطابق تام=3، تطابق جزئي=2، لا تطابق=0)، بترتيب حتمي ثابت.

### 7. ناقل الأحداث (Event Bus)

`events/` (31 من 39 حزمة) يُصدَّر ككائن `create<X>EventBus()` مبني على `shared-kernel`'s `createEventBus<TEventMap>()`. التسمية دائمًا `اسم.فعل` بصيغة الماضي (`extension.installed`). كل حدث مُعلَن يُصدَر فعليًا من مسار كود حقيقي — لا أحداث طموحة غير مستخدمة.

### 8. الأخطاء المعمارية المعروفة وغير المُصلَحة

1. دورة `ai-brain` ⇄ `multi-agent` — موثّقة، غير مُصلَحة عمدًا (انظر `docs/certification/DEPENDENCY_AUDIT.md`، القرار 0003).
2. تسمية جذر التركيب غير الموحّدة في 4 حزم من الحقبة 1 (`ai-brain`, `ai-provider-hub`, `ceo-engine`, `extension-system`).
3. غياب `relationship-management/` في 9 حزم رغم اعتماديات شقيقة حقيقية (انظر `docs/certification/ARCHITECTURE_AUDIT.md` F4).

لا تُصلح أيًا من هذه دون التزام مخصص ومراجَع منفصل — هي موثّقة عمدًا كديْن تقني، لا كأخطاء يجب إصلاحها ضمن أي مهمة أخرى.

---

# English

## Architecture Guide

This guide explains **how** the rules in [03_CONSTITUTION](./03_CONSTITUTION.md) are applied in practice when reading or building a package under `packages/*`. For the binding rules themselves, see the Constitution; for per-package detail, see `docs/engines/`.

### 1. The Architectural Layers

The platform is built from nine layers, each depending only on the layers below it:

| Layer | Packages |
| --- | --- |
| Foundation | `shared-kernel` |
| LLM abstraction | `ai-provider-hub` |
| Reasoning stack | `decision-engine`, `intelligence-engine`, `ai-runtime`, `ai-brain`, `ceo-engine` |
| Coordination / digital labor | `workflow-engine`, `multi-agent`, `ai-workforce` |
| Domain infrastructure | `business-dna`, `institutional-memory`, `domain-graph`, `capability-engine` |
| Business engines | `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine` |
| Trust layer | `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine` |
| Horizontal / operational | `analytics-engine`, `observability-engine` |
| Platform surface | `api-gateway`, `admin-console`, `marketplace` (`@lateen-os/marketplace-engine`) |
| Developer surface / platform infra | `sdk`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests` |

**39 packages total** under `packages/*` (documented correction: Commit 35's first-draft reports mistakenly stated 38 — see `docs/AI_PROJECT_CONTEXT.md` §3 for detail).

### 2. Dependency Direction

Dependencies always flow top-to-bottom in the table above, never the reverse. `shared-kernel` is Layer Zero (depends on nothing). The one known real exception today: a circular dependency between `ai-brain` and `multi-agent` (documented, deliberately not fixed — see `docs/certification/DEPENDENCY_AUDIT.md`).

### 3. The Two Package-Construction Eras

- **Era 1** (Milestone 1): the foundational packages, reasoning stack, and first business engines. Their internal shape varies — some predate the unified `relationship-management/`+`queries/`+`runtime.ts` convention.
- **Era 2** (Milestone 2): `finance-engine` through `marketplace`. Every package follows one rigid, byte-for-byte-consistent pattern: `shared/` → `events/` → one folder per subdomain → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`.

Do not "normalize" Era-1 packages to match Era-2 without a dedicated, reviewed commit — the deviation is documented and, in specific cases, intentional (see `docs/certification/ARCHITECTURE_AUDIT.md`).

### 4. The Composition Root

`runtime.ts`'s `createXRuntime(deps = {})` is the only place authorized to: construct every repository, wire every service to its dependencies (repositories, the event bus, `now()`, and optionally-injected sibling-package slices), and assemble the final public surface. Nothing above the composition root (a consumer, a test, an application) constructs a repository directly.

### 5. The Relationship Layer

`relationship-management/` (18 of 39 packages) is the single centralized list of every sibling integration, one method per collaborator, degrading to `null`/`[]` when not injected. The type is always `Pick<SiblingRuntime, 'only the methods actually called'>` — never the sibling's whole Runtime type.

### 6. The Query Layer

`queries/` (31 of 39 packages) is a read-only layer that never mutates state, built on `paginate()` (a plain array slice) and `scoreLabel()` (exact match = 3, substring match = 2, no match = 0), with deterministic, fixed ordering.

### 7. The Event Bus

`events/` (31 of 39 packages) is exported as a `create<X>EventBus()` built on `shared-kernel`'s `createEventBus<TEventMap>()`. Naming is always `noun.verb` past tense (`extension.installed`). Every declared event is genuinely published by a real code path — no aspirational, unused event declarations.

### 8. Known, Unfixed Architectural Defects

1. The `ai-brain` ⇄ `multi-agent` cycle — documented, deliberately not fixed (see `docs/certification/DEPENDENCY_AUDIT.md`, ADR 0003).
2. Non-uniform composition-root naming in 4 Era-1 packages (`ai-brain`, `ai-provider-hub`, `ceo-engine`, `extension-system`).
3. Missing `relationship-management/` in 9 packages despite real sibling dependencies (see `docs/certification/ARCHITECTURE_AUDIT.md` F4).

Do not fix any of these without a dedicated, reviewed commit of their own — they are deliberately documented as technical debt, not defects to be resolved as a side effect of unrelated work.

---

## Related Documents

- [00_MASTER_PLAN](./00_MASTER_PLAN.md)
- [03_CONSTITUTION](./03_CONSTITUTION.md)
- [05_ENGINE_GUIDE](./05_ENGINE_GUIDE.md)
- [06_RUNTIME_GUIDE](./06_RUNTIME_GUIDE.md)
- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../certification/ARCHITECTURE_AUDIT.md](../certification/ARCHITECTURE_AUDIT.md)

## Related Engines

All 39 packages under `packages/*`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (`96b8634`).
