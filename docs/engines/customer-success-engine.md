---
title: Customer Success Engine
title_ar: محرك نجاح العملاء
version: 1.0.0
status: active
package: "@lateen-os/customer-success-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - crm-engine
  - sales-engine
  - project-management-engine
  - communication-hub
  - analytics-engine
  - business-dna
  - institutional-memory
  - document-management-engine
---

# العربية

## الغرض

`@lateen-os/customer-success-engine` هو محرك نجاح العملاء في Lateen OS، مبني بالكامل وفق اصطلاح الحقبة الثانية (Era 2). يغطي دورة حياة العميل بعد البيع: التأهيل (Onboarding)، صحة العميل، خطط النجاح، التجديدات، فرص التوسّع، مخاطر العميل، والتغذية الراجعة (Feedback). تنفيذ حقيقي وحتمي وبدون اتصال.

## المسؤوليات

- دورة حياة نجاح العميل (`CustomerLifecycleEngine`) — التأهيل وحتى التفعيل.
- محرك صحة العميل (`CustomerHealthEngine`): حساب درجة الصحة (`computeHealthScore`) ومستواها (`computeHealthTier`) من مكونات صحة متعددة.
- محرك خطط النجاح (`SuccessPlanEngine`): أهداف، معالم (Milestones)، ومهام، بحالات انتقال محكومة (`canTransitionSuccessPlan`).
- محرك التجديدات (`RenewalEngine`) مع تذكيرات (`SendReminderInput`) ونتيجة تجديد (`RenewalOutcome`).
- محرك التوسّع (`ExpansionEngine`) لتحديد فرص توسّع الحساب.
- محرك مخاطر العميل (`CustomerRiskEngine`): حساب درجة الخطر (`computeCustomerRiskScore`) ومستواه (`computeCustomerRiskLevel`).
- محرك التغذية الراجعة (`FeedbackEngine`): حساب NPS (`computeNpsScore`/`computeNpsCategory`) ومتوسط CSAT (`computeAverageCsat`).
- طبقة علاقات مع سبع حزم شقيقة، طبقة استعلامات، وناقل أحداث نطاق مكتوب النوع.

## خارج نطاق المسؤولية

- لا منطق مبيعات أو CRM أساسي — تستهلك تلك المحركات عبر شرائح ضيقة فقط.
- لا استدلال ذكاء اصطناعي؛ كل الحسابات (الصحة، الخطر، NPS) صيغ حتمية صريحة.
- لا تخزين دائم يتجاوز المستودعات داخل الذاكرة.
- لا UI/API/HTTP.

## وقت التشغيل العام

جذر التركيب هو `createCustomerSuccessRuntime(deps: CustomerSuccessRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد `CustomerSuccessRuntime` بالحقول: `customers`، `health`، `plans`، `renewals`، `expansion`، `risks`، `feedback`، `relationships`، `queries`، `events`.

## الاستعلامات العامة

`CustomerSuccessQueries`: `findCustomers`، `findHealth`، `findRenewals`، `findPlans`، `findFeedback`، `findRisks`، `findExpansion`، `searchCustomerSuccess`.

## الأحداث المكتوبة النوع

`CUSTOMER_SUCCESS_EVENT_NAMES`: `customer.onboarded`، `customer.activated`، `customer.health.updated`، `renewal.created`، `renewal.completed`، `customer.churned`، `customer.reactivated`، `feedback.received`، `successplan.completed`، `risk.detected`.

## الاعتماديات

حسب `package.json`: `@lateen-os/analytics-engine`، `@lateen-os/business-dna`، `@lateen-os/communication-hub`، `@lateen-os/crm-engine`، `@lateen-os/institutional-memory`، `@lateen-os/project-management-engine`، `@lateen-os/sales-engine`، `@lateen-os/shared-kernel`.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع: `api-gateway`، `document-management-engine`.

## نقاط التكامل

مجلد `relationship-management/` حقيقي يحقن سبعة معاونين اختياريين، كل منهم شريحة `Pick<>` ضيقة: `crm?: Pick<CrmRuntime, 'customers'>`، `sales?: Pick<SalesRuntime, 'opportunities'>`، `projects?: Pick<ProjectRuntime, 'queries'>`، `communicationHub?: Pick<CommunicationRuntime, 'notifications'>`، `analytics?: Pick<AnalyticsRuntime, 'metrics'>`، `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`، `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

## ملاحظات معمارية

