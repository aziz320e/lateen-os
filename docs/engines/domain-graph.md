---
title: Domain Graph Engine
title_ar: محرك الرسم البياني للنطاق
version: 1.0.0
status: active
package: "@lateen-os/domain-graph"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - business-dna
  - capability-engine
  - crm-engine
  - decision-engine
  - institutional-memory
---

# العربية

## الغرض

`@lateen-os/domain-graph` يعرّف العلاقات الدلالية القانونية بين كل كيانات Business DNA — رسم بياني مفاهيمي (نه، حواف، أنطولوجيا) يتيح الاستدلال حول التبعيات، مسارات التأثير، وأقصر المسارات بين الكيانات. حزمة بنية تحتية للنطاق (Domain Infrastructure)، تُستهلَك من قِبل حزم أخرى (مثل `crm-engine`، `decision-engine`) لفهم كيف ترتبط الكيانات ببعضها دون أن تحمل كل حزمة نسختها الخاصة من منطق العلاقات.

## المسؤوليات

- دورة حياة الرسم البياني (`GraphLifecycle`) وسجل الكيانات (`EntityRegistry`).
- محرك العلاقات (`RelationshipEngine`) لإنشاء وتحديث العلاقات بين العقد (Nodes).
- محرك الاجتياز (`TraversalEngine`): ترتيب التبعيات، اكتشاف الحلقات، أقصر مسار.
- محرك التحقق (`GraphValidationEngine`): كشف الكيانات المكررة والعلاقات المعلَّقة (Dangling).
- محرك البحث (`GraphSearchEngine`) عن الكيانات.
- أنطولوجيا قانونية ثابتة (`CANONICAL_ONTOLOGY`، `ONTOLOGY_SEMANTIC_ALIASES`، `ONTOLOGY_VERSION`) وأنواع عقد/علاقات معرَّفة مسبقًا (`GRAPH_NODE_DEFINITIONS`، `RELATIONSHIP_TYPE_DEFINITIONS`).
- طبقة استعلامات حقيقية وناقل أحداث نطاق مكتوب النوع.

## خارج نطاق المسؤولية

- لا قاعدة بيانات رسم بياني خارجية (Graph DB) — التخزين داخل الذاكرة بالكامل عبر `store/graph-repository.ts`.
- لا استدلال ذكاء اصطناعي.
- لا منطق أعمال خاص بأي حزمة مستهلكة (CRM، القرار، إلخ) — هذه الحزمة توفّر البنية التحتية العلائقية فقط.
- لا UI/API/HTTP.

## وقت التشغيل العام

