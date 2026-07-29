---
title: Institutional Memory Engine
title_ar: الذاكرة المؤسسية
version: 1.0.0
status: active
package: "@lateen-os/institutional-memory"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - business-dna
  - domain-graph
  - finance-engine
  - hr-engine
  - inventory-engine
  - marketing-engine
---

# العربية

## الذاكرة المؤسسية — Institutional Memory

### 1. الغرض

`@lateen-os/institutional-memory` يمثّل **كل ما تتعلمه المنظمة عبر الزمن**: القرارات وأسبابها، دروس من الحوادث والمشاريع، نتائج البحث والرؤى، أدلة الإجراءات (Playbooks)، ونتائج الاجتماعات. إنها **ليست** سجل محادثات ولا سجلات (logs) — بل معرفة مؤسسية طويلة الأمد ومنسّقة يستهلكها الذكاء الاصطناعي الاستباقي والمشغّلون البشريون. حزمة بنية تحتية للنطاق (Domain Infrastructure) من الجيل الأول، وهي الحزمة الشقيقة التي تدمج معها معظم حزم النطاق التجاري الأخرى (Finance/HR/Inventory/Marketing وغيرها) عبر نمط تكامل حقيقي متكرر (`lifecycle.create()`).

### 2. المسؤوليات

- دورة حياة المعرفة (Knowledge Lifecycle): `create`/`update`/`archive`/`restore`/`requestReview`/`rollback` محمية بآلة حالة، مدعومة بمستودع حقيقي في-الذاكرة.
- إصدار المعرفة (Versioning): كل تحديث يغيّر المحتوى (وكل `rollback`) يُلحق لقطة `KnowledgeEntryVersion` غير قابلة للتغيير مع تتبّع المؤلف — لا تُعدَّل ولا تُحذف أبدًا.
- بحث المعرفة: بحث حتمي بالكلمات المفتاحية عبر العنوان/المحتوى + تصفية بالوسم/الفئة/المصدر/النوع/الحالة، مرتّب بنقاط صلة محسوبة — بدون تضمينات (embeddings)، بدون قاعدة بيانات متجهية.
- علاقات المعرفة: روابط ذات صلة (متماثلة)، هرمية أصل/فرع، وحواف مرجعية موجّهة تشكّل رسمًا بيانيًا للاعتماديات — كل كتابة محمية من الدورات.
- التحقق من المعرفة: كشف تكرار (تطابق عنوان تام + تشابه Jaccard للمحتوى)، كشف معرفة قديمة، تحقق ملكية، وفحوص انتهاء صلاحية.
- محرك الاحتفاظ: قواعد أرشفة، قواعد انتهاء صلاحية، جدولة مراجعة، وتشغيل تجريبي للتنظيف (`recommendCleanup()`) إلى جانب تطبيق فعلي (`applyRetentionRules()`).

### 3. خارج نطاق المسؤولية

- ليست سجل محادثات ولا سجلات نظام.
- لا تضمينات (embeddings)، لا قاعدة بيانات متجهية، لا استدلال بنماذج لغة كبيرة في أي مكان بهذه الحزمة.
- المجاميع العشرة الأخرى (`memory`، `decision`، `lesson`، `meeting`، `incident`، `playbook`، `research`، `template`، `document`، `timeline`) بالإضافة إلى `classification`/`confidence` هي **عقود فقط** — أنواع ومنافذ مستودع حقيقية دون منطق تشغيل، حقيقة موثّقة ذاتيًا في `README.md` وليست فجوة مخفية.

### 4. وقت التشغيل العام

جذر التركيب **`createInstitutionalMemoryRuntime(deps = {})`** في `src/runtime.ts` يُرجع `InstitutionalMemoryRuntime`: `lifecycle`، `search`، `relationships` (خدمة علاقات المعرفة نفسها، غير طبقة تكامل شقيقة)، `validation`، `retention`، `queries`، و`events`. جميع المستودعات تُبنى داخل `runtime.ts` فقط.

### 5. الاستعلامات العامة

طبقة `KnowledgeRuntimeQueries` حقيقية: `findKnowledge`، `findPolicies`، `findPlaybooks`، `findLessonsLearned`، `findTemplates`، `findRelatedKnowledge`، `findExpiringKnowledge`، `searchKnowledge`. كما يوجد عقد `MemoryQueries` أقدم أوسع نطاقًا مُصدَّر أيضًا.

### 6. الأحداث المكتوبة النوع

ثمانية أحداث حقيقية في `InstitutionalMemoryDomainEvent`: `knowledge.created`، `knowledge.updated`، `knowledge.archived`، `knowledge.restored`، `knowledge.version.created`، `knowledge.review.required`، `knowledge.expired`، `knowledge.relationship.created`.

### 7. الاعتماديات

