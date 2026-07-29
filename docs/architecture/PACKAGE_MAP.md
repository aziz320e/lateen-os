---
title: Package Map
title_ar: خريطة الحزم
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - LAYERED_ARCHITECTURE.md
  - PACKAGE_CATALOG.md
related_engines:
  - all
related_commits:
  - "35"
---

# العربية

## خريطة الحزم

### 1. الغرض

هذا المستند يقدّم وصفًا من سطر واحد لكل حزمة من الحزم الـ39 تحت `packages/*`، مُجمّعة حسب الطبقة المعمارية (انظر [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md))، مع رابط إلى دليل المحرك الخاص بها ضمن `docs/engines/<name>.md`. للمصفوفات الكاملة (الاعتماديات، جذر التركيب، طبقة العلاقات، الأحداث، الاستعلامات، المستودعات)، انظر [PACKAGE_CATALOG](./PACKAGE_CATALOG.md).

### 2. الأساس

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `shared-kernel` | كتل بناء DDD الأساسية لكل حزمة في Lateen OS | [الدليل](../engines/shared-kernel.md) |

### 3. تجريد نماذج اللغة

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `ai-provider-hub` | تجريد مزوّدي نماذج اللغة القانوني — البوابة الوحيدة لأي استدعاء LLM | [الدليل](../engines/ai-provider-hub.md) |

### 4. مكدّس الاستدلال

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `decision-engine` | طبقة القرار القانونية لـ Lateen OS | [الدليل](../engines/decision-engine.md) |
| `intelligence-engine` | الاكتشاف والتحليل والتنبؤ والتوصيات | [الدليل](../engines/intelligence-engine.md) |
| `ai-runtime` | نظام تشغيل وكلاء الذكاء الاصطناعي | [الدليل](../engines/ai-runtime.md) |
| `ai-brain` | طبقة الاستدلال المؤسسي المركزية | [الدليل](../engines/ai-brain.md) |
| `ceo-engine` | واجهة تفويض المهمات لوكلاء تنفيذيين متخصصين | [الدليل](../engines/ceo-engine.md) |

### 5. التنسيق / العمل الرقمي

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `workflow-engine` | طبقة التنسيق القانونية لسير العمل | [الدليل](../engines/workflow-engine.md) |
| `multi-agent` | طبقة تنسيق فوق فريق العمل الذكي | [الدليل](../engines/multi-agent.md) |
| `ai-workforce` | الطبقة التنظيمية للموظفين الرقميين | [الدليل](../engines/ai-workforce.md) |

### 6. البنية التحتية النطاقية

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `business-dna` | النموذج النطاقي القانوني لـ Lateen OS | [الدليل](../engines/business-dna.md) |
| `institutional-memory` | الذاكرة المؤسسية طويلة الأمد | [الدليل](../engines/institutional-memory.md) |
| `domain-graph` | العلاقات الدلالية القانونية بين كيانات Business DNA | [الدليل](../engines/domain-graph.md) |
| `capability-engine` | نمذجة ما يمكن للشركة فعله، بمعزل عن آلة بعينها | [الدليل](../engines/capability-engine.md) |

### 7. محركات الأعمال

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `crm-engine` | إدارة العملاء والعملاء المحتملين وجهات الاتصال والفرص | [الدليل](../engines/crm-engine.md) |
| `sales-engine` | دورة حياة فرص البيع وخط الأنابيب والعروض والتسعير والعمولات | [الدليل](../engines/sales-engine.md) |
| `marketing-engine` | الحملات والجماهير وتوليد العملاء المحتملين والمحتوى | [الدليل](../engines/marketing-engine.md) |
| `communication-hub` | المحادثات والمشاركون والمراسلة والقنوات والإشعارات | [الدليل](../engines/communication-hub.md) |
| `finance-engine` | التنظيم المالي ودفتر الأستاذ والذمم والخزينة والميزانية والضرائب | [الدليل](../engines/finance-engine.md) |
| `hr-engine` | هيكل المؤسسة والموظفين والحضور والإجازات والرواتب والأداء | [الدليل](../engines/hr-engine.md) |
| `inventory-engine` | كتالوج المخزون وإدارة المستودعات ومستويات الحركة والتقييم | [الدليل](../engines/inventory-engine.md) |
| `project-management-engine` | دورة حياة المشاريع والمحافظ والمهام والموارد والجدولة | [الدليل](../engines/project-management-engine.md) |
| `customer-success-engine` | دورة حياة العميل وصحته وخطط النجاح والتجديد والتوسع | [الدليل](../engines/customer-success-engine.md) |
| `document-management-engine` | دورة حياة المستندات والمجلدات وضبط الإصدارات والبحث | [الدليل](../engines/document-management-engine.md) |

