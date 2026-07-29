---
title: CRM Engine
title_ar: محرك إدارة علاقات العملاء
version: 1.0.0
status: active
package: "@lateen-os/crm-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - business-dna
  - domain-graph
  - institutional-memory
  - communication-hub
  - customer-success-engine
  - document-management-engine
---

# العربية

## الغرض

`@lateen-os/crm-engine` هو محرك إدارة علاقات العملاء في Lateen OS: إدارة العملاء، العملاء المحتملين (Leads)، جهات الاتصال، الحسابات، والفرص (Opportunities). تنفيذ حقيقي وحتمي وبدون اتصال، ويُعدّ المصدر الذي تعتمد عليه معظم محركات الأعمال الأخرى (المبيعات، التسويق، الاتصالات، نجاح العملاء، إدارة المستندات) للوصول إلى بيانات العملاء.

## المسؤوليات

- دورة حياة العميل (`Customer`) — بما فيها دمج العملاء المكررين (`MergeCustomersResult`).
- دورة حياة العميل المحتمل، بما فيها تحويله إلى عميل (`ConvertLeadInput`/`ConvertLeadResult`).
- إدارة جهات الاتصال والحسابات.
- خط أنابيب الفرص (`OpportunityPipeline`) بمراحل صفقة قابلة للانتقال (`canTransitionDealStage`).
- الخط الزمني للأنشطة (`ActivityTimeline`).
- **كشف التكرار (Duplicate Detection)**: محرك حقيقي يطبّع البريد الإلكتروني والهاتف والنص (`normalizeEmail`، `normalizePhone`، `normalizeText`) ويكتشف التطابقات (`detectDuplicates`).
- طبقة علاقات (Relationship Layer) مع Domain Graph وInstitutional Memory، وطبقة استعلامات وناقل أحداث.

## خارج نطاق المسؤولية

- لا منطق مبيعات أو تسويق أو اتصالات — هذه مسؤولية `sales-engine`، `marketing-engine`، `communication-hub` التي تستهلك CRM Engine، وليس العكس.
- لا استدلال ذكاء اصطناعي.
- لا تخزين دائم يتجاوز المستودعات داخل الذاكرة.
- لا UI/API/HTTP.

## وقت التشغيل العام