`@lateen-os/business-dna`، `@lateen-os/domain-graph`، `@lateen-os/shared-kernel`. كلا الاعتماديتين الأوليين إعادة استخدام بنيوية للمعرّفات فقط (`OrganizationId`/`EmployeeId` من Business DNA، `GraphNodeId`/`GraphNodeType` من Domain Graph في `shared/identifiers.ts`) — لا استدعاء تشغيلي فعلي لأي منهما.

### 8. الحزم المعتمِدة

قائمة واسعة وحقيقية من المستهلكين عبر `packages/*`، من بينها ضمن هذه الدفعة: `finance-engine`، `hr-engine`، `inventory-engine`، `marketing-engine` — وأيضًا `admin-console`، `ai-brain`، `ai-runtime`، `ai-workforce`، `analytics-engine`، `communication-hub`، `crm-engine`، `customer-success-engine`، `decision-engine`، `document-management-engine`، `marketplace`، `multi-agent`، `project-management-engine`، `sales-engine`. هذا يجعلها من أكثر الحزم اعتمادًا عليها في المنصة.

### 9. نقاط التكامل

**لا يوجد مجلد `relationship-management/` في هذه الحزمة نفسها** — هذا واحد من 9 حزم حقيقية (موثّقة في `ARCHITECTURE_AUDIT.md` F4) تسبق اصطلاح طبقة العلاقات، رغم اعتمادها الحقيقي على Business DNA وDomain Graph (إعادة استخدام أنواع فقط، كما في القسم 7). في المقابل، هذه الحزمة هي **الطرف المُستقبِل** لتكامل حقيقي متكرر من حزم أخرى عبر توابع مثل `logFinanceDecisionToMemory()`، `logHrDecisionToMemory()`، `logInventoryDecisionToMemory()`، و`logCampaignToMemory()` — كل هذه الحزم تستدعي `lifecycle.create()` العام هنا فقط، أبدًا مستودعًا داخليًا.

### 10. ملاحظات معمارية

من أصل 11 مجاميع مُعرَّفة في هذه الحزمة، مجاميع `knowledge` فقط لديها تنفيذ حقيقي كامل (دورة حياة، إصدار، بحث، علاقات، تحقق، احتفاظ) — العشرة الباقية عقود أنواع ومنافذ مستودع فقط دون خدمة تشغيل. هذا حقيقي وموثّق ذاتيًا في `README.md`، وليس نقصًا مخفيًا أو placeholder.

### 11. قرارات التصميم

- كل تحديث يُغيّر المحتوى (وكل استرجاع/`rollback`) يُنشئ إصدارًا جديدًا غير قابل للتغيير — لا كتابة فوق تاريخ سابق أبدًا.
- كشف التكرار يجمع تطابق عنوان تام مع تشابه Jaccard للمحتوى — حساب حتمي، لا نموذج تشابه دلالي.
- البحث كلمات مفتاحية مرتبة بنقاط صلة محسوبة حسابيًا — لا تضمينات ولا قاعدة بيانات متجهية.
- كل كتابة علاقة محمية من الدورات (Cycle-guarded).

### 12. نقاط التوسعة

أي حزمة مستقبلية تريد تسجيل معرفة مؤسسية يجب أن تستهلك `createInstitutionalMemoryRuntime().lifecycle.create()` العام فقط (بنمط `Pick<InstitutionalMemoryRuntime, 'lifecycle'>` الحقني الاختياري المتدهور إلى `null`) — لا وصول مباشر لأي `repository.ts` داخلي، ولا تعديل هذه الحزمة لإضافة نوع معرفة جديد؛ توسعات `KnowledgeType` تمر عبر التزام مخصص لهذه الحزمة نفسها.

### 13. المحركات ذات الصلة

- [finance-engine](./finance-engine.md)
- [hr-engine](./hr-engine.md)
- [inventory-engine](./inventory-engine.md)
- [marketing-engine](./marketing-engine.md)

---

# English

## Institutional Memory Engine

### 1. Purpose

`@lateen-os/institutional-memory` represents **everything the organization learns over time**: decisions and their rationale, lessons from incidents and projects, research findings and insights, playbooks and procedures, and meeting outcomes. It is **not** chat history and **not** logs — it is curated, long-term institutional knowledge consumed by proactive AI and human operators. An Era-1 domain-infrastructure package, and the sibling that most other business-domain packages (Finance/HR/Inventory/Marketing and others) integrate with through a real, repeated pattern (`lifecycle.create()`).

### 2. Responsibilities