### 8. طبقة الثقة

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `ai-security-engine` | الهوية والمصادقة والتفويض والأسرار وأمن النماذج والكشف عن التهديدات | [الدليل](../engines/ai-security-engine.md) |
| `ai-governance-engine` | سياسات الحوكمة وحوكمة الذكاء الاصطناعي/النماذج/الوكلاء وموافقة بشرية | [الدليل](../engines/ai-governance-engine.md) |
| `ai-compliance-engine` | أطر الامتثال وعناصر التحكم والأدلة والتقييمات والتدقيق | [الدليل](../engines/ai-compliance-engine.md) |

### 9. أفقي / تشغيلي

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `analytics-engine` | مؤشرات الأداء ولوحات المعلومات التنفيذية والتحليلات الشاملة | [الدليل](../engines/analytics-engine.md) |
| `observability-engine` | التسجيل المنظم والمقاييس والتتبع الموزع والتنبيه والتدقيق | [الدليل](../engines/observability-engine.md) |

### 10. سطح المنصة

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `api-gateway` | سجلات API/المسارات/الإصدارات وخط أنابيب الوسيط والمصادقة وتحديد المعدل | [الدليل](../engines/api-gateway.md) |
| `admin-console` | إدارة الهوية وإعدادات النظام وإدارة التهيئة ومركز التدقيق | [الدليل](../engines/admin-console.md) |
| `marketplace` (`@lateen-os/marketplace-engine`) | سجل الإضافات والمكوّنات الإضافية والحزم وصندوق الحماية | [الدليل](../engines/marketplace.md) |

### 11. سطح المطوّر / البنية التحتية

| الحزمة | الوصف | الدليل |
| --- | --- | --- |
| `sdk` | الواجهة الرسمية لمطوّري Lateen OS (`createLateen()`) | [الدليل](../engines/sdk.md) |
| `kernel` | الطبقة التشغيلية للمنصة (bootstrap، دورة الحياة، المراقبة) | [الدليل](../engines/kernel.md) |
| `extension-system` | اكتشاف الإضافات الخارجية والتحقق منها وتحميلها وإدارتها | [الدليل](../engines/extension-system.md) |
| `connector-base` | تنفيذ موفّر الموصلات الأساسي لإضافات تكامل Lateen OS | [الدليل](../engines/connector-base.md) |
| `integration-contracts` | عقود موفّري التكامل — أنواع مشتركة لإضافات الموصلات | [الدليل](../engines/integration-contracts.md) |
| `typescript-config` | إعدادات TypeScript المشتركة عبر مساحة العمل — بلا كود تشغيلي | [الدليل](../engines/typescript-config.md) |
| `integration-tests` | جناح اختبارات تكامل شامل يتحقق من عمل المحركات معًا عبر `createLateen()` | [الدليل](../engines/integration-tests.md) |

---

# English

## Package Map

### 1. Purpose

This document gives a one-line description for each of the 39 packages under `packages/*`, grouped by architectural layer (see [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md)), linking to its engine guide under `docs/engines/<name>.md`. For the full matrices (dependencies, composition root, relationship layer, events, queries, repositories), see [PACKAGE_CATALOG](./PACKAGE_CATALOG.md).

### 2. Foundation

| Package | Description | Guide |
| --- | --- | --- |
| `shared-kernel` | Foundational DDD building blocks for every Lateen OS package | [Guide](../engines/shared-kernel.md) |

### 3. LLM Abstraction

| Package | Description | Guide |
| --- | --- | --- |
| `ai-provider-hub` | Canonical LLM provider abstraction — the sole gateway for any LLM call | [Guide](../engines/ai-provider-hub.md) |

### 4. Reasoning Stack

| Package | Description | Guide |
| --- | --- | --- |
| `decision-engine` | Canonical decision layer for Lateen OS | [Guide](../engines/decision-engine.md) |
| `intelligence-engine` | Discovery, analysis, forecasting, and recommendations | [Guide](../engines/intelligence-engine.md) |
| `ai-runtime` | Operating system for AI agents | [Guide](../engines/ai-runtime.md) |
| `ai-brain` | Central enterprise reasoning layer | [Guide](../engines/ai-brain.md) |
| `ceo-engine` | Mission delegation facade for specialized executive agents | [Guide](../engines/ceo-engine.md) |

### 5. Coordination / Digital Labor

| Package | Description | Guide |
| --- | --- | --- |
| `workflow-engine` | Canonical orchestration layer for workflows | [Guide](../engines/workflow-engine.md) |
| `multi-agent` | Coordination layer above AI Workforce | [Guide](../engines/multi-agent.md) |
| `ai-workforce` | Organizational layer for digital employees | [Guide](../engines/ai-workforce.md) |

