---
title: Marketing Engine
title_ar: محرك التسويق
version: 1.0.0
status: active
package: "@lateen-os/marketing-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - crm-engine
  - sales-engine
  - business-dna
  - institutional-memory
  - domain-graph
  - workflow-engine
---

# العربية

## محرك التسويق — Marketing Engine

### 1. الغرض

`@lateen-os/marketing-engine` يملك دورة حياة الحملات، محرك الجمهور، توليد وتقييم العملاء المحتملين، مكتبة المحتوى، تقويم التسويق، الإسناد (Attribution)، ومقاييس التسويق لـ Lateen OS، ويربط CRM Engine وSales Engine وBusiness DNA وInstitutional Memory وDomain Graph نيابة عن نطاق التسويق. حزمة ناضجة من الجيل الأول بُنيت قبل تسمية النمط الصارم رسميًا، لكنها تطابقه بنيويًا بالكامل.

### 2. المسؤوليات

- دورة حياة الحملة: إنشاء/تحديث/جدولة بدورة حياة محمية.
- محرك الجمهور: تعريف جمهور بفلاتر (`AudienceFilter`) قابلة للتطبيق على سياق CRM عند الحقن.
- توليد وتقييم العملاء المحتملين: توليد عميل محتمل، تسجيل نقاط (وزن مصدر، نقاط حداثة).
- مكتبة المحتوى: عناصر محتوى بدورة حياة.
- تقويم التسويق: جدولة مع قواعد تكرار (Recurrence) وحساب التكرارات.
- الإسناد: حساب الإسناد عبر نقاط الاتصال (Touchpoints).
- مقاييس التسويق: مقاييس مشتقة من عدادات خام.
- تكامل تدفق العمل (`workflow-integration/`): طلبات تدفق عمل حقيقية (موافقة حملة، مراجعة أصول، نشر، متابعة) — وحدة منفصلة عن `relationship-management/`، مخصصة فقط لتكامل Workflow Engine.

### 3. خارج نطاق المسؤولية

- لا استدلال بنماذج لغة كبيرة.
- لا تنفيذ فعلي للنشر أو الإرسال البريدي — تسجيل الطلبات والمقاييس فقط.
- لا تعديل مباشر لأي حزمة شقيقة.

### 4. وقت التشغيل العام

جذر التركيب **`createMarketingRuntime(deps = {})`** في `src/runtime.ts` يُرجع `MarketingRuntime`: `campaigns`، `audiences`، `leadGeneration`، `leadScoring`، `content`، `calendar`، `attribution`، `metrics`، `workflows`، `relationships`، `queries`، و`events`.

### 5. الاستعلامات العامة

طبقة `MarketingQueries`: `findCampaigns`، `findAudiences`، `findAssets`، `findContent`، `findLeads`، `findMetrics`، `findCalendar`، `searchMarketing`.

### 6. الأحداث المكتوبة النوع

تسعة أحداث حقيقية في `MarketingDomainEvent`: `campaign.created`، `campaign.launched`، `campaign.paused`، `campaign.completed`، `lead.generated`، `lead.scored`، `content.created`، `workflow.requested`، `metrics.updated`.

### 7. الاعتماديات

`@lateen-os/business-dna`، `@lateen-os/crm-engine`، `@lateen-os/domain-graph`، `@lateen-os/institutional-memory`، `@lateen-os/sales-engine`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

### 8. الحزم المعتمِدة

`@lateen-os/analytics-engine`، `@lateen-os/api-gateway`، `@lateen-os/communication-hub`.

### 9. نقاط التكامل

عبر `relationship-management/` (CRM/Sales/Business DNA/Institutional Memory/Domain Graph) بالإضافة إلى وحدة `workflow-integration/` منفصلة (Workflow Engine):

- **CRM Engine** — `syncLeadToCrm()` ينشئ عميلاً محتملاً حقيقيًا في CRM عبر `leads.create()`، و`getCustomerContext()` عبر `customers.get()` (`Pick<CrmRuntime, 'leads' | 'customers'>`).
- **Sales Engine** — `getOpportunityContext()` عبر `opportunities.get()` (`Pick<SalesRuntime, 'opportunities'>`).
- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`).
- **Institutional Memory** — `logCampaignToMemory()` يسجّل إدخال معرفة `'observation'` حقيقي.
- **Domain Graph** — `syncCampaignToGraph()` يُسجّل أو يحدّث عقدة `'campaign'` حقيقية عبر `entities.register()`/`entities.update()` (`Pick<DomainGraphRuntime, 'entities' | 'relationships'>`).
- **Workflow Engine** (عبر `workflow-integration/`، وليس `relationship-management/`) — `WorkflowIntegrationService.generateRequest()` يركّب `defineWorkflow()` + `startWorkflow()` حقيقيين لموافقة الحملة/مراجعة الأصول/النشر/المتابعة (`Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`).

كل تعاون اختياري ويتدهور إلى `null` عند عدم الحقن.

### 10. ملاحظات معمارية

هذه من الحزم الناضجة من الجيل الأول التي بُنيت قبل تسمية اصطلاح الجيل الثاني رسميًا، لكنها تطابقه بنيويًا حرفيًا (`shared/` → `events/` → نطاقات فرعية → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`). ملاحظة معمارية حقيقية: تكامل Workflow Engine **لا** يمر عبر `relationship-management/` كبقية الشقيقات، بل عبر وحدة `workflow-integration/` منفصلة بنفس مبدأ الحقن الاختياري والتدهور الآمن — نمط حقيقي وموثّق في الكود، وليس خطأ.

### 11. قرارات التصميم

