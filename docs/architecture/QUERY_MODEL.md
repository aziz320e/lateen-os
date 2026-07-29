---
title: Query Model
title_ar: نموذج الاستعلام
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/RUNTIME_AUDIT.md
  - RUNTIME_MODEL.md
  - EVENT_MODEL.md
related_engines:
  - finance-engine
  - marketplace
related_commits:
  - "35"
---

# العربية

## نموذج الاستعلام

### 1. طبقة `queries/` كمنفذ CQRS للقراءة فقط

كل حزمة تمتلك `queries/` تُقدّم منفذ قراءة حتميًا فوق مستودعات الحزمة **الخاصة بها فقط** (أبدًا مستودع سيبلينج) — لا تُعدّل الحالة إطلاقًا. الدوال تُسمّى `findX(query): Promise<{ x: readonly X[], total: number }>` للمجموعات، وتُبنى من دالتين مساعدتين نقيتين متكرّرتين حرفيًا عبر كل حزمة تملك طبقة استعلام:

```ts
// packages/finance-engine/src/queries/finance-queries.impl.ts (مطابق حرفيًا في marketplace وغيرها)
function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}
```

- `paginate()` — قطع مصفوفة عادي (`.slice()`)، لا فهرسة، لا قاعدة بيانات.
- `scoreLabel()` — تسجيل حتمي: تطابق تام = 3، تطابق جزئي (substring) = 2، بلا تطابق = 0 — تُستخدم في كل دالة `searchX()`، مع الترتيب تنازليًا حسب الدرجة ثم تصاعديًا حسب `id` لضمان ترتيب حتمي تمامًا. **أبدًا مكتبة مطابقة ضبابية (fuzzy)، أبدًا نموذج ترتيب.**

تحقّقنا من هذا النمط حرفيًا في كلٍّ من `packages/finance-engine/src/queries/finance-queries.impl.ts` (الأسطر 50–61) و`packages/marketplace/src/queries/marketplace-queries.impl.ts` (الأسطر 40–51) — متطابقان حرفًا بحرف.

### 2. الضمان: قراءة فقط، دائمًا

لا دالة استعلام تستدعي أي طريقة `save`/`delete`/`update` على أي مستودع — طبقة الاستعلام مبنية فقط فوق طرق `list`/`findById` للمستودع.

### 3. التغطية الحقيقية

**31 من 39 حزمة** تملك مجلد `queries/` — محقّقة مباشرة عبر فحص وجود `src/queries/` في كل حزمة من الـ39. الحزم الثماني التي لا تملكه: `ceo-engine`, `connector-base`, `integration-contracts`, `kernel`, `sdk`, `shared-kernel` (بلا حالة نطاقية قابلة للاستعلام)، بالإضافة إلى `integration-tests` و`typescript-config` (بلا مجلد `src/` أصلًا). هذا العدد (31) يطابق ما ورد في `docs/AI_PROJECT_CONTEXT.md` §7 بعد تصحيح عدد الحزم إلى 39.

**ملاحظة تحقّق مهمة**: `docs/certification/RUNTIME_AUDIT.md` يُدرج `capability-engine` ضمن قائمة الحزم التي "ليس لديها queries/" — لكن الفحص المباشر لـ`packages/capability-engine/src/queries/capability-queries.ts` (2,157 بايت، كود استعلام حقيقي غير فارغ) يُثبت أن `capability-engine` **تملك فعليًا** مجلد `queries/` حقيقيًا. هذا تناقض حقيقي بين نص `RUNTIME_AUDIT.md` والكود المصدري الفعلي — تناقض حسابي بسيط في تلك القائمة (تسع حزم مذكورة فيها بينما الرقم الصحيح 31/39 يستلزم ثماني استثناءات فقط)، وليس خللًا معماريًا. يُبلَّغ عنه هنا دون تعديل تقرير الشهادة أو الكود المصدري.

---

# English

## Query Model

### 1. The `queries/` Layer as a Read-Only CQRS Port

Every package with a `queries/` folder provides a deterministic read port over that package's **own** repositories only (never a sibling's) — it never mutates state. Methods are named `findX(query): Promise<{ x: readonly X[], total: number }>` for collections, composed from two pure helper functions repeated verbatim across every package that has this layer:

```ts
// packages/finance-engine/src/queries/finance-queries.impl.ts (byte-identical in marketplace and others)
function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}
```

- `paginate()` — a plain array slice (`.slice()`) — no indexing, no database.
- `scoreLabel()` — deterministic scoring: exact match = 3, substring match = 2, no match = 0 — used by every `searchX()` method, sorted by score descending then `id` ascending for a fully deterministic order. **Never a fuzzy-match library, never a ranking model.**

This pattern was verified verbatim in both `packages/finance-engine/src/queries/finance-queries.impl.ts` (lines 50–61) and `packages/marketplace/src/queries/marketplace-queries.impl.ts` (lines 40–51) — identical character-for-character.

### 2. The Guarantee: Read-Only, Always

No query method calls any `save`/`delete`/`update` method on any repository — the query layer is built only on top of a repository's `list`/`findById` methods.

### 3. Real Coverage

**31 of 39 packages** have a `queries/` folder — verified directly by checking for `src/queries/` presence across all 39 packages. The eight packages without one: `ceo-engine`, `connector-base`, `integration-contracts`, `kernel`, `sdk`, `shared-kernel` (no queryable domain state of their own), plus `integration-tests` and `typescript-config` (no `src/` folder at all). This count (31) matches `docs/AI_PROJECT_CONTEXT.md` §7 once the package total is corrected to 39.

**Important verification note**: `docs/certification/RUNTIME_AUDIT.md` lists `capability-engine` among the packages that "have no `queries/`" — but direct inspection of `packages/capability-engine/src/queries/capability-queries.ts` (2,157 bytes, real non-empty query code) proves `capability-engine` **does** have a real `queries/` folder. This is a genuine discrepancy between `RUNTIME_AUDIT.md`'s prose and the actual source — a simple arithmetic slip in that list (it names nine packages when the correct 31/39 figure requires exactly eight exceptions), not an architectural defect. Reported here without modifying the certification report or any source code.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)
- [RUNTIME_MODEL.md](./RUNTIME_MODEL.md)
- [EVENT_MODEL.md](./EVENT_MODEL.md)

## Related Engines

`finance-engine`, `marketplace` (worked examples); `capability-engine` (verification finding); the query-layer rule applies to 31 of 39 `packages/*`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