### 6. Domain Infrastructure

| Package | Description | Guide |
| --- | --- | --- |
| `business-dna` | Canonical domain model for Lateen OS | [Guide](../engines/business-dna.md) |
| `institutional-memory` | Long-term organizational knowledge | [Guide](../engines/institutional-memory.md) |
| `domain-graph` | Canonical semantic relationships between Business DNA entities | [Guide](../engines/domain-graph.md) |
| `capability-engine` | Models what the company can do, independent of specific machines | [Guide](../engines/capability-engine.md) |

### 7. Business Engines

| Package | Description | Guide |
| --- | --- | --- |
| `crm-engine` | Customer, lead, contact, account, and opportunity management | [Guide](../engines/crm-engine.md) |
| `sales-engine` | Sales opportunity lifecycle, pipeline, quotes, pricing, commissions | [Guide](../engines/sales-engine.md) |
| `marketing-engine` | Campaigns, audiences, lead generation, content, attribution | [Guide](../engines/marketing-engine.md) |
| `communication-hub` | Conversations, participants, messaging, channels, notifications | [Guide](../engines/communication-hub.md) |
| `finance-engine` | Financial organization, general ledger, AR/AP, treasury, budget, tax | [Guide](../engines/finance-engine.md) |
| `hr-engine` | Org structure, employees, attendance, leave, payroll prep, performance | [Guide](../engines/hr-engine.md) |
| `inventory-engine` | Inventory catalog, warehouse management, stock levels, valuation | [Guide](../engines/inventory-engine.md) |
| `project-management-engine` | Project/portfolio lifecycle, tasks, resources, scheduling | [Guide](../engines/project-management-engine.md) |
| `customer-success-engine` | Customer lifecycle, health, success plans, renewals, expansion | [Guide](../engines/customer-success-engine.md) |
| `document-management-engine` | Document lifecycle, folders, version control, search | [Guide](../engines/document-management-engine.md) |

### 8. Trust Layer

| Package | Description | Guide |
| --- | --- | --- |
| `ai-security-engine` | Identity, authentication, authorization, secrets, threat detection | [Guide](../engines/ai-security-engine.md) |
| `ai-governance-engine` | Governance policies, AI/model/agent/workflow governance, human approval | [Guide](../engines/ai-governance-engine.md) |
| `ai-compliance-engine` | Compliance frameworks, controls, evidence, assessments, audits | [Guide](../engines/ai-compliance-engine.md) |

### 9. Horizontal / Operational

| Package | Description | Guide |
| --- | --- | --- |
| `analytics-engine` | KPIs, metrics, executive dashboards, cross-engine analytics | [Guide](../engines/analytics-engine.md) |
| `observability-engine` | Structured logging, metrics, distributed tracing, alerting, audit | [Guide](../engines/observability-engine.md) |

### 10. Platform Surface

| Package | Description | Guide |
| --- | --- | --- |
| `api-gateway` | API/route/version registries, middleware pipeline, auth, rate limiting | [Guide](../engines/api-gateway.md) |
| `admin-console` | Identity administration, system settings, configuration, audit center | [Guide](../engines/admin-console.md) |
| `marketplace` (`@lateen-os/marketplace-engine`) | Extension/plugin/package registries, extension sandbox | [Guide](../engines/marketplace.md) |

### 11. Developer Surface / Platform Infra

| Package | Description | Guide |
| --- | --- | --- |
| `sdk` | The official developer interface for extending Lateen OS (`createLateen()`) | [Guide](../engines/sdk.md) |
| `kernel` | Platform operating layer (bootstrap, lifecycle, monitoring) | [Guide](../engines/kernel.md) |
| `extension-system` | Discover, validate, load, and manage platform extensions | [Guide](../engines/extension-system.md) |
| `connector-base` | Base connector provider implementation for integration extensions | [Guide](../engines/connector-base.md) |
| `integration-contracts` | Shared types for connector extensions | [Guide](../engines/integration-contracts.md) |
| `typescript-config` | Shared TypeScript configuration across the workspace — no runtime code | [Guide](../engines/typescript-config.md) |
| `integration-tests` | End-to-end suite verifying engines work together through `createLateen()` | [Guide](../engines/integration-tests.md) |

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [LAYERED_ARCHITECTURE.md](./LAYERED_ARCHITECTURE.md)
- [PACKAGE_CATALOG.md](./PACKAGE_CATALOG.md)

## Related Engines

All 39 `packages/*` engines — one row each, above.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
