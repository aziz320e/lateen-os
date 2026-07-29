---
title: Constitution
title_ar: الدستور
version: 1.0.0
status: active
phase: "Phase 1 — Platform Foundation (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-28
related_documents:
  - 00_MASTER_PLAN.md
  - 02_PHILOSOPHY.md
  - 08_PROJECT_STATUS.md
related_engines:
  - all
related_commits:
  - "1-25"
---

# العربية

## الدستور

هذا هو الدستور المعماري الرسمي لـ Lateen OS. القواعد هنا **ملزمة**، ومشتقة من قرارات معمارية موثّقة (`docs/adr/`) وأنماط مطبّقة فعليًا عبر الحزم الثلاثين في `packages/`. أي انحراف عن هذه القواعد يتطلب ADR جديدًا يوثّق الاستثناء وسببه.

### 1. قواعد العمارة

1. العمارة النظيفة إلزامية (ADR 0001): منطق النطاق والتطبيق يعتمد فقط على التجريدات؛ التنفيذات الملموسة تُحقن وقت التركيب.
2. الاعتماديات تتجه دائمًا من الطبقات العليا نحو الطبقات الدنيا، أبدًا العكس.
3. `shared-kernel` هو الطبقة صفر — لا يعتمد على أي حزمة أخرى في المنصة.
4. `business-dna` (الطبقة 1) هو نموذج النطاق القانوني الوحيد — يُصدّر أنواعًا وأحداثًا ومنافذ مستودع فقط، بلا منطق أعمال أو تخزين.

### 2. قواعد الاعتماديات

1. **لا اعتماديات دائرية بين الحزم** (ADR 0003) — يُفرض عبر الرسم البياني لمساحة عمل `pnpm` ونظام بناء `turbo`.
2. إذا احتاجت حزمة "دنيا" مفهومًا من حزمة "عليا"، يُستخرج المفهوم المشترك إلى الأسفل (عادة إلى `shared-kernel`) بدلًا من إنشاء دورة.
3. أي وصول إلى نموذج لغة كبير (LLM) يجب أن يمر عبر `ai-provider-hub` فقط (ADR 0002) — ممنوع استدعاء SDK مزوّد مباشرة من أي حزمة أعمال.
4. الحزم الأمنية والحوكمية والامتثالية (`ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`) تعتمد على `ai-brain`/`ai-runtime` عند الحاجة، لكن لا يُسمح لأي محرك أعمال بتجاوزها للوصول إلى قدرات حساسة مباشرة.

### 3. قواعد الحزم

1. كل حزمة تحت `packages/*` تحمل النطاق `@lateen-os/*` وتُوسّع `@lateen-os/typescript-config`.
2. كل حزمة تُصدّر نقطة دخول واحدة (`src/index.ts`) توثّق غرض الحزمة عبر تعليق `@packageDocumentation`.
3. البنية الداخلية القياسية للحزمة: `shared/` (الأنواع والأحداث الأساسية)، مجلد فرعي لكل نطاق فرعي (مثل `opportunity/`, `quote/`)، `events/` (ناقل أحداث مكتوب النوع)، `queries/` (طبقة استعلام للقراءة)، و`runtime.ts` (جذر التركيب).
4. لا تُعدَّل حزمة لخدمة حاجة حزمة أخرى لا علاقة لها بنطاقها (مبدأ CLAUDE.md: "Never modify unrelated packages").

### 4. قواعد المستودع (Repository)

1. منافذ المستودع (repository ports) تُعرَّف في الحزم النطاقية (`business-dna`, `domain-graph`...) كواجهات فقط — بلا تنفيذ.
2. التنفيذات الفعلية (عادة مستودعات في-الذاكرة) تعيش داخل الحزمة التي تحتاجها، وتُنشأ حصرًا داخل `runtime.ts`.
3. المستودعات **لا تُصدَّر أبدًا** كجزء من سطح الـ Runtime العام المُرجَع من `createXRuntime()` — يُحقن فقط السلوك (الخدمات) المبني فوقها.

### 5. قواعد وقت التشغيل (Runtime)

1. كل محرك يُصدّر دالة تركيب واحدة بصيغة `createXRuntime(deps?)` تُرجع كائن `XRuntime` متماسكًا.
2. `runtime.ts` هو الملف الوحيد المخوَّل بإنشاء المستودعات وربط الخدمات ببعضها.
3. الاعتماديات الاختيارية (`deps`) تسمح بحقن ناقل أحداث خارجي، دالة وقت (`now`)، أو أجزاء من runtime حزمة أخرى (مثل `BusinessDnaRuntime`) — لا تُفرض اعتماديات صلبة غير قابلة للاستبدال في الاختبار.

### 6. قواعد التركيب (Composition)

