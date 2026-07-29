---
title: AI Project Context (Handbook Bridge)
title_ar: سياق المشروع للذكاء الاصطناعي (جسر الكتيّب)
version: 1.0.0
status: active
phase: "Milestone 2 — Enterprise Platform (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - 00_MASTER_PLAN.md
  - 08_PROJECT_STATUS.md
  - 09_COMMIT_HISTORY.md
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/PLATFORM_CERTIFICATION.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## سياق المشروع للذكاء الاصطناعي — جسر الكتيّب

هذا الفصل قصير عمدًا. الفصول [00_MASTER_PLAN](./00_MASTER_PLAN.md) حتى [09_COMMIT_HISTORY](./09_COMMIT_HISTORY.md) هي **السجل التاريخي المُجمَّد للمرحلة 1** (Milestone 1، الالتزامات 1-25، تنتهي عند `d9616a0`) — لا تُعاد كتابتها لتشمل المرحلة 2؛ ذلك مقصود، تمامًا كما لا يُعاد كتابة فصل تاريخي في كتاب لمجرد وقوع أحداث لاحقة.

### 1. ماذا حدث بعد الفصل 09؟

اكتملت **المرحلة 2 — منصة المؤسسة (Milestone 2)** عبر 10 التزامات إضافية (26-35): `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `api-gateway`, `admin-console`, `marketplace`، ثم التزام تصديق واستقرار شامل (Commit 35: `96b8634`) دقّق المنصة بأكملها عبر سبعة أبعاد (العمارة، الاعتماديات، وقت التشغيل، التكامل، الأمن، الأداء، الاختبار).

### 2. أين المرجع الأشمل الآن؟

- **`docs/AI_PROJECT_CONTEXT.md`** (جذر `docs/`، وليس هنا) — الوثيقة التقنية الكاملة لفلسفة العمارة بعد المرحلتين، بما فيها "الحقبتان" لبناء الحزم، الخريطة الكاملة لـ39 حزمة، القواعد غير القابلة للتفاوض، وكيفية توسيع المنصة بأمان.
- **`docs/certification/`** (9 تقارير) — التصديق الكامل للمنصة بعد المرحلة 2: العمارة، الاعتماديات، وقت التشغيل، التكامل، الأمن، الأداء، الاختبار، والديْن التقني الموحّد.
- **`docs/engines/`** — وثيقة واحدة ثنائية اللغة لكل حزمة من الحزم الـ39.
- **`docs/architecture/`** (الملفات الجديدة، وليس تقارير `*-report-v1.md` الأقدم) — نماذج العمارة الموضوعية: خريطة الحزم، نموذج الاعتماديات، جذور التركيب، نموذج وقت التشغيل، نموذج الاستعلام، نموذج الأحداث، نموذج العلاقات، عمارة الأمن، عمارة الحوكمة، عمارة ERP.

### 3. القاعدة الذهبية لأي نظام ذكاء اصطناعي يعمل على هذا المستودع

اقرأ `docs/AI_PROJECT_CONTEXT.md` كاملًا قبل أي تعديل. لا تخترع معمارية. كل ادعاء يجب أن يأتي من التنفيذ الفعلي.

---

# English

## AI Project Context — Handbook Bridge

This chapter is deliberately short. Chapters [00_MASTER_PLAN](./00_MASTER_PLAN.md) through [09_COMMIT_HISTORY](./09_COMMIT_HISTORY.md) are the **frozen historical record of Phase 1** (Milestone 1, commits 1-25, ending at `d9616a0`) — they are not rewritten to cover Milestone 2; that is intentional, exactly as a history book's earlier chapter isn't rewritten just because later events occurred.

### 1. What Happened After Chapter 09?

**Milestone 2 — Enterprise Platform** completed across 10 further commits (26-35): `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `api-gateway`, `admin-console`, `marketplace`, followed by a comprehensive certification-and-stabilization commit (Commit 35: `96b8634`) that audited the whole platform across seven dimensions (architecture, dependency, runtime, integration, security, performance, testing).

### 2. Where Is the Fuller Reference Now?

- **`docs/AI_PROJECT_CONTEXT.md`** (at the `docs/` root, not here) — the complete technical document for the post-Milestone-2 architecture philosophy, including the "Two Eras" of package construction, the complete 39-package map, the non-negotiable rules, and how to safely extend the platform.
- **`docs/certification/`** (9 reports) — the full post-Milestone-2 platform certification: architecture, dependency, runtime, integration, security, performance, testing, and the consolidated technical-debt register.
- **`docs/engines/`** — one bilingual document per each of the 39 packages.
- **`docs/architecture/`** (the new files, not the older `*-report-v1.md` reports) — dedicated architecture models: package map, dependency model, composition roots, runtime model, query model, event model, relationship model, security architecture, governance architecture, ERP architecture.

### 3. The Golden Rule for Any AI System Working on This Repository

Read `docs/AI_PROJECT_CONTEXT.md` in full before making any change. Never invent architecture. Every claim must come from the real implementation.

---

## Related Documents

- [00_MASTER_PLAN](./00_MASTER_PLAN.md)
- [08_PROJECT_STATUS](./08_PROJECT_STATUS.md)
- [09_COMMIT_HISTORY](./09_COMMIT_HISTORY.md)
- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../certification/PLATFORM_CERTIFICATION.md](../certification/PLATFORM_CERTIFICATION.md)

## Related Engines

All 39 packages under `packages/*`.

## Related Commits

Commit 26 through Commit 35 (`96b8634`) — Milestone 2.
