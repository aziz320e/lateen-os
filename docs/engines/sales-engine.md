---
title: Sales Engine
title_ar: محرك المبيعات
version: 1.0.0
status: active
package: "@lateen-os/sales-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - crm-engine
  - business-dna
  - institutional-memory
  - workflow-engine
---

# العربية

## الغرض

`@lateen-os/sales-engine` هو طبقة تحويل الإيرادات القانونية لنظام Lateen OS: يملك دورة حياة فرصة البيع والخط الأنبوبي الحتمي للمبيعات (Pipeline)، محرك عروض الأسعار (Quote)، تسعير المنتجات، توقعات المبيعات (Forecast)، محرك العمولات (Commission)، الخط الزمني لأنشطة المبيعات، ومهام المبيعات — وهو الحزمة الوحيدة التي تُكامل CRM Engine وBusiness DNA وInstitutional Memory نيابة عن نطاق المبيعات.

## المسؤوليات

- دورة حياة فرصة البيع والخط الأنبوبي: `create` / `qualify` / `propose` / `negotiate` / `closeWon` / `closeLost` / `reopen` / `archive` محروسة، مبنية على خط أنبوبي حتمي من 8 مراحل: `new → discovery → qualified → proposal → negotiation → verbal_commit → won/lost`.
- محرك عروض الأسعار: `create` / `update` / `archive`، حساب حتمي للإجمالي/الضريبة/الخصم، وسجل إصدارات غير قابل للتغيير.
- تسعير المنتجات: يُركّب مع كتالوج منتجات Business DNA لسعر القائمة وسعر الحزمة؛ يحسب التسعير التفاوضي وتسعير الحجم بشكل حتمي.
- توقعات المبيعات: خط أنبوبي مرجّح حتمي، احتمال فوز حسب المرحلة، إيراد متوقع، وتوقع شهري — بدون أي نموذج ذكاء اصطناعي.
- محرك العمولات: خطط عمولة ثابتة ونسبية ومتدرجة، بالإضافة إلى حاسبة نقية.
- أنشطة المبيعات: تسجيل الاجتماعات والمكالمات ورسائل البريد والعروض التوضيحية والمتابعات بترتيب زمني حتمي.
- مهام المبيعات: تُولّد طلبات Workflow Engine حتمية لموافقة العروض، مراجعة العقود، وتذكيرات المتابعة.
- مقاييس الأداء: معدل الفوز، معدل الخسارة، متوسط حجم الصفقة، متوسط دورة المبيعات، وقيمة الخط الأنبوبي — كلها حتمية.
- طبقة استعلامات (`SalesQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- لا نموذج ذكاء اصطناعي في أي مكان بهذه الحزمة — التوقعات حتمية بالكامل.
- لا تنفيذ فعلي لخطوات سير العمل — تُولّد فقط طلبات سير عمل حقيقية تُشغَّل عبر Workflow Engine.
- Decision Engine وIntelligence Engine أهداف تكامل مسموح بها معماريًا لكنها غير مُستخدمة من قِبل أي قدرة في هذه الحزمة — لا قدرة هنا تستدعي قرارًا آليًا أو رؤية مدفوعة بالذكاء الاصطناعي، وتكامل أي منهما دون استخدام حقيقي سيكون سطحًا غير مُستغَل.

## وقت التشغيل العام

جذر التركيب هو `createSalesRuntime(deps: SalesRuntimeDeps = {})` في `src/runtime.ts`.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`SalesQueries`) تحتوي: `findOpportunities`، `findQuotes`، `findForecasts`، `findPipeline`، `findActivities`، `findTasks`، `searchSales`.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`SalesEventMap`، 9 أحداث)، كل حدث منشور فعليًا من قِبل الخدمة الحقيقية التي تُسببه: `opportunity.created`، `opportunity.qualified`، `proposal.created`، `proposal.approved`، `negotiation.started`، `deal.won`، `deal.lost`، `quote.created`، `forecast.updated`.

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel`، `@lateen-os/business-dna` (`OrganizationId`/`CustomerId`/`EmployeeId`/`ProductId`/`ProductBundleId`؛ متعاون اختياري في التسعير وطبقة العلاقات)، `@lateen-os/crm-engine` (`AccountId`/`ContactId`؛ متعاون اختياري في طبقة العلاقات)، `@lateen-os/institutional-memory` (متعاون اختياري في طبقة العلاقات)، `@lateen-os/workflow-engine` (متعاون اختياري لمهام المبيعات).

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`، تعتمد عليها: `@lateen-os/analytics-engine`، `@lateen-os/api-gateway`، `@lateen-os/communication-hub`، `@lateen-os/customer-success-engine`، `@lateen-os/finance-engine`، `@lateen-os/inventory-engine`، `@lateen-os/marketing-engine`.

## نقاط التكامل

مجلد `relationship-management/` حقيقي هو **نقطة التكامل الوحيدة** مع CRM Engine وBusiness DNA وInstitutional Memory:

- **CRM Engine** — تكامل سلوكي عبر `relationship-management`: `getCustomerContext()` / `getContactContext()` / `getAccountContext()` تجلب سجلات CRM حقيقية. تكامل بنيوي أيضًا: `shared/identifiers.ts` يُعيد استخدام `ContactId` / `AccountId` من CRM Engine مباشرة. اختياري — محقون كـ `Pick<CrmRuntime, 'customers' | 'contacts' | 'accounts'>`.
- **Business DNA** — تكامل سلوكي عبر `pricing` (كتالوج المنتجات: سعر القائمة، سعر الحزمة) و`relationship-management` (`getBusinessProfileContext()`). تكامل بنيوي أيضًا: `shared/identifiers.ts` يُعيد استخدام `OrganizationId` / `CustomerId` / `EmployeeId` / `ProductId` / `ProductBundleId` مباشرة. اختياري — محقون كـ `Pick<BusinessDnaRuntime, 'products' | 'businessProfile'>`.
- **Institutional Memory** — تكامل سلوكي عبر `relationship-management`. `logActivityToMemory()` تُسجّل نشاط مبيعات مهمًا كمُدخل معرفة `'observation'` حقيقي. اختياري — محقون كـ `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Workflow Engine** — تكامل سلوكي عبر `task`. `generateTask()` تُركّب عمليتي `defineWorkflow()` + `startWorkflow()` الحقيقيتين من جذر التركيب لدعم كل مهمة مبيعات بمثيل سير عمل حتمي حقيقي بخطوة واحدة. اختياري — محقون كـ `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.

كل متعاون اختياري يتدهور إلى قيمة فارغة موثقة (`null`، أو بدون ربط سير عمل) عند عدم حقنه.

## ملاحظات معمارية

- الحزمة الوحيدة المسؤولة عن تكامل CRM Engine وBusiness DNA وInstitutional Memory نيابة عن نطاق المبيعات بالكامل.
- تكامل بنيوي (إعادة استخدام أنواع مُعرِّفات) مع CRM Engine وBusiness DNA، إضافة إلى التكامل السلوكي عبر طبقة العلاقات — نمط مزدوج موثّق صراحة.
- Decision Engine وIntelligence Engine مسموح بهما معماريًا كأهداف تكامل مستقبلية لكن غير مُستخدمين حاليًا — قرار واعٍ لتجنب سطح تكامل غير مُستغَل.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية.
- كل متعاون في `relationship-management` مُكتوب كـ `Pick<SiblingRuntime, '...'>` ضيق النطاق.
- أسماء الأحداث تتبع اصطلاح `noun.verb` بصيغة الماضي.
- كل حسابات التسعير/التوقع/العمولة حساب ثابت فوق مبالغ سلسلة عشرية — وليست استدلال نموذج.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات مبيعات يجب أن تستهلك `createSalesRuntime()` العام فقط. إن أرادت حزمة جديدة (مثل Decision Engine أو Intelligence Engine) أن تُصبح متعاونًا حقيقيًا، تنضم كمتعاون اختياري جديد في `SalesRuntimeDeps` عبر التزام (commit) مخصص لهذه الحزمة نفسها بعد أن تكون هناك قدرة حقيقية تحتاج ذلك التكامل فعليًا — لا يجوز إضافة تكامل غير مُستخدَم.

## المحركات ذات الصلة

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Institutional Memory](./institutional-memory.md)
- [Workflow Engine](./workflow-engine.md)

---

# English

## Purpose

`@lateen-os/sales-engine` is the canonical revenue-conversion layer for Lateen OS: it owns the Sales Opportunity Lifecycle and deterministic Sales Pipeline, the Quote Engine, Product Pricing, Sales Forecasting, the Commission Engine, the Sales Activities timeline, and Sales Tasks — and is the one package that integrates CRM Engine, Business DNA, and Institutional Memory on behalf of the sales domain.

## Responsibilities

- Sales Opportunity Lifecycle + Pipeline: guarded `create` / `qualify` / `propose` / `negotiate` / `closeWon` / `closeLost` / `reopen` / `archive`, built on a deterministic 8-stage pipeline: `new → discovery → qualified → proposal → negotiation → verbal_commit → won/lost`.
- Quote Engine: `create` / `update` / `archive`, deterministic totals/tax/discount calculation, immutable version history.
- Product Pricing: composes with the Business DNA Product Catalog for list price and bundle price; computes negotiated and volume pricing deterministically.
- Sales Forecast: deterministic weighted pipeline, stage win-probability, expected revenue, and monthly forecast — no AI model.
- Commission Engine: fixed, percentage, and tiered commission plans, plus a pure calculator.
- Sales Activities: logs meetings, calls, emails, demos, and follow-ups in deterministic chronological order.
- Sales Tasks: generates deterministic Workflow Engine requests for proposal approval, contract review, and follow-up reminders.
- Performance Metrics: deterministic win rate, loss rate, average deal size, average sales cycle, and pipeline value.
- A `SalesQueries` query layer and a typed event bus.

## Non-responsibilities

- No AI model anywhere in this package — forecasting is fully deterministic.
- No real execution of workflow steps — it only generates real workflow requests executed through Workflow Engine.
- Decision Engine and Intelligence Engine are permitted integration targets per the architecture but are not used by any capability in this package — no capability here calls for an automated decision or an AI-driven insight, and integrating with either without a real use would be unused surface area.

## Public Runtime

The composition root is `createSalesRuntime(deps: SalesRuntimeDeps = {})` in `src/runtime.ts`.

## Public Queries

A real `queries/` layer (`SalesQueries`) exposes: `findOpportunities`, `findQuotes`, `findForecasts`, `findPipeline`, `findActivities`, `findTasks`, `searchSales`.

## Typed Events

A real event bus (`SalesEventMap`, 9 events), each genuinely published by the real service that causes it: `opportunity.created`, `opportunity.qualified`, `proposal.created`, `proposal.approved`, `negotiation.started`, `deal.won`, `deal.lost`, `quote.created`, `forecast.updated`.

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel`, `@lateen-os/business-dna` (`OrganizationId`/`CustomerId`/`EmployeeId`/`ProductId`/`ProductBundleId`; optional Product Pricing + Relationship Layer collaborator), `@lateen-os/crm-engine` (`AccountId`/`ContactId`; optional Relationship Layer collaborator), `@lateen-os/institutional-memory` (optional Relationship Layer collaborator), `@lateen-os/workflow-engine` (optional Sales Tasks collaborator).

## Dependents

Verified by grepping every `package.json`: `@lateen-os/analytics-engine`, `@lateen-os/api-gateway`, `@lateen-os/communication-hub`, `@lateen-os/customer-success-engine`, `@lateen-os/finance-engine`, `@lateen-os/inventory-engine`, and `@lateen-os/marketing-engine` depend on it.

## Integration Points

A real `relationship-management/` folder is the **only** integration point with CRM Engine, Business DNA, and Institutional Memory:

- **CRM Engine** — behavioral integration via `relationship-management`: `getCustomerContext()` / `getContactContext()` / `getAccountContext()` fetch real CRM Engine records. Structural integration too: `shared/identifiers.ts` reuses CRM Engine's `ContactId` / `AccountId` directly. Optional — injected as `Pick<CrmRuntime, 'customers' | 'contacts' | 'accounts'>`.
- **Business DNA** — behavioral integration via `pricing` (Product Catalog: list price, bundle price) and `relationship-management` (`getBusinessProfileContext()`). Structural integration too: `shared/identifiers.ts` reuses `OrganizationId` / `CustomerId` / `EmployeeId` / `ProductId` / `ProductBundleId` directly. Optional — injected as `Pick<BusinessDnaRuntime, 'products' | 'businessProfile'>`.
- **Institutional Memory** — behavioral integration via `relationship-management`. `logActivityToMemory()` records a significant sales activity as a real `'observation'` knowledge entry. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Workflow Engine** — behavioral integration via `task`. `generateTask()` composes the real `defineWorkflow()` + `startWorkflow()` composition-root operations to back every sales task with a genuine, deterministic single-step workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.

Every optional collaborator degrades to a documented no-op (`null`, or no workflow linkage) when not injected.

## Architecture Notes

- The single package responsible for integrating CRM Engine, Business DNA, and Institutional Memory on behalf of the entire sales domain.
- A dual pattern of structural (identifier-type reuse) and behavioral (Relationship Layer) integration with both CRM Engine and Business DNA — explicitly documented.
- Decision Engine and Intelligence Engine are architecturally permitted future integration targets but are not currently used — a deliberate choice to avoid unused integration surface.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to a deterministic `nowIso`.
- Every `relationship-management` collaborator is typed as a narrow `Pick<SiblingRuntime, '...'>` slice.
- Event names follow the `noun.verb` past-tense convention.
- All pricing/forecast/commission calculations are fixed arithmetic over decimal-string amounts, not model inference.

## Extension Points

Any future package needing sales data should consume only the public `createSalesRuntime()`. If a new package (such as Decision Engine or Intelligence Engine) wants to become a genuine collaborator, it joins as a new optional collaborator in `SalesRuntimeDeps` through a dedicated commit scoped to this package, only once a real capability actually needs that integration — unused integration surface should never be added.

## Related Engines

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Institutional Memory](./institutional-memory.md)
- [Workflow Engine](./workflow-engine.md)
