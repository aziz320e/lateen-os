---
title: ERP Architecture
title_ar: عمارة تخطيط موارد المؤسسة
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - LAYERED_ARCHITECTURE.md
  - RELATIONSHIP_MODEL.md
  - PACKAGE_CATALOG.md
related_engines:
  - business-dna
  - crm-engine
  - sales-engine
  - marketing-engine
  - finance-engine
  - hr-engine
  - inventory-engine
  - project-management-engine
  - customer-success-engine
  - document-management-engine
  - communication-hub
related_commits:
  - "35"
---

# العربية

## عمارة تخطيط موارد المؤسسة (ERP)

### 1. طبقة محركات الأعمال كقدرة معادلة لـ ERP

المحركات العشرة التالية تحت `packages/*` (طبقة "محركات الأعمال" في [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md)) تُشكّل معًا مجموعة قدرات معادلة وظيفيًا لنظام ERP تقليدي — كل واحد منها حزمة حقيقية ومختبرة، لا وحدة نظرية:

| المحرك | النطاق الوظيفي المعادل لـ ERP |
| --- | --- |
| `crm-engine` | إدارة علاقات العملاء: عملاء، عملاء محتملون، جهات اتصال، حسابات، فرص |
| `sales-engine` | المبيعات: دورة حياة الفرص، خط الأنابيب، العروض، التسعير، التنبؤ، العمولات |
| `marketing-engine` | التسويق: الحملات، الجماهير، توليد العملاء المحتملين، المحتوى، الإسناد |
| `finance-engine` | المالية: دفتر الأستاذ العام، الذمم الدائنة والمدينة، الخزينة، الميزانية، الضرائب، التقارير |
| `hr-engine` | الموارد البشرية: الهيكل التنظيمي، الموظفون، الحضور، الإجازات، إعداد الرواتب، الأداء |
| `inventory-engine` | المخزون: الكتالوج، إدارة المستودعات، الحركات، التقييم، إعداد المشتريات |
| `project-management-engine` | إدارة المشاريع: المحافظ، المهام، الموارد، الجدولة، تتبّع الميزانية، المخاطر |
| `customer-success-engine` | نجاح العملاء: دورة الحياة، الصحة، خطط النجاح، التجديد، التوسع |
| `document-management-engine` | إدارة المستندات: دورة الحياة، المجلدات، ضبط الإصدارات، البحث |
| `communication-hub` | الاتصالات الموحّدة: المحادثات، القنوات، الإشعارات، الجدولة |

### 2. `business-dna` كنموذج تجاري قانوني واحد يتشاركه الجميع

بدلًا من أن يحتفظ كل محرك من العشرة أعلاه بنسخته الخاصة من "المؤسسة" أو "المنتج" أو "الموظف"، فإن `business-dna` (طبقة البنية التحتية النطاقية) هو المصدر القانوني الوحيد. تحقّقنا مباشرة من `packages/business-dna/src/runtime.ts`:

```ts
export interface BusinessDnaRuntime {
  readonly organization: OrganizationLifecycle;
  readonly businessProfile: BusinessProfileService;
  readonly visionMission: VisionMissionEngine;
  readonly dna: DnaEngine;
  readonly market: MarketEngine;
  readonly competitors: CompetitorRegistry;
  readonly products: ProductCatalogService;
  readonly policies: PolicyEngine;
  readonly queries: BusinessDnaQueries;
  readonly events: BusinessDnaEventBus;
}
```

المصفوفة الكاملة لمجلدات `business-dna/src` (محقّقة مباشرة) تغطي 23 كيانًا نطاقيًا: `agent`, `asset`, `branch`, `business-profile`, `competitor`, `customer`, `department`, `dna`, `employee`, `invoice`, `kpi`, `machine`, `market`, `order`, `organization`, `permission`, `policy`, `product`, `project`, `quotation`, `role`, `supplier`, `vision-mission`. وكل محرك من العشرة أعلاه يستورد نوع `OrganizationId` من `@lateen-os/business-dna` بدلًا من إعادة تعريفه (راجع [DEPENDENCY_MODEL](./DEPENDENCY_MODEL.md) §1) — هذا هو ما يمنع أي محرك من الاحتفاظ بنسخته الخاصة من "الحقيقة" التجارية، مطابقًا لهدف `00_MASTER_PLAN.md` §3.2: "نموذج عمل قانوني واحد (Business DNA) يستهلكه كل مكوّن آخر."

### 3. كيف تتكامل محركات الأعمال معًا (تكامل حقيقي، لا افتراضي)

تحقّقنا في [RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md) أن معظم محركات الأعمال العشرة تملك `relationship-management/` حقيقية تتكامل فيما بينها — مثال حقيقي: `finance-engine` يتكامل مع `crm-engine` و`sales-engine` (لسياق العميل والفرصة عند الفوترة)، و`document-management-engine` يتكامل مع `crm-engine` و`customer-success-engine` و`project-management-engine` (لربط المستندات بسياقها التجاري). لا يوجد تكامل عبر مستودع مباشر — كل تكامل يمر عبر السطح العام (`createXRuntime()`) لسيبلينجه.

