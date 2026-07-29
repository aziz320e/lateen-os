---
title: Engine Guide
title_ar: دليل المحركات
version: 1.0.0
status: active
phase: "Milestone 2 — Enterprise Platform (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - 03_CONSTITUTION.md
  - 04_ARCHITECTURE_GUIDE.md
  - 06_RUNTIME_GUIDE.md
  - ../AI_PROJECT_CONTEXT.md
  - ../engines/
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## دليل المحركات

هذا الدليل يشرح شكل "المحرك" (engine) — أي حزمة عمل حقيقية تحت `packages/*` — من الداخل، وكيف تُقرأ حزمة موجودة أو تُبنى حزمة جديدة تتبع نفس النمط. للتفاصيل الفعلية لكل محرك على حدة انظر `docs/engines/<اسم-الحزمة>.md`.

### 1. البنية المجلدية القياسية (نمط الحقبة 2)

```
src/
├── shared/                     # المعرّفات، الأنواع الأساسية، الأخطاء المكتوبة النوع
├── events/                     # ناقل الأحداث المكتوب النوع (create<X>EventBus)
├── <subdomain>/                # لكل نطاق فرعي: types.ts, repository.ts, repository.impl.ts, engine.impl.ts, index.ts
├── relationship-management/     # تكامل الحزم الشقيقة (إن وُجد تكامل حقيقي)
├── queries/                     # طبقة القراءة (CQRS)
├── runtime.ts                   # جذر التركيب: createXRuntime(deps = {})
└── index.ts                     # التصدير الشامل
```

### 2. المكوّنات الخمسة لأي نطاق فرعي

1. `types.ts` — الكيان (Entity)، أنواع المدخلات، أنواع الأخطاء الخاصة بالنطاق.
2. `repository.ts` — منفذ (port) بلا تنفيذ: `findById(organizationId, id)`, `save(entity)`, إلخ.
3. `repository.impl.ts` — تنفيذ حقيقي في-الذاكرة، عادة مبني على `@lateen-os/shared-kernel/repository`'s `createInMemoryRepository()`.
4. `engine.impl.ts` (أو `service.impl.ts`) — منطق الأعمال الحقيقي: انتقالات الحالة، القواعد، التحقق.
5. `index.ts` — تصدير الوحدة الفرعية.

### 3. متى تحتاج الحزمة `relationship-management/`؟

فقط إذا كانت تستهلك فعليًا خدمة من حزمة شقيقة حقيقية عبر واجهتها العامة. إذا لم تحتج تكاملًا خارجيًا، لا تُنشئ المجلد قسرًا — 21 من 39 حزمة لا تملكه لأسباب مشروعة (بعضها لا يحتاج تكاملًا، وبعضها — موثّق كديْن تقني — يدمج نداءات الشقيقة مباشرة داخل ملفات النطاق الفرعي).

### 4. متى تحتاج الحزمة `queries/`؟

إذا كان لديها حالة نطاق يمكن قراءتها وترشيحها والبحث فيها. الحزم التي لا تملك حالة استعلامية حقيقية (مثل `kernel`, `typescript-config`) لا تحتاج طبقة استعلام.

### 5. اختبار محرك حقيقي

كل منطق أعمال قابل للاختبار دون شبكة أو مزوّد LLM حي — مستودعات في-الذاكرة كافية. اختبارات التكامل تستخدم أنسجة تشغيل (runtimes) حقيقية لحزم شقيقة، لا مكتبات محاكاة (mocking). انظر `docs/certification/TESTING_AUDIT.md` للأرقام الحقيقية (5,676 اختبارًا ناجحًا عبر 37 حزمة).

### 6. قائمة تحقق قبل اعتبار محرك "مكتمل"

- [ ] `README.md`, `ARCHITECTURE.md`, `*_MODEL.md` موجودة وتعكس التنفيذ الفعلي.
- [ ] `runtime.ts` يُصدّر `createXRuntime(deps = {})` واحدًا واضحًا.
- [ ] لا مستودع في السطح العام.
- [ ] كل حدث مُعلَن يُصدَر فعليًا.
- [ ] البناء، فحص الأنواع، الاختبارات، الـ linting كلها تمر — بهذا الترتيب.

---

# English

## Engine Guide

This guide explains the shape of an "engine" — a real business package under `packages/*` — from the inside, and how to read an existing package or build a new one following the same pattern. For per-package specifics, see `docs/engines/<package-name>.md`.

### 1. Standard Folder Structure (Era-2 pattern)

```
src/
├── shared/                     # identifiers, core types, typed errors
├── events/                     # typed event bus (create<X>EventBus)
├── <subdomain>/                # per subdomain: types.ts, repository.ts, repository.impl.ts, engine.impl.ts, index.ts
├── relationship-management/     # sibling integration (only if real integration exists)
├── queries/                     # read layer (CQRS)
├── runtime.ts                   # composition root: createXRuntime(deps = {})
└── index.ts                     # full barrel export
```

### 2. The Five Components of Any Subdomain

1. `types.ts` — the entity, input types, domain-specific error types.
2. `repository.ts` — a port with no implementation: `findById(organizationId, id)`, `save(entity)`, etc.
3. `repository.impl.ts` — a real in-memory implementation, typically built on `@lateen-os/shared-kernel/repository`'s `createInMemoryRepository()`.
4. `engine.impl.ts` (or `service.impl.ts`) — the real business logic: state transitions, rules, validation.
5. `index.ts` — the subdomain's barrel export.

### 3. When Does a Package Need `relationship-management/`?

Only if it genuinely consumes a real sibling package's service through its public interface. If no external integration is needed, do not force the folder into existence — 21 of 39 packages correctly don't have it (some need no integration at all; others — documented as technical debt — embed sibling calls directly inside subdomain files instead).

### 4. When Does a Package Need `queries/`?

If it has domain state that can be read, filtered, and searched. Packages with no real queryable state (e.g. `kernel`, `typescript-config`) don't need a query layer.

### 5. Testing a Real Engine

All business logic must be testable without a network or a live LLM provider — in-memory repositories are sufficient. Integration tests use real sibling runtimes, not mocking libraries. See `docs/certification/TESTING_AUDIT.md` for the real numbers (5,676 passing tests across 37 packages).

### 6. Checklist Before Considering an Engine "Done"

- [ ] `README.md`, `ARCHITECTURE.md`, `*_MODEL.md` exist and reflect the real implementation.
- [ ] `runtime.ts` exports exactly one clear `createXRuntime(deps = {})`.
- [ ] No repository appears in the public surface.
- [ ] Every declared event is genuinely published.
- [ ] Build, typecheck, tests, and lint all pass — in that order.

---

## Related Documents

- [03_CONSTITUTION](./03_CONSTITUTION.md)
- [04_ARCHITECTURE_GUIDE](./04_ARCHITECTURE_GUIDE.md)
- [06_RUNTIME_GUIDE](./06_RUNTIME_GUIDE.md)
- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- `docs/engines/` — one document per package

## Related Engines

All 39 packages under `packages/*`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (`96b8634`).