- هذه الحزمة من حزم الحقبة الثانية (Era 2) وتتبع القالب الصارم بالكامل: `shared/` → `events/` → مجلد لكل نطاق فرعي → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`.
- سبعة معاونين علاقاتيين هو من أعلى الأعداد بين الحزم العشر المشمولة في هذه الدفعة، ما يعكس موقع الحزمة كنقطة تجميع متأخرة في سلسلة القيمة (بعد البيع).

## قرارات التصميم

- كل حساب (صحة، خطر، NPS) دالة نقية صريحة (`computeHealthScore`، `computeCustomerRiskScore`، `computeNpsScore`) قابلة للاختبار بمعزل عن أي حالة أو حقن.
- خطط النجاح تُبنى كتسلسل هرمي صريح (خطة → هدف → معلم → مهمة) بدلًا من قائمة مسطحة من المهام.

## نقاط التوسعة

أي حزمة مستقبلية تريد استهلاك بيانات نجاح العملاء يجب أن تستهلك `createCustomerSuccessRuntime()` العام فقط وتطلب الشرائح التي تحتاجها — تمامًا كما تفعل `document-management-engine` حاليًا عبر `Pick<CustomerSuccessRuntime, 'customers'>`.

## المحركات ذات الصلة

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Communication Hub](./communication-hub.md)
- [Document Management Engine](./document-management-engine.md)

---

# English

## Purpose

`@lateen-os/customer-success-engine` is Lateen OS's customer success engine, built entirely on the Era-2 convention. It covers the post-sale customer lifecycle: onboarding, customer health, success plans, renewals, expansion opportunities, customer risk, and feedback. A real, deterministic, offline implementation.

## Responsibilities

- Customer success lifecycle (`CustomerLifecycleEngine`) — onboarding through activation.
- The Customer Health Engine: computing a health score (`computeHealthScore`) and its tier (`computeHealthTier`) from multiple health components.
- The Success Plan Engine: objectives, milestones, and tasks, with governed transitions (`canTransitionSuccessPlan`).
- The Renewal Engine, with reminders (`SendReminderInput`) and a renewal outcome (`RenewalOutcome`).
- The Expansion Engine, for identifying account-expansion opportunities.
- The Customer Risk Engine: computing a risk score (`computeCustomerRiskScore`) and its level (`computeCustomerRiskLevel`).
- The Feedback Engine: computing NPS (`computeNpsScore`/`computeNpsCategory`) and average CSAT (`computeAverageCsat`).
- A Relationship Layer with seven sibling packages, a query layer, and a typed domain event bus.

## Non-responsibilities

- No core sales or CRM logic — it consumes those engines only through narrow slices.
- No AI inference; every computation (health, risk, NPS) is an explicit deterministic formula.
- No persistence beyond in-memory repositories.
- No UI/API/HTTP.

## Public Runtime

The composition root is `createCustomerSuccessRuntime(deps: CustomerSuccessRuntimeDeps = {})` in `src/runtime.ts`, returning a `CustomerSuccessRuntime` with: `customers`, `health`, `plans`, `renewals`, `expansion`, `risks`, `feedback`, `relationships`, `queries`, `events`.

## Public Queries

`CustomerSuccessQueries`: `findCustomers`, `findHealth`, `findRenewals`, `findPlans`, `findFeedback`, `findRisks`, `findExpansion`, `searchCustomerSuccess`.

## Typed Events

`CUSTOMER_SUCCESS_EVENT_NAMES`: `customer.onboarded`, `customer.activated`, `customer.health.updated`, `renewal.created`, `renewal.completed`, `customer.churned`, `customer.reactivated`, `feedback.received`, `successplan.completed`, `risk.detected`.

## Dependencies

Per `package.json`: `@lateen-os/analytics-engine`, `@lateen-os/business-dna`, `@lateen-os/communication-hub`, `@lateen-os/crm-engine`, `@lateen-os/institutional-memory`, `@lateen-os/project-management-engine`, `@lateen-os/sales-engine`, `@lateen-os/shared-kernel`.

## Dependents

Verified by grepping `package.json` across the workspace: `api-gateway`, `document-management-engine`.

## Integration Points

A real `relationship-management/` folder injects seven optional collaborators, each a narrow `Pick<>` slice: `crm?: Pick<CrmRuntime, 'customers'>`, `sales?: Pick<SalesRuntime, 'opportunities'>`, `projects?: Pick<ProjectRuntime, 'queries'>`, `communicationHub?: Pick<CommunicationRuntime, 'notifications'>`, `analytics?: Pick<AnalyticsRuntime, 'metrics'>`, `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`, `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

## Architecture Notes

- This package is an Era-2 package and follows the rigid template fully: `shared/` → `events/` → one folder per subdomain → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`.
- Seven relationship collaborators is among the highest counts of the ten packages in this documentation batch, reflecting the package's position as a late aggregation point in the value chain (post-sale).

## Design Decisions

- Every computation (health, risk, NPS) is an explicit pure function (`computeHealthScore`, `computeCustomerRiskScore`, `computeNpsScore`), testable in isolation from any state or injection.
- Success plans are built as an explicit hierarchy (plan → objective → milestone → task) rather than a flat task list.

## Extension Points

Any future package that wants to consume customer success data should consume only the public `createCustomerSuccessRuntime()` and request the slices it needs — exactly as `document-management-engine` already does via `Pick<CustomerSuccessRuntime, 'customers'>`.

## Related Engines

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Communication Hub](./communication-hub.md)
- [Document Management Engine](./document-management-engine.md)