- Knowledge Lifecycle: guarded state-machine `create`/`update`/`archive`/`restore`/`requestReview`/`rollback`, backed by a real in-memory repository.
- Knowledge Versioning: every content-changing `update()` (and every `rollback()`) appends an immutable `KnowledgeEntryVersion` snapshot with author tracking — never mutated or deleted.
- Knowledge Search: deterministic keyword search over title/content plus tag/category/source/type/status filtering, ranked by a computed relevance score — no embeddings, no vector database.
- Knowledge Relationships: related links (symmetric), parent/child hierarchy, and directed reference edges forming a dependency graph — every write is cycle-guarded.
- Knowledge Validation: duplicate detection (exact title + Jaccard content similarity), stale-knowledge detection, ownership validation, and expiration checks.
- Retention Engine: archive rules, expiration rules, review scheduling, and a pure dry-run cleanup recommendation (`recommendCleanup()`) alongside a mutating `applyRetentionRules()`.

### 3. Non-responsibilities

- Not chat history and not system logs.
- No embeddings, no vector database, no LLM/AI inference anywhere in this package.
- The other 10 aggregates (`memory`, `decision`, `lesson`, `meeting`, `incident`, `playbook`, `research`, `template`, `document`, `timeline`) plus `classification`/`confidence` are **contracts only** — real types and repository ports with no runtime behavior, a fact self-documented in `README.md`, not a hidden gap.

### 4. Public Runtime

The composition root **`createInstitutionalMemoryRuntime(deps = {})`** in `src/runtime.ts` returns an `InstitutionalMemoryRuntime`: `lifecycle`, `search`, `relationships` (the knowledge-relationship service itself, not a sibling-integration layer), `validation`, `retention`, `queries`, and `events`. All repositories are constructed only inside `runtime.ts`.

### 5. Public Queries

A real `KnowledgeRuntimeQueries` layer: `findKnowledge`, `findPolicies`, `findPlaybooks`, `findLessonsLearned`, `findTemplates`, `findRelatedKnowledge`, `findExpiringKnowledge`, `searchKnowledge`. An older, broader `MemoryQueries` contract is also exported.

### 6. Typed Events

Eight real events in `InstitutionalMemoryDomainEvent`: `knowledge.created`, `knowledge.updated`, `knowledge.archived`, `knowledge.restored`, `knowledge.version.created`, `knowledge.review.required`, `knowledge.expired`, `knowledge.relationship.created`.

### 7. Dependencies

`@lateen-os/business-dna`, `@lateen-os/domain-graph`, `@lateen-os/shared-kernel`. Both of the first two are structural, type-only identifier reuse (`OrganizationId`/`EmployeeId` from Business DNA, `GraphNodeId`/`GraphNodeType` from Domain Graph, in `shared/identifiers.ts`) — no actual runtime call to either.

### 8. Dependents

A wide, real list of consumers across `packages/*`, including within this batch: `finance-engine`, `hr-engine`, `inventory-engine`, `marketing-engine` — and also `admin-console`, `ai-brain`, `ai-runtime`, `ai-workforce`, `analytics-engine`, `communication-hub`, `crm-engine`, `customer-success-engine`, `decision-engine`, `document-management-engine`, `marketplace`, `multi-agent`, `project-management-engine`, `sales-engine`. This makes it one of the most widely depended-upon packages on the platform.

### 9. Integration Points

**This package itself has no `relationship-management/` folder** — it is one of 9 real packages (documented in `ARCHITECTURE_AUDIT.md` F4) that predate the Relationship Layer convention, despite its own real dependency on Business DNA and Domain Graph (type reuse only, per §7). Conversely, this package is the **receiving end** of a real, repeated integration from other packages via methods such as `logFinanceDecisionToMemory()`, `logHrDecisionToMemory()`, `logInventoryDecisionToMemory()`, and `logCampaignToMemory()` — every one of those packages calls this package's public `lifecycle.create()` only, never an internal repository.

### 10. Architecture Notes

Of the 11 aggregates defined in this package, only the `knowledge` aggregate has a full real implementation (lifecycle, versioning, search, relationships, validation, retention) — the other 10 are types-and-repository-port contracts with no runtime service. This is real and self-documented in `README.md`, not a hidden gap or a placeholder.

### 11. Design Decisions

- Every content-changing update (and every restore/`rollback`) creates a new, immutable version — a prior revision is never overwritten.
- Duplicate detection combines exact title matching with Jaccard content similarity — a deterministic calculation, not a semantic-similarity model.
- Search is keyword-based, ranked by an arithmetically computed relevance score — no embeddings, no vector database.
- Every relationship write is cycle-guarded.

### 12. Extension Points

Any future package that wants to record institutional knowledge should consume the public `createInstitutionalMemoryRuntime().lifecycle.create()` only (following the `Pick<InstitutionalMemoryRuntime, 'lifecycle'>` optional-injection, degrade-to-`null` pattern) — no direct access to any internal `repository.ts`, and no modification of this package to add a new knowledge type; `KnowledgeType` extensions go through this package's own dedicated commit.

### 13. Related Engines

- [finance-engine](./finance-engine.md)
- [hr-engine](./hr-engine.md)
- [inventory-engine](./inventory-engine.md)
- [marketing-engine](./marketing-engine.md)