- تعريف تدفق العمل لكل (منظمة، نوع طلب) يُخزَّن في ذاكرة تخزين مؤقت محلية (idempotent) لتجنب تعريف نفس تدفق العمل القياسي أكثر من مرة.
- تسجيل نقاط العميل المحتمل يجمع وزن المصدر ونقاط الحداثة كدالة حتمية، لا نموذج تعلّم آلي.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات تسويقية يجب أن تستهلك `createMarketingRuntime()` العام فقط — لا وصول مباشر لأي `repository.ts` داخلي، ولا تعديل هذه الحزمة لإضافة تكامل جديد؛ أي تكامل شقيق جديد يجب أن يتبع نفس نمط الحقن الاختياري المتدهور إلى `null`.

### 13. المحركات ذات الصلة

- [institutional-memory](./institutional-memory.md)
- [finance-engine](./finance-engine.md)

---

# English

## Marketing Engine

### 1. Purpose

`@lateen-os/marketing-engine` owns the campaign lifecycle, the audience engine, lead generation and scoring, the content library, the marketing calendar, attribution, and marketing metrics for Lateen OS, and integrates CRM Engine, Sales Engine, Business DNA, Institutional Memory, and Domain Graph on behalf of the marketing domain. A mature Era-1 package built just before the rigid construction pattern was formally named, but it matches it structurally in full.

### 2. Responsibilities

- Campaign Lifecycle: create/update/schedule with a guarded lifecycle.
- Audience Engine: define an audience with filters (`AudienceFilter`) applicable against CRM context when injected.
- Lead Generation and Scoring: generate a lead, score it (source weight, recency score).
- Content Library: content items with a lifecycle.
- Marketing Calendar: scheduling with recurrence rules and occurrence computation.
- Attribution: attribution computation across touchpoints.
- Marketing Metrics: derived metrics from raw counters.
- Workflow Integration (`workflow-integration/`): real workflow requests (campaign approval, asset review, publishing, follow-up) — a module separate from `relationship-management/`, dedicated solely to the Workflow Engine integration.

### 3. Non-responsibilities

- No LLM/AI inference.
- No actual publishing or email-sending execution — request and metrics recording only.
- No direct modification of any sibling package.

### 4. Public Runtime

The composition root **`createMarketingRuntime(deps = {})`** in `src/runtime.ts` returns a `MarketingRuntime`: `campaigns`, `audiences`, `leadGeneration`, `leadScoring`, `content`, `calendar`, `attribution`, `metrics`, `workflows`, `relationships`, `queries`, and `events`.

### 5. Public Queries

A `MarketingQueries` layer: `findCampaigns`, `findAudiences`, `findAssets`, `findContent`, `findLeads`, `findMetrics`, `findCalendar`, `searchMarketing`.

### 6. Typed Events

Nine real events in `MarketingDomainEvent`: `campaign.created`, `campaign.launched`, `campaign.paused`, `campaign.completed`, `lead.generated`, `lead.scored`, `content.created`, `workflow.requested`, `metrics.updated`.

### 7. Dependencies

`@lateen-os/business-dna`, `@lateen-os/crm-engine`, `@lateen-os/domain-graph`, `@lateen-os/institutional-memory`, `@lateen-os/sales-engine`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

### 8. Dependents

`@lateen-os/analytics-engine`, `@lateen-os/api-gateway`, `@lateen-os/communication-hub`.

### 9. Integration Points

Through `relationship-management/` (CRM/Sales/Business DNA/Institutional Memory/Domain Graph) plus a separate `workflow-integration/` module (Workflow Engine):

- **CRM Engine** — `syncLeadToCrm()` creates a real CRM lead via `leads.create()`, and `getCustomerContext()` via `customers.get()` (`Pick<CrmRuntime, 'leads' | 'customers'>`).
- **Sales Engine** — `getOpportunityContext()` via `opportunities.get()` (`Pick<SalesRuntime, 'opportunities'>`).
- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`).
- **Institutional Memory** — `logCampaignToMemory()` logs a real `'observation'` knowledge entry.
- **Domain Graph** — `syncCampaignToGraph()` registers or updates a real `'campaign'` node via `entities.register()`/`entities.update()` (`Pick<DomainGraphRuntime, 'entities' | 'relationships'>`).
- **Workflow Engine** (via `workflow-integration/`, not `relationship-management/`) — `WorkflowIntegrationService.generateRequest()` composes real `defineWorkflow()` + `startWorkflow()` for campaign approval/asset review/publishing/follow-up (`Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`).

Every collaborator is optional and degrades to `null` when not injected.

### 10. Architecture Notes

This is one of the mature Era-1 packages built just before the Era-2 convention was formally named, but it matches it structurally verbatim (`shared/` → `events/` → subdomains → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`). A genuine architecture note: the Workflow Engine integration does **not** go through `relationship-management/` like the other siblings — it goes through a separate `workflow-integration/` module following the same optional-injection, safe-degradation principle — a real, code-verified pattern, not an error.

### 11. Design Decisions

- The workflow definition per (organization, request type) is cached locally (idempotent) to avoid redefining the same canonical workflow more than once.
- Lead scoring combines source weight and recency score as a deterministic function, not a machine-learning model.

### 12. Extension Points

Any future package needing marketing data should consume the public `createMarketingRuntime()` only — no direct access to any internal `repository.ts`, and no modification of this package to add a new integration; any new sibling integration should follow the same optional-injection, degrade-to-`null` pattern.

### 13. Related Engines

- [institutional-memory](./institutional-memory.md)
- [finance-engine](./finance-engine.md)