1. `sdk` هو نقطة التركيب الرسمية على مستوى المنصة (`createLateen()`) — يجمع المحركات دون أن يحتوي منطق أعمال خاصًا به.
2. لا يُسمح لتطبيق (application) بتركيب المحركات يدويًا متجاوزًا `sdk` إذا كان الهدف سلوكًا مدعومًا رسميًا.

### 7. قواعد الاستعلام (Query)

1. كل حزمة تعرض بيانات للقراءة عبر طبقة `queries/` منفصلة عن طبقة الكتابة/السلوك.
2. طبقة الاستعلام لا تُعدِّل الحالة أبدًا — قراءة فقط.

### 8. قواعد الأحداث (Event)

1. تسمية الأحداث تتبع الصيغة القانونية `{entity}.{action}` (مثال: `lead.created`, `opportunity.won`, `customer.updated`).
2. كل حزمة تمتلك ناقل أحداث مكتوب النوع خاصًا بها (`create{X}EventBus`) ضمن مجلد `events/`.
3. الأحداث تُصدَر بعد نجاح التغيير في الحالة، لا قبله.

### 9. قواعد الاختبار

1. كل منطق أعمال يجب أن يكون قابلًا للاختبار دون اتصال شبكي أو مزوّد LLM حي.
2. حزمة `integration-tests` تتحقق من عمل المحركات معًا عبر `createLateen()` — أي تغيير يكسر التكامل بين محركين يجب أن يظهر هنا أولًا.
3. لا يُدمج أي كود إذا فشلت الاختبارات (قاعدة CLAUDE.md القسم 3).

### 10. قواعد التسمية

1. أسماء الحزم: `kebab-case` مسبوقة بنطاق `@lateen-os/`.
2. أسماء دوال التركيب: `createXRuntime`, `createXQueries`, `createXEventBus`, `createXRepository` — نمط ثابت عبر كل الحزم.
3. أسماء الأحداث: `entity.action` بصيغة snake حروف صغيرة.

### 11. قواعد التوثيق

1. كل حزمة تحمل تعليق `@packageDocumentation` في `index.ts` يشرح الغرض، الحدود، وجذر التركيب.
2. كل مستند في `docs/handbook/` ثنائي اللغة (عربي/إنجليزي) بترويسة YAML موحدة.
3. لا تكرار للمعلومة نفسها بصياغتين مختلفتين داخل نفس المستند.

### 12. قواعد الالتزام (Commit)

1. ميزة منطقية واحدة لكل التزام؛ لا خلط عمل غير مترابط.
2. لا التزام إذا فشل البناء أو الاختبارات.
3. رسالة الالتزام تتبع صيغة `type(scope): description` (مثال: `feat(sales-engine): implement real sales engine`).

### 13. قواعد الأمن

1. كل هوية، مصادقة، وتفويض تمر عبر `ai-security-engine` — لا تنفيذ أمني موازٍ داخل محرك أعمال.
2. أسرار (secrets) لا تُخزَّن أو تُسجَّل كنص صريح في أي طبقة أعلى.

### 14. قواعد الحوكمة

1. أي قرار يتطلب موافقة بشرية يمر عبر محرك الموافقة البشرية في `ai-governance-engine`.
2. سياسات الحوكمة (على مستوى النموذج، الوكيل، سير العمل) مركزية ولا تُكرَّر محليًا داخل كل محرك.

### 15. قواعد الامتثال

1. كل إطار امتثال (framework)، وعنصر تحكم (control)، ودليل (evidence) يُدار حصرًا عبر `ai-compliance-engine`.
2. الاحتفاظ بالسجلات (retention) والتدقيق (audit) يتبعان سياسة مركزية واحدة عبر المنصة، لا سياسات متفرقة لكل محرك.

---

# English

## Constitution

This is the official architectural constitution of Lateen OS. The rules here are **binding**, and are derived from documented architecture decisions (`docs/adr/`) and patterns actually implemented across the thirty packages in `packages/`. Any deviation from these rules requires a new ADR documenting the exception and its rationale.

### 1. Architecture Rules

1. Clean Architecture is mandatory (ADR 0001): domain and application logic depends only on abstractions; concrete implementations are injected at composition time.
2. Dependencies always flow from higher layers to lower layers, never the reverse.
3. `shared-kernel` is Layer Zero — it depends on no other package in the platform.
4. `business-dna` (Layer 1) is the sole canonical domain model — it exports types, events, and repository ports only, with no business logic or storage.

### 2. Dependency Rules

