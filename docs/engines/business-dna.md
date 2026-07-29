---
title: Business DNA Engine
title_ar: محرك الحمض النووي للأعمال
version: 1.0.0
status: active
package: "@lateen-os/business-dna"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - capability-engine
  - domain-graph
  - decision-engine
  - crm-engine
  - communication-hub
  - customer-success-engine
  - document-management-engine
---

# العربية

## الغرض

`@lateen-os/business-dna` هو النموذج القانوني الوحيد للعمل في منصة Lateen OS — الطبقة 1 من العمارة (Architecture v1.0 Locked). هو **المصدر الوحيد للحقيقة** لكل من: المنظمة، الفروع، الأقسام، الموظفين، العملاء، الموردين، المنتجات، الخدمات، الآلات، المشاريع، عروض الأسعار، الطلبات، الفواتير، سير العمل، السياسات، مؤشرات الأداء، الأصول، الوكلاء، الأدوار، الصلاحيات، ملف العمل، الرؤية والرسالة، ملف الحمض النووي للعمل (ICP/الشخصيات/التموضع/نبرة الصوت)، نموذج السوق، والمنافسين. كل حزمة أخرى في المنصة تستهلك أنواع هذه الحزمة بدلاً من أن تحتفظ بنسختها الخاصة من الحقيقة.

الحقيقة المعمارية الأهم: **`business-dna` هو المصدر الوحيد لنوع `OrganizationId`** (نوع تعدد المستأجرين/tenancy) — كل حزمة أخرى في المنصة تستورد هذا النوع من `@lateen-os/business-dna` (إعادة استخدام على مستوى النوع فقط، بما أن `OrganizationId` هو اسم مستعار لسلسلة نصية بسيطة وليس نوعًا ذا علامة اسمية) بدلًا من إعادة تعريف مفهوم تعدد المستأجرين بشكل مستقل.

## المسؤوليات

- تعريف أنواع التجميع (Aggregates) والقيم لكل الكيانات المذكورة أعلاه.
- توفير منافذ مستودع (Repository ports) لكل تجميع — بدون أي تنفيذ مباشر يُعرض للخارج.
- تشغيل حقيقي وحتمي داخل الذاكرة لثمانية أنظمة فرعية عبر جذر التركيب: دورة حياة المنظمة، ملف العمل، محرك الرؤية والرسالة، محرك الحمض النووي للعمل، نموذج السوق، سجل المنافسين، كتالوج المنتجات، ومحرك السياسات.
- طبقة استعلامات (CQRS) للقراءة فقط فوق مستودعات الحزمة نفسها.
- ناقل أحداث نطاق مكتوب النوع (Typed Domain Event Bus) لأحداث دورة حياة المنظمة، ملف العمل، المنتجات، المنافسين، والسياسات.

## خارج نطاق المسؤولية

- لا واجهة مستخدم، لا API/HTTP، لا قاعدة بيانات/ORM.
- لا منطق أعمال خارج ما تنفذه الخدمات الثماني المذكورة أعلاه؛ الـ 18 تجميعًا المتبقية (الفرع، القسم، الموظف، العميل، المورد، الخدمة، الآلة، المشروع، عرض السعر، الطلب، الفاتورة، سير العمل، مؤشر الأداء، الأصل، الوكيل، الدور، الصلاحية) تبقى أنواعًا ومنافذ مستودع فقط دون تنفيذ حقيقي في هذه الحزمة.
- لا استدعاء لنماذج لغة كبيرة ولا استدلال ذكاء اصطناعي.
- لا تكامل حقيقي مع حزم شقيقة (لا اعتمادية على أي حزمة سوى `shared-kernel`).

## وقت التشغيل العام

