---
title: Runtime Guide
title_ar: دليل وقت التشغيل
version: 1.0.0
status: active
phase: "Milestone 2 — Enterprise Platform (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - 03_CONSTITUTION.md
  - 04_ARCHITECTURE_GUIDE.md
  - 05_ENGINE_GUIDE.md
  - ../certification/RUNTIME_AUDIT.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## دليل وقت التشغيل

هذا الدليل يشرح جذر التركيب (`createXRuntime`) بالتفصيل: ماذا يفعل، وماذا يُمنع أن يفعل، وكيف يُستهلك.

### 1. التوقيع القياسي

```typescript
export function createXRuntime(deps: XRuntimeDeps = {}): XRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createXEventBus();
  const repository = createXRepository(); // ينشأ هنا فقط
  const engine = createXEngine(repository, eventBus, now);
  return {
    <subdomain>: engine,
    relationshipManagement: createRelationshipManagement(deps),
    queries: createXQueries({ repository }),
    events: eventBus,
  };
}
```

### 2. القواعد الثابتة

1. كل تبعية في `deps` اختيارية — التخلف الافتراضي دائمًا حقيقي وقابل للعمل دون حقن (لا حقن = لا تعطّل).
2. المستودع (`repository`) يُنشأ **فقط** هنا، ولا يُعاد ضمن الكائن المُرجَع أبدًا.
3. `now()` تُحقن دائمًا لضمان الحتمية في الاختبارات — الافتراضي دالة زمن حقيقية (`nowIso` أو مكافئها).
4. أي متعاون من حزمة شقيقة يُحقن كشريحة ضيقة النوع (`Pick<SiblingRuntime, '...'>`)، أبدًا نوع Runtime الكامل.

### 3. تغطية جذر التركيب عبر المنصة (39 حزمة)

| الفئة | العدد |
| --- | --- |
| مطابقة تامة لـ `createXRuntime()` | 24 |
| موجود لكن بتسمية/موقع مختلف | 4 |
| انحراف موثّق ومقصود (بلا Runtime موحّد) | 3 |
| لا جذر تركيب — لا شيء لتركيبه (صحيح بنيويًا) | 2 |
| حالة خاصة (ليست حزمة خدمة) | 3 |
| عقود فقط، بلا حالة تشغيل | 2 |
| أداة اختبار، ليست محركًا قابلًا للتركيب | 1 |

التفاصيل الكاملة والأسماء الحقيقية في `docs/certification/RUNTIME_AUDIT.md`.

### 4. لماذا لا تُصدَّر المستودعات؟

لأن تصدير مستودع يكسر حدود الحزمة: يسمح لحزمة أخرى بقراءة/تعديل الحالة مباشرة متجاوزةً قواعد النطاق (التحقق، انتقالات الحالة، الأحداث). كل تكامل يجب أن يمر عبر سلوك (خدمة) لا عبر تخزين خام.

---

# English

## Runtime Guide

This guide explains the composition root (`createXRuntime`) in detail: what it does, what it must never do, and how it is consumed.

### 1. The Standard Signature

```typescript
export function createXRuntime(deps: XRuntimeDeps = {}): XRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createXEventBus();
  const repository = createXRepository(); // constructed only here
  const engine = createXEngine(repository, eventBus, now);
  return {
    <subdomain>: engine,
    relationshipManagement: createRelationshipManagement(deps),
    queries: createXQueries({ repository }),
    events: eventBus,
  };
}
```

### 2. The Fixed Rules

1. Every dependency in `deps` is optional — the default is always real and functional without injection (no injection ≠ broken).
2. The repository is constructed **only** here, and is never returned as part of the returned object.
3. `now()` is always injectable to guarantee determinism in tests — the default is a real clock function (`nowIso` or its equivalent).
4. Any sibling-package collaborator is injected as a narrowly-typed slice (`Pick<SiblingRuntime, '...'>`), never the sibling's whole Runtime type.

### 3. Composition-Root Coverage Across the Platform (39 packages)

| Category | Count |
| --- | --- |
| Conforms exactly to `createXRuntime()` | 24 |
| Present, but differently named/located | 4 |
| Documented, sanctioned deviation (no unified Runtime) | 3 |
| No composition root — nothing to compose (structurally correct) | 2 |
| Special case (not a service package) | 3 |
| Contract-only, no runtime state | 2 |
| Test harness, not a composable engine | 1 |

Full detail and real package names are in `docs/certification/RUNTIME_AUDIT.md`.

### 4. Why Are Repositories Never Exported?

Because exporting a repository breaks the package boundary: it would let another package read/mutate state directly, bypassing domain rules (validation, state transitions, events). Every integration must go through behavior (a service), never raw storage.

---

## Related Documents

- [03_CONSTITUTION](./03_CONSTITUTION.md)
- [04_ARCHITECTURE_GUIDE](./04_ARCHITECTURE_GUIDE.md)
- [05_ENGINE_GUIDE](./05_ENGINE_GUIDE.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)

## Related Engines

All 39 packages under `packages/*`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (`96b8634`).