جذر التركيب هو `createDomainGraphRuntime(deps: DomainGraphRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد `DomainGraphRuntime` بالحقول: `graphs`، `entities`، `relationships`، `traversal`، `validation`، `search`، `queries`، `events`.

## الاستعلامات العامة

`DomainGraphQueries`: `findEntity`، `searchEntities`، `findRelationships`، `findNeighbors`، `shortestPath`، `dependencyOrder`، `detectCycles`، `graphStatistics` — كلها مركّبة فقط فوق مستودع الرسم البياني، محرك البحث، ومحرك الاجتياز، دون كشف أي مستودع مباشرة.

## الأحداث المكتوبة النوع

`DOMAIN_GRAPH_EVENT_NAMES`: `entity.created`، `entity.updated`، `entity.archived`، `relationship.created`، `relationship.updated`، `relationship.deleted`، `graph.validated`، `graph.rebuilt`.

## الاعتماديات

حسب `package.json`: `@lateen-os/business-dna`، `@lateen-os/capability-engine`، `@lateen-os/shared-kernel`. فحص الشيفرة المصدرية (`src/shared/identifiers.ts`) يُظهر أن كلًّا من `business-dna` و`capability-engine` مستخدَمتان حصرًا لإعادة استخدام أنواع معرّفات (`OrganizationId` من الأولى، `CapabilityId` من الثانية) — وليس استدعاء أي خدمة تشغيلية من أي منهما.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع: `ai-brain`، `ai-runtime`، `analytics-engine`، `crm-engine`، `decision-engine`، `institutional-memory`، `intelligence-engine`، `marketing-engine`.

## نقاط التكامل

**لا يوجد مجلد `relationship-management/`** في هذه الحزمة. هذه من الحزم التسع المذكورة في `INTEGRATION_AUDIT.md` (F1) كحزم بدون طبقة علاقات مخصصة رغم اعتماديات شقيقة حقيقية — لكن الفحص المباشر يُظهر أن اعتماديات `domain-graph` الحقيقية (`business-dna`، `capability-engine`) هي إعادة استخدام أنواع معرّفات فقط، وليست تكاملًا تشغيليًا فعليًا صادرًا من هذه الحزمة نحو أي شقيق. الحزم التي **تعتمد على** `domain-graph` (مثل `crm-engine`) هي من يستهلك سطحه التشغيلي العام (`createDomainGraphRuntime()`)، عبر طبقة `relationship-management/` الخاصة بها هي، وليس العكس.

## ملاحظات معمارية

- مجلد باسم `relationship-engine/` (محرك العلاقات الداخلي بين عُقد الرسم البياني) موجود فعليًا في هذه الحزمة، منفصل تمامًا عن مفهوم `relationship-management/` (طبقة تكامل الحزم الشقيقة) الغائب هنا — تشابه تسمية يستحق الانتباه، مشابه لما لوحظ في `document-management-engine`.
- "مفردتا علاقة" متعايشتان عمدًا حسب `ARCHITECTURE.md` الخاص بالحزمة: نظام الأنطولوجيا الأصلي (`nodes/`، `RELATIONSHIP_TYPES` بأحرف كبيرة، `ontology/`) كأنواع وقواعد أنطولوجيا فقط، ومحرك العلاقات الحقيقي (`relationship-engine/`) كتنفيذ تشغيلي فعلي — هذا تصميم مقصود، وليس ازدواجية غير مقصودة.
- حزمة بنية تحتية للنطاق (Domain Infrastructure) وفق `AI_PROJECT_CONTEXT.md`، باعتماديات ضيقة ومقصودة (`business-dna`، `capability-engine`، `shared-kernel` فقط).

## قرارات التصميم

- فصل صارم بين محرك التحقق (يكتشف مشاكل البيانات) ومحرك الاجتياز (يحسب مسارات ونتائج) — يسمح باستهلاك أحدهما دون الآخر.
- أسماء العلاقات والعقد معرَّفة كسجلات ثابتة (`GRAPH_NODE_DEFINITIONS`، `RELATIONSHIP_TYPE_DEFINITIONS`) بدلًا من نصوص حرة، لضمان اتساق الأنطولوجيا عبر المنصة.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج فهم العلاقات بين الكيانات يجب أن تستهلك `createDomainGraphRuntime()` العام (خصوصًا `entities` و`relationships` و`queries`) وتحقن نفسها في طبقة `relationship-management/` الخاصة بها هي — لا يجوز تعديل `domain-graph` نفسه لخدمة مستهلك بعينه.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)
- [Capability Engine](./capability-engine.md)
- [CRM Engine](./crm-engine.md)
- [Decision Engine](./decision-engine.md)

---

# English

## Purpose

`@lateen-os/domain-graph` defines the canonical semantic relationships between every Business DNA entity — a conceptual graph (nodes, edges, ontology) enabling reasoning about dependencies, impact paths, and shortest paths between entities. A domain-infrastructure package, consumed by other packages (e.g. `crm-engine`, `decision-engine`) to understand how entities relate without each package carrying its own version of relationship logic.

## Responsibilities

- The Graph Lifecycle and the Entity Registry.
- The Relationship Engine, for creating and updating relationships between nodes.
- The Traversal Engine: dependency ordering, cycle detection, shortest path.
- The Validation Engine: detecting duplicate entities and dangling relationships.
- The Search Engine, for entities.
- A canonical, fixed ontology (`CANONICAL_ONTOLOGY`, `ONTOLOGY_SEMANTIC_ALIASES`, `ONTOLOGY_VERSION`) and predefined node/relationship type definitions (`GRAPH_NODE_DEFINITIONS`, `RELATIONSHIP_TYPE_DEFINITIONS`).
- A real query layer and a typed domain event bus.

## Non-responsibilities

- No external graph database — storage is entirely in-memory via `store/graph-repository.ts`.
- No AI inference.
- No business logic specific to any consuming package (CRM, Decision, etc.) — this package provides only relationship infrastructure.
- No UI/API/HTTP.

## Public Runtime

The composition root is `createDomainGraphRuntime(deps: DomainGraphRuntimeDeps = {})` in `src/runtime.ts`, returning a `DomainGraphRuntime` with: `graphs`, `entities`, `relationships`, `traversal`, `validation`, `search`, `queries`, `events`.

## Public Queries

`DomainGraphQueries`: `findEntity`, `searchEntities`, `findRelationships`, `findNeighbors`, `shortestPath`, `dependencyOrder`, `detectCycles`, `graphStatistics` — all composed purely over the graph repository, the search engine, and the traversal engine, never exposing a repository directly.

## Typed Events

`DOMAIN_GRAPH_EVENT_NAMES`: `entity.created`, `entity.updated`, `entity.archived`, `relationship.created`, `relationship.updated`, `relationship.deleted`, `graph.validated`, `graph.rebuilt`.

## Dependencies

Per `package.json`: `@lateen-os/business-dna`, `@lateen-os/capability-engine`, `@lateen-os/shared-kernel`. Source inspection (`src/shared/identifiers.ts`) shows both `business-dna` and `capability-engine` are used exclusively for identifier-type reuse (`OrganizationId` from the former, `CapabilityId` from the latter) — not calling any runtime service from either.

## Dependents

Verified by grepping `package.json` across the workspace: `ai-brain`, `ai-runtime`, `analytics-engine`, `crm-engine`, `decision-engine`, `institutional-memory`, `intelligence-engine`, `marketing-engine`.

## Integration Points

**There is no `relationship-management/` folder** in this package. This is one of the nine packages named in `INTEGRATION_AUDIT.md` (F1) as lacking a dedicated Relationship Layer despite real sibling dependencies — but direct inspection shows `domain-graph`'s real dependencies (`business-dna`, `capability-engine`) are identifier-type reuse only, not real outbound runtime integration from this package toward any sibling. Packages that **depend on** `domain-graph` (e.g. `crm-engine`) are the ones consuming its public runtime surface (`createDomainGraphRuntime()`), through their own `relationship-management/` layer — not the reverse.

## Architecture Notes

- A folder named `relationship-engine/` (the internal engine for relationships between graph nodes) genuinely exists in this package, entirely distinct from the `relationship-management/` concept (the sibling-integration layer), which is absent here — a naming similarity worth noting, similar to what was observed in `document-management-engine`.
- Two deliberately coexisting "relationship vocabularies" per the package's own `ARCHITECTURE.md`: the original ontology system (`nodes/`, upper-snake-case `RELATIONSHIP_TYPES`, `ontology/`) as types and ontology rules only, and the real Relationship Engine (`relationship-engine/`) as the actual runtime implementation — this is a deliberate design, not accidental duplication.
- A domain-infrastructure package per `AI_PROJECT_CONTEXT.md`, with narrow, intentional dependencies (`business-dna`, `capability-engine`, `shared-kernel` only).

## Design Decisions

- Strict separation between the Validation Engine (detects data problems) and the Traversal Engine (computes paths and results) — allowing one to be consumed without the other.
- Relationship and node names are defined as fixed registries (`GRAPH_NODE_DEFINITIONS`, `RELATIONSHIP_TYPE_DEFINITIONS`) rather than free text, ensuring ontology consistency across the platform.

## Extension Points

Any future package that needs to understand entity relationships should consume the public `createDomainGraphRuntime()` (particularly `entities`, `relationships`, and `queries`) and inject itself into its own `relationship-management/` layer — `domain-graph` itself must not be modified to serve a specific consumer.

## Related Engines

- [Business DNA](./business-dna.md)
- [Capability Engine](./capability-engine.md)
- [CRM Engine](./crm-engine.md)
- [Decision Engine](./decision-engine.md)