جذر التركيب هو `createBusinessDnaRuntime(deps: BusinessDnaRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد كائن `BusinessDnaRuntime` يحتوي على: `organization`، `businessProfile`، `visionMission`، `dna`، `market`، `competitors`، `products`، `policies`، `queries`، و`events`. المستودعات (Repositories) تُبنى داخل `runtime.ts` فقط ولا تظهر أبدًا في السطح العام المُعاد.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`BusinessDnaQueries`) وتحتوي: `findOrganizations`، `findBusinessProfile`، `findProducts`، `findCompetitors`، `findPolicies`، `findMarkets` — كلها مركّبة فقط فوق مستودعات الحزمة نفسها.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`createBusinessDnaEventBus()`) بالأحداث التالية: `organization.created`، `organization.updated`، `organization.archived`، `organization.restored`، `organization.activated`، `organization.suspended`، `business-profile.updated`، `product.created`، `product.updated`، `competitor.registered`، `policy.updated`.

## الاعتماديات

`@lateen-os/shared-kernel` فقط (حسب `package.json`) — أدنى بصمة اعتمادية ممكنة في المنصة، ما يجعلها الحزمة التأسيسية للنموذج التجاري.

## الحزم المعتمِدة

عدد كبير من حزم المنصة يعتمد عليها مباشرة (بحث فعلي في `package.json` عبر كل الحزم)، من ضمنها الحزم العشر المشمولة في هذه الدفعة التوثيقية: `capability-engine`، `communication-hub`، `crm-engine`، `customer-success-engine`، `decision-engine`، `document-management-engine`، `domain-graph`. كما تعتمد عليها: `admin-console`، `ai-brain`، `ai-compliance-engine`، `ai-governance-engine`، `ai-runtime`، `ai-security-engine`، `ai-workforce`، `analytics-engine`، `api-gateway`، `finance-engine`، `hr-engine`، `institutional-memory`، `intelligence-engine`، `inventory-engine`، `marketing-engine`، `marketplace`، `multi-agent`، `project-management-engine`، `sales-engine`، `sdk`، `workflow-engine`.

## نقاط التكامل

لا يوجد مجلد `relationship-management/` في هذه الحزمة ولا تكامل حقيقي مع أي حزمة شقيقة — وهذا صحيح معماريًا: `business-dna` حزمة تأسيسية/ورقة (leaf) في رسم الاعتماديات، والتكامل يسير في اتجاه واحد فقط من كل حزمة أخرى نحوها.

## ملاحظات معمارية

- المصدر الوحيد لنوع `OrganizationId` على مستوى المنصة بأكملها.
- ثماني خدمات فقط من أصل 26 تجميعًا معرّفًا لها تنفيذ حقيقي داخل جذر التركيب؛ الباقي أنواع وعقود منافذ مستودع فقط — هذا موثّق صراحة في `ARCHITECTURE.md` الخاص بالحزمة وليس نقصًا مخفيًا.
- لا اعتمادية دائرية ولا اعتمادية حقيقية على أي حزمة شقيقة على الإطلاق.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية.
- ناقل الأحداث اختياري في `BusinessDnaRuntimeDeps` ويُنشأ افتراضيًا عبر `createBusinessDnaEventBus()` إن لم يُحقن.
- أسماء الأحداث تتبع اصطلاح `noun.verb` بصيغة الماضي.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات من `business-dna` يجب أن تستهلك `createBusinessDnaRuntime()` العام فقط (أو أنواعه المُصدَّرة مثل `OrganizationId`) — لا يجوز أبدًا الوصول إلى مستودعاتها الداخلية أو تعديل هذه الحزمة لخدمة حزمة أخرى.

## المحركات ذات الصلة

- [Capability Engine](./capability-engine.md)
- [Domain Graph](./domain-graph.md)
- [Decision Engine](./decision-engine.md)
- [CRM Engine](./crm-engine.md)
- [Communication Hub](./communication-hub.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)

---

# English

## Purpose

`@lateen-os/business-dna` is the sole canonical business model for the Lateen OS platform — Layer 1 of the architecture (Architecture v1.0 Locked). It is the **single source of truth** for: the organization, branches, departments, employees, customers, suppliers, products, services, machines, projects, quotations, orders, invoices, workflows, policies, KPIs, assets, agents, roles, permissions, the business profile, vision & mission, the Business DNA profile (ICP/personas/positioning/tone of voice), the market model, and competitors. Every other package in the platform consumes this package's types instead of keeping its own version of the truth.

The single most important architectural fact: **`business-dna` is the sole source of the `OrganizationId` type** (the tenancy type) — every other package imports this type from `@lateen-os/business-dna` (a type-only reuse, since `OrganizationId` is a plain string alias, not a nominally-branded type) rather than redefining tenancy independently.

## Responsibilities

- Defines aggregate and value types for every entity listed above.
- Provides repository ports for every aggregate — no implementation exposed externally.
- Runs a real, deterministic, in-memory implementation for eight subdomains through its composition root: Organization Lifecycle, Business Profile, Vision & Mission Engine, Business DNA Engine, Market Model, Competitor Registry, Product Catalog, and Policy Engine.
- A read-only CQRS query layer over the package's own repositories.
- A typed domain event bus for organization-lifecycle, business-profile, product, competitor, and policy events.

## Non-responsibilities

- No UI, no API/HTTP, no database/ORM.
- No business logic beyond the eight services above; the remaining 18 aggregates (branch, department, employee, customer, supplier, service, machine, project, quotation, order, invoice, workflow, KPI, asset, agent, role, permission) remain types and repository-port contracts only, with no real implementation in this package.
- No LLM calls, no AI inference.
- No real integration with sibling packages (no dependency on anything but `shared-kernel`).

## Public Runtime

The composition root is `createBusinessDnaRuntime(deps: BusinessDnaRuntimeDeps = {})` in `src/runtime.ts`, returning a `BusinessDnaRuntime` object with: `organization`, `businessProfile`, `visionMission`, `dna`, `market`, `competitors`, `products`, `policies`, `queries`, and `events`. Repositories are constructed only inside `runtime.ts` and never appear on the returned surface.

## Public Queries

A real `queries/` layer (`BusinessDnaQueries`) exposes: `findOrganizations`, `findBusinessProfile`, `findProducts`, `findCompetitors`, `findPolicies`, `findMarkets` — all composed purely over this package's own repositories.

## Typed Events

A real event bus (`createBusinessDnaEventBus()`) with: `organization.created`, `organization.updated`, `organization.archived`, `organization.restored`, `organization.activated`, `organization.suspended`, `business-profile.updated`, `product.created`, `product.updated`, `competitor.registered`, `policy.updated`.

## Dependencies

`@lateen-os/shared-kernel` only (per `package.json`) — the smallest possible dependency footprint on the platform, making it the foundational package for the business model.

## Dependents

A large share of the platform depends on it directly (verified by grepping every `package.json`), including all ten packages in this documentation batch: `capability-engine`, `communication-hub`, `crm-engine`, `customer-success-engine`, `decision-engine`, `document-management-engine`, `domain-graph`. Also depending on it: `admin-console`, `ai-brain`, `ai-compliance-engine`, `ai-governance-engine`, `ai-runtime`, `ai-security-engine`, `ai-workforce`, `analytics-engine`, `api-gateway`, `finance-engine`, `hr-engine`, `institutional-memory`, `intelligence-engine`, `inventory-engine`, `marketing-engine`, `marketplace`, `multi-agent`, `project-management-engine`, `sales-engine`, `sdk`, `workflow-engine`.

## Integration Points

No `relationship-management/` folder exists in this package, and it has no real integration with any sibling — this is architecturally correct: `business-dna` is a foundational/leaf package in the dependency graph, and integration flows one-way, from every other package toward it.

## Architecture Notes

- Sole source of `OrganizationId` across the entire platform.
- Only eight of the 26 defined aggregates have a real implementation wired into the composition root; the rest are types and repository-port contracts only — explicitly documented in the package's own `ARCHITECTURE.md`, not a hidden gap.
- No circular dependency, and no real dependency on any sibling package whatsoever.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to the deterministic `nowIso`.
- The event bus is optional in `BusinessDnaRuntimeDeps` and defaults to a fresh `createBusinessDnaEventBus()` if not injected.
- Event names follow the `noun.verb` past-tense convention.

## Extension Points

Any future package that needs data from `business-dna` should consume only the public `createBusinessDnaRuntime()` (or its exported types, such as `OrganizationId`) — it must never reach into this package's internal repositories, nor should this package ever be modified to accommodate another package's needs.

## Related Engines

- [Capability Engine](./capability-engine.md)
- [Domain Graph](./domain-graph.md)
- [Decision Engine](./decision-engine.md)
- [CRM Engine](./crm-engine.md)
- [Communication Hub](./communication-hub.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)