### 4. حدود هذا الوصف

هذا المستند لا يزعم أن `packages/*` "هو" حزمة ERP تجارية جاهزة (SAP، Oracle، إلخ) — بل يصف حقيقة أن مجموعة القدرات العشر، مجتمعة فوق `business-dna` كنموذج واحد، تُغطي نفس نطاقات ERP الوظيفية التقليدية (المالية، الموارد البشرية، المخزون، المبيعات، إلخ) بعمارة أصيلة الذكاء الاصطناعي بدلًا من نظام تقليدي. لا مديونية إضافية أو محرك أعمال غير موجود اليوم في `packages/*` أُضيف لهذا الوصف.

---

# English

## ERP Architecture

### 1. The Business-Engine Layer as an ERP-Equivalent Capability Set

The following ten engines under `packages/*` (the "Business Engines" layer in [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md)) together form a capability set functionally equivalent to a traditional ERP system — each is a real, tested package, not a theoretical module:

| Engine | ERP-Equivalent Functional Scope |
| --- | --- |
| `crm-engine` | Customer relationship management: customers, leads, contacts, accounts, opportunities |
| `sales-engine` | Sales: opportunity lifecycle, pipeline, quotes, pricing, forecasting, commissions |
| `marketing-engine` | Marketing: campaigns, audiences, lead generation, content, attribution |
| `finance-engine` | Finance: general ledger, AR/AP, treasury, budgeting, tax, financial reporting |
| `hr-engine` | HR: org structure, employees, attendance, leave, payroll prep, performance |
| `inventory-engine` | Inventory: catalog, warehouse management, movements, valuation, procurement prep |
| `project-management-engine` | Project management: portfolios, tasks, resources, scheduling, budget tracking, risk |
| `customer-success-engine` | Customer success: lifecycle, health, success plans, renewals, expansion |
| `document-management-engine` | Document management: lifecycle, folders, version control, search |
| `communication-hub` | Unified communications: conversations, channels, notifications, scheduling |

### 2. `business-dna` as the One Canonical Business Model Shared by All

Instead of each of the ten engines above keeping its own version of "organization," "product," or "employee," `business-dna` (Domain Infrastructure layer) is the sole canonical source. Verified directly against `packages/business-dna/src/runtime.ts`:

```ts
export interface BusinessDnaRuntime {
  readonly organization: OrganizationLifecycle;
  readonly businessProfile: BusinessProfileService;
  readonly visionMission: VisionMissionEngine;
  readonly dna: DnaEngine;
  readonly market: MarketEngine;
  readonly competitors: CompetitorRegistry;
  readonly products: ProductCatalogService;
  readonly policies: PolicyEngine;
  readonly queries: BusinessDnaQueries;
  readonly events: BusinessDnaEventBus;
}
```

The full folder inventory of `business-dna/src` (verified directly) covers 23 domain entities: `agent`, `asset`, `branch`, `business-profile`, `competitor`, `customer`, `department`, `dna`, `employee`, `invoice`, `kpi`, `machine`, `market`, `order`, `organization`, `permission`, `policy`, `product`, `project`, `quotation`, `role`, `supplier`, `vision-mission`. Every one of the ten engines above imports the `OrganizationId` type from `@lateen-os/business-dna` rather than redefining it (see [DEPENDENCY_MODEL](./DEPENDENCY_MODEL.md) §1) — this is what prevents any engine from keeping its own version of business "truth," matching `00_MASTER_PLAN.md` §3.2's goal: "one canonical business model (Business DNA) consumed by every other component."

### 3. How the Business Engines Integrate With Each Other (Real, Not Assumed)

[RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md) confirms most of the ten business engines have a real `relationship-management/` module integrating with each other — a real example: `finance-engine` integrates with `crm-engine` and `sales-engine` (for customer/opportunity context at invoicing time), and `document-management-engine` integrates with `crm-engine`, `customer-success-engine`, and `project-management-engine` (to attach documents to their business context). No integration happens through a direct repository — every integration goes through a sibling's public surface (`createXRuntime()`).

### 4. The Boundaries of This Description

This document does not claim `packages/*` "is" an off-the-shelf commercial ERP suite (SAP, Oracle, etc.) — it describes the real fact that these ten capabilities, composed above `business-dna` as one shared model, cover the same traditional ERP functional domains (finance, HR, inventory, sales, etc.) with an AI-native architecture instead of a legacy system. No additional debt or non-existent business engine was invented for this description.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [LAYERED_ARCHITECTURE.md](./LAYERED_ARCHITECTURE.md)
- [RELATIONSHIP_MODEL.md](./RELATIONSHIP_MODEL.md)
- [PACKAGE_CATALOG.md](./PACKAGE_CATALOG.md)

## Related Engines

`business-dna`, `crm-engine`, `sales-engine`, `marketing-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `communication-hub`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
