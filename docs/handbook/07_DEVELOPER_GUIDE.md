---
title: Developer Guide
title_ar: دليل المطوّر
version: 1.0.0
status: active
phase: "Milestone 2 — Enterprise Platform (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - 03_CONSTITUTION.md
  - 04_ARCHITECTURE_GUIDE.md
  - 05_ENGINE_GUIDE.md
  - ../engineering/ENGINEERING_GUIDE.md
  - ../AI_PROJECT_CONTEXT.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## دليل المطوّر

نقطة البداية العملية لأي مطوّر (بشري أو ذكاء اصطناعي) يعمل على Lateen OS لأول مرة.

### 1. إعداد بيئة العمل

- المستودع مُدار عبر `pnpm` + `Turbo` (monorepo). أوامر الجذر (`pnpm run build/test/typecheck/lint`) تُفوَّض إلى `turbo run <task>`.
- **تنبيه معروف**: دورة اعتمادية حقيقية بين `ai-brain` و`multi-agent` تمنع حاليًا أوامر الجذر من العمل (`turbo` يرفض حساب رسم بياني للبناء). استخدم `pnpm --filter <اسم-الحزمة> run <task>` أو نفّذ الأمر مباشرة داخل مجلد الحزمة حتى تُصلَح الدورة. انظر `docs/certification/DEPENDENCY_AUDIT.md`.

### 2. قبل أي تغيير

1. اقرأ `docs/AI_PROJECT_CONTEXT.md` كاملًا — هو مرجع السياق المعماري الأشمل.
2. اقرأ حزمة واحدة حديثة من الحقبة 2 (مثل `packages/finance-engine` أو `packages/admin-console`) كنموذج بنيوي.
3. لا تُعدِّل حزمة لخدمة حاجة حزمة أخرى — كل تغيير يبقى داخل نطاق حزمته.

### 3. تسلسل التحقق الإلزامي

بناء ← فحص أنواع ← اختبارات ← linting. توقف فورًا عند أي فشل وافهم السبب الجذري قبل المتابعة — لا التزام (commit) إذا فشلت الاختبارات.

### 4. قبل تسمية حزمة جديدة

ابحث في **كل** جذور مساحة العمل الخمسة (`packages/`, `apps/`, `services/`, `workflows/`, `extensions/`) عن الاسم المقترح. حادثة حقيقية وقعت في الالتزام 34: تعارض اسم `@lateen-os/marketplace` بين `packages/marketplace` (محرك) و`apps/marketplace` (واجهة أمامية) عطّل حل مساحة العمل بالكامل. أُصلح بإعادة تسمية المحرك إلى `@lateen-os/marketplace-engine`.

### 5. قبل الالتزام (Commit)

- ميزة منطقية واحدة لكل التزام.
- رسالة الالتزام بصيغة `type(scope): description`.
- التوثيق ذو الصلة محدَّث (لا وثائق مُلفَّقة، لا وعود بميزات غير موجودة).

### 6. أين تجد ماذا

| تحتاج | اذهب إلى |
| --- | --- |
| فلسفة العمارة الكاملة | `docs/AI_PROJECT_CONTEXT.md` |
| القواعد الملزمة | `docs/handbook/03_CONSTITUTION.md` |
| تفاصيل حزمة محددة | `docs/engines/<اسم-الحزمة>.md` |
| قرار معماري وسببه | `docs/adr/` |
| حالة الاختبارات والبناء الحقيقية | `docs/certification/TESTING_AUDIT.md` |
| الديْن التقني المعروف | `docs/certification/KNOWN_TECHNICAL_DEBT.md` |

---

# English

## Developer Guide

The practical starting point for any developer (human or AI) working on Lateen OS for the first time.

### 1. Environment Setup

- The repository is managed via `pnpm` + `Turbo` (monorepo). Root commands (`pnpm run build/test/typecheck/lint`) delegate to `turbo run <task>`.
- **Known caveat**: a real circular dependency between `ai-brain` and `multi-agent` currently prevents root commands from working (`turbo` refuses to compute a build graph). Use `pnpm --filter <package-name> run <task>` or run the command directly inside the package's own directory until the cycle is fixed. See `docs/certification/DEPENDENCY_AUDIT.md`.

### 2. Before Any Change

1. Read `docs/AI_PROJECT_CONTEXT.md` in full — it is the most complete architectural-context reference.
2. Read one recent Era-2 package (e.g. `packages/finance-engine` or `packages/admin-console`) as a structural template.
3. Never modify a package to serve the needs of another — every change stays within its own package's scope.

### 3. The Mandatory Validation Sequence

Build → typecheck → tests → lint. Stop immediately on any failure and understand the root cause before proceeding — never commit if tests fail.

### 4. Before Naming a New Package

Search **all five** workspace roots (`packages/`, `apps/`, `services/`, `workflows/`, `extensions/`) for the proposed name. A real incident occurred in Commit 34: the name `@lateen-os/marketplace` collided between `packages/marketplace` (the engine) and `apps/marketplace` (the frontend), breaking workspace resolution entirely. Fixed by renaming the engine to `@lateen-os/marketplace-engine`.

### 5. Before Committing

- One logical feature per commit.
- Commit message in `type(scope): description` form.
- Relevant documentation updated (no fabricated docs, no promises of features that don't exist).

### 6. Where to Find What

| You need | Go to |
| --- | --- |
| Full architectural philosophy | `docs/AI_PROJECT_CONTEXT.md` |
| Binding rules | `docs/handbook/03_CONSTITUTION.md` |
| A specific package's detail | `docs/engines/<package-name>.md` |
| An architectural decision and its rationale | `docs/adr/` |
| Real, current build/test status | `docs/certification/TESTING_AUDIT.md` |
| Known technical debt | `docs/certification/KNOWN_TECHNICAL_DEBT.md` |

---

## Related Documents

- [03_CONSTITUTION](./03_CONSTITUTION.md)
- [04_ARCHITECTURE_GUIDE](./04_ARCHITECTURE_GUIDE.md)
- [05_ENGINE_GUIDE](./05_ENGINE_GUIDE.md)
- [../engineering/ENGINEERING_GUIDE.md](../engineering/ENGINEERING_GUIDE.md)
- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)

## Related Engines

All 39 packages under `packages/*`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (`96b8634`).