جذر التركيب هو `createCrmRuntime(deps: CrmRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد `CrmRuntime` بالحقول: `customers`، `leads`، `contacts`، `accounts`، `opportunities`، `activities`، `duplicates`، `relationships`، `queries`، `events`.

## الاستعلامات العامة

`CrmQueries`: `findCustomers`، `findLeads`، `findContacts`، `findAccounts`، `findDeals` (الفرص مُجمَّعة حسب مرحلة خط الأنابيب)، `findActivities`، `findOpportunities`، `searchCRM` (بحث كلمات مفتاحية حتمي عبر العملاء، العملاء المحتملين، جهات الاتصال، الحسابات، والفرص).

## الأحداث المكتوبة النوع

`CRM_EVENT_NAMES`: `lead.created`، `lead.qualified`، `lead.converted`، `customer.created`، `customer.updated`، `opportunity.created`، `opportunity.won`، `opportunity.lost`، `activity.logged`.

## الاعتماديات

حسب `package.json`: `@lateen-os/business-dna`، `@lateen-os/domain-graph`، `@lateen-os/institutional-memory`، `@lateen-os/shared-kernel`.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع: `analytics-engine`، `api-gateway`، `communication-hub`، `customer-success-engine`، `document-management-engine`، `finance-engine`، `marketing-engine`، `project-management-engine`، `sales-engine`.

## نقاط التكامل

مجلد `relationship-management/` حقيقي، يحقن معاونَين اختياريَّين فقط: `domainGraph?: Pick<DomainGraphRuntime, 'entities' | 'relationships'>` و`institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`. لاحظ أن `CrmRuntimeDeps` نفسها لا تُدرج `businessDna` كمعاون علاقاتي رغم أن `business-dna` اعتمادية حقيقية في `package.json` — استخدام `business-dna` في هذه الحزمة مقتصر على إعادة استخدام أنواع (`OrganizationId` وغيره)، وليس استدعاء خدمة تشغيلية.

## ملاحظات معمارية

- كشف التكرار (`duplicate-detection`) وحدة فرعية كاملة مخصصة، مبنية فوق مستودعي العملاء والعملاء المحتملين مباشرة، وليست جزءًا من `relationship-management/`.
- الحزمة من الحزم الـ 18 التي تمتلك `relationship-management/` حقيقيًا وفق `INTEGRATION_AUDIT.md`، بخلاف عدد من حزم الحقبة الأولى الأخرى.

## قرارات التصميم

- تطبيع البيانات (Normalization) قبل المقارنة في كشف التكرار — قرار حتمي وقابل للاختبار بالكامل بدون أي نموذج مطابقة ضبابي (fuzzy matching).
- خط أنابيب الفرص يفرض قواعد انتقال صريحة بين مراحل الصفقة (`canTransitionDealStage`) بدلًا من السماح بأي انتقال حر.
- دمج العملاء (`MergeCustomersResult`) عملية صريحة موثّقة النتيجة، وليست عملية حذف/إعادة إنشاء ضمنية.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات CRM يجب أن تستهلك `createCrmRuntime()` العام وتطلب فقط الشرائح التي تحتاجها (`customers`، `queries`، إلخ) عبر `Pick<>` — تمامًا كما تفعل `communication-hub` و`customer-success-engine` حاليًا. لا يجوز لأي حزمة الوصول إلى مستودعات CRM الداخلية.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)
- [Domain Graph](./domain-graph.md)
- [Communication Hub](./communication-hub.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)

---

# English

## Purpose

`@lateen-os/crm-engine` is Lateen OS's customer-relationship-management engine: customer, lead, contact, account, and opportunity management. A real, deterministic, offline implementation, and the source that most other business engines (Sales, Marketing, Communication, Customer Success, Document Management) depend on for customer data.

## Responsibilities

- Customer lifecycle — including merging duplicate customers (`MergeCustomersResult`).
- Lead lifecycle, including converting a lead into a customer (`ConvertLeadInput`/`ConvertLeadResult`).
- Contact and account management.
- The Opportunity Pipeline, with explicit deal-stage transition rules (`canTransitionDealStage`).
- The Activity Timeline.
- **Duplicate Detection**: a real engine that normalizes email, phone, and text (`normalizeEmail`, `normalizePhone`, `normalizeText`) and detects matches (`detectDuplicates`).
- A Relationship Layer with Domain Graph and Institutional Memory, plus a query layer and event bus.

## Non-responsibilities

- No sales, marketing, or communication logic — that is the responsibility of `sales-engine`, `marketing-engine`, `communication-hub`, which consume CRM Engine, not the reverse.
- No AI inference.
- No persistence beyond in-memory repositories.
- No UI/API/HTTP.

## Public Runtime

The composition root is `createCrmRuntime(deps: CrmRuntimeDeps = {})` in `src/runtime.ts`, returning a `CrmRuntime` with: `customers`, `leads`, `contacts`, `accounts`, `opportunities`, `activities`, `duplicates`, `relationships`, `queries`, `events`.

## Public Queries

`CrmQueries`: `findCustomers`, `findLeads`, `findContacts`, `findAccounts`, `findDeals` (opportunities grouped by pipeline stage), `findActivities`, `findOpportunities`, `searchCRM` (a deterministic keyword search across customers, leads, contacts, accounts, and opportunities).

## Typed Events

`CRM_EVENT_NAMES`: `lead.created`, `lead.qualified`, `lead.converted`, `customer.created`, `customer.updated`, `opportunity.created`, `opportunity.won`, `opportunity.lost`, `activity.logged`.

## Dependencies

Per `package.json`: `@lateen-os/business-dna`, `@lateen-os/domain-graph`, `@lateen-os/institutional-memory`, `@lateen-os/shared-kernel`.

## Dependents

Verified by grepping `package.json` across the workspace: `analytics-engine`, `api-gateway`, `communication-hub`, `customer-success-engine`, `document-management-engine`, `finance-engine`, `marketing-engine`, `project-management-engine`, `sales-engine`.

## Integration Points

A real `relationship-management/` folder injects exactly two optional collaborators: `domainGraph?: Pick<DomainGraphRuntime, 'entities' | 'relationships'>` and `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`. Note that `CrmRuntimeDeps` does not list `businessDna` as a relationship collaborator even though `business-dna` is a real dependency in `package.json` — this package's use of `business-dna` is limited to type reuse (`OrganizationId`, etc.), not calling a runtime service.

## Architecture Notes

- Duplicate Detection (`duplicate-detection`) is a full dedicated subdomain module, built directly over the customer and lead repositories, and is not part of `relationship-management/`.
- This package is one of the 18 packages that genuinely has a `relationship-management/` folder per `INTEGRATION_AUDIT.md`, unlike a number of other Era-1 packages.

## Design Decisions

- Data normalization happens before comparison in duplicate detection — a deterministic, fully testable decision with no fuzzy-matching model.
- The Opportunity Pipeline enforces explicit deal-stage transition rules (`canTransitionDealStage`) rather than allowing any free transition.
- Customer merge (`MergeCustomersResult`) is an explicit, result-documented operation, not an implicit delete/recreate.

## Extension Points

Any future package that needs CRM data should consume the public `createCrmRuntime()` and request only the slices it needs (`customers`, `queries`, etc.) via `Pick<>` — exactly as `communication-hub` and `customer-success-engine` already do. No package may reach into CRM's internal repositories.

## Related Engines

- [Business DNA](./business-dna.md)
- [Domain Graph](./domain-graph.md)
- [Communication Hub](./communication-hub.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)