1. **No cyclic dependencies between packages** (ADR 0003) — enforced through the `pnpm` workspace graph and the `turbo` build system.
2. If a "lower" package needs a concept from a "higher" one, the shared concept is extracted downward (typically into `shared-kernel`) instead of creating a cycle.
3. Any access to a large language model (LLM) must go through `ai-provider-hub` only (ADR 0002) — calling a provider SDK directly from any business package is forbidden.
4. Security, governance, and compliance packages (`ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`) depend on `ai-brain`/`ai-runtime` where needed, but no business engine is permitted to bypass them to reach sensitive capabilities directly.

### 3. Package Rules

1. Every package under `packages/*` carries the `@lateen-os/*` scope and extends `@lateen-os/typescript-config`.
2. Every package exports a single entry point (`src/index.ts`) documenting the package's purpose via a `@packageDocumentation` comment.
3. Standard internal package structure: `shared/` (core types and events), one subfolder per subdomain (e.g. `opportunity/`, `quote/`), `events/` (a typed event bus), `queries/` (the read layer), and `runtime.ts` (the composition root).
4. A package is never modified to serve the needs of an unrelated package (CLAUDE.md principle: "Never modify unrelated packages").

### 4. Repository Rules

1. Repository ports are defined in domain packages (`business-dna`, `domain-graph`, ...) as interfaces only — no implementation.
2. Actual implementations (typically in-memory repositories) live inside the package that needs them, and are created exclusively inside `runtime.ts`.
3. Repositories are **never exported** as part of the public runtime surface returned by `createXRuntime()` — only the behavior (services) built on top of them is injected out.

### 5. Runtime Rules

1. Every engine exports exactly one composition function, shaped `createXRuntime(deps?)`, returning a coherent `XRuntime` object.
2. `runtime.ts` is the only file authorized to create repositories and wire services together.
3. Optional dependencies (`deps`) allow injecting an external event bus, a clock function (`now`), or parts of another package's runtime (e.g. `BusinessDnaRuntime`) — no hard, untestable dependency is forced.

### 6. Composition Rules

1. `sdk` is the official platform-level composition point (`createLateen()`) — it assembles engines without containing business logic of its own.
2. An application is not permitted to hand-compose engines bypassing `sdk` when the goal is officially supported behavior.

### 7. Query Rules

1. Every package that exposes readable data does so through a `queries/` layer separate from the write/behavior layer.
2. The query layer never mutates state — read-only, always.

### 8. Event Rules

1. Event naming follows the canonical `{entity}.{action}` convention (e.g. `lead.created`, `opportunity.won`, `customer.updated`).
2. Every package owns its own typed event bus (`create{X}EventBus`) inside an `events/` folder.
3. Events are emitted after a state change succeeds, never before.

### 9. Testing Rules

1. All business logic must be testable without network access or a live LLM provider.
2. The `integration-tests` package verifies that engines work together through `createLateen()` — any change that breaks integration between two engines must surface here first.
3. No code is merged if tests fail (CLAUDE.md, Section 3).

### 10. Naming Rules

1. Package names: `kebab-case`, prefixed with the `@lateen-os/` scope.
2. Composition function names: `createXRuntime`, `createXQueries`, `createXEventBus`, `createXRepository` — a fixed pattern across every package.
3. Event names: lowercase `entity.action`.

### 11. Documentation Rules

1. Every package carries a `@packageDocumentation` comment in `index.ts` explaining purpose, boundaries, and its composition root.
2. Every document in `docs/handbook/` is bilingual (Arabic/English) with a uniform YAML header.
3. The same information is never duplicated in two different phrasings within the same document.

### 12. Commit Rules

1. One logical feature per commit; no mixing of unrelated work.
2. No commit if build or tests fail.
3. Commit messages follow `type(scope): description` (e.g. `feat(sales-engine): implement real sales engine`).

### 13. Security Rules

1. All identity, authentication, and authorization flow through `ai-security-engine` — no parallel security implementation inside a business engine.
2. Secrets are never stored or logged as plaintext in any higher layer.

### 14. Governance Rules

1. Any decision requiring human approval flows through the human approval engine in `ai-governance-engine`.
2. Governance policies (model-level, agent-level, workflow-level) are centralized and never duplicated locally inside each engine.

### 15. Compliance Rules

1. Every compliance framework, control, and piece of evidence is managed exclusively through `ai-compliance-engine`.
2. Retention and audit follow one centralized platform-wide policy, not scattered per-engine policies.

---

## Related Documents

- [00_MASTER_PLAN](./00_MASTER_PLAN.md)
- [02_PHILOSOPHY](./02_PHILOSOPHY.md)
- [08_PROJECT_STATUS](./08_PROJECT_STATUS.md)

## Related Engines

All 23 implemented engines — governed uniformly by this constitution.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 25 (`d9616a0`) — see [09_COMMIT_HISTORY](./09_COMMIT_HISTORY.md).
