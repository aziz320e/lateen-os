---
title: Integration Contracts Engine
title_ar: عقود التكامل
version: 1.0.0
status: active
package: "@lateen-os/integration-contracts"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - connector-base
  - extension-system
---

# العربية

## عقود التكامل — Integration Contracts

### 1. الغرض

`@lateen-os/integration-contracts` هي حزمة **عقود مشتركة فقط** (types-only) تُعرّف الشكل الذي يجب أن تلتزم به أي إضافة موصل (Connector) تتكامل مع منصة Lateen OS — بدون أي منطق أعمال، وبدون أي اعتمادية على `connector-base` أو أي حزمة أخرى في المنصة. الهدف هو أن يستطيع مطوّرو الموصلات الخارجية (Slack، Stripe، Shopify، إلخ) بناء تكامل متوافق دون الاعتماد على أي تنفيذ فعلي داخل المنصة.

### 2. المسؤوليات

- تعريف تصنيفات الموصلات (`ConnectorCategory`: ERP، CRM، ECOMMERCE، ACCOUNTING، EMAIL، MESSAGING، STORAGE، CALENDAR، PAYMENTS، MARKETING، AI_PROVIDERS، CUSTOM_REST، GRAPHQL).
- تعريف طرق المصادقة (`AuthMethod`)، اتجاهات المزامنة (`SyncDirection`)، وأنماط المزامنة (`SyncMode`).
- تعريف أنواع أحداث الويب هوك (`WebhookEventType`).
- تعريف واجهات المحول: `SyncAdapter` (سحب/دفع/الأوضاع/الكيانات المدعومة)، `WebhookAdapter` (تسجيل/تحقق/تحليل حدث)، `HealthAdapter` (فحص الصحة).
- تعريف واجهة `ConnectorProvider` الكاملة (السطح الكامل لموصل ضمن Integration Hub) و`ConnectorProviderPort` (المنفذ المتوافق الأضيق الذي يستخدمه Integration Hub اليوم فعليًا).

### 3. خارج نطاق المسؤولية

- لا تنفيذ فعلي لأي موصل — أنواع فقط.
- لا منطق أعمال، لا حالة، لا شبكة، لا استدعاء LLM.
- لا اعتمادية على `connector-base` أو أي حزمة تشغيل أخرى (استقلالية كاملة مقصودة).

### 4. وقت التشغيل العام

**لا يوجد جذر تركيب (`createXRuntime()`) في هذه الحزمة، وهذا صحيح معماريًا** — الحزمة بأكملها عبارة عن أنواع وواجهات TypeScript (`src/index.ts`) دون أي حالة أو تعاونيات لتركيبها. لا توجد دالة `create*` واحدة في كامل الحزمة.

### 5. الاستعلامات العامة

لا يوجد مجلد `queries/` — لا توجد حالة نطاق قابلة للاستعلام؛ هذه حزمة عقود بحتة.

### 6. الأحداث المكتوبة النوع

لا يوجد ناقل أحداث. `WebhookEventType` يعرّف تسمية أحداث الويب هوك الخارجية (`installed`، `connected`، `disconnected`، `sync_started`، `sync_completed`، `sync_failed`) كنوع بيانات فقط، وليست أحداثًا داخلية منشورة عبر ناقل أحداث Lateen OS.

### 7. الاعتماديات

لا توجد أي اعتمادية `@lateen-os/*` في `dependencies` — فقط اعتماديات تطوير (`typescript-config`، `@types/node`، `typescript`، `vitest`). هذا مقصود ومطابق للوصف الذاتي للحزمة: "no business logic, no hub dependency".

### 8. الحزم المعتمِدة

`@lateen-os/connector-base` يعتمد عليها. كما تعتمد عليها كل حزم `extensions/*` تقريبًا (dropbox، erpnext، gmail، google-drive، google-workspace، hubspot، microsoft-365، odoo، onedrive، outlook، paypal، quickbooks، shopify، slack، stripe، teams، whatsapp-business، woocommerce) — وهي خارج نطاق `packages/*` لكنها المستهلك الفعلي الأكبر لهذه العقود.

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` ولا أي تكامل نطاق تشغيل مع أي حزمة شقيقة — هذه حزمة عقود مستوردة من طرف الآخرين (Connector Base وإضافات الموصلات)، لا تستورد هي نفسها من أي حزمة أخرى.

### 10. ملاحظات معمارية

من بين الحزم القليلة (مع `connector-base` و`typescript-config`) التي تفتقر تمامًا إلى README/ARCHITECTURE/MODEL خاص بها — وهذا موثّق في `ARCHITECTURE_AUDIT.md` (F5) كاستثناء بنيوي مشروع لحزمة عقود رقيقة ومستقرة، وليس فجوة توثيق حقيقية.

### 11. قرارات التصميم

- فصل صارم بين `ConnectorProvider` (السطح الكامل المحتمل) و`ConnectorProviderPort` (المنفذ الأضيق الذي يستهلكه Integration Hub فعليًا اليوم) — يسمح بتطور تدريجي للعقد دون كسر المستهلك الحالي.
- كل عملية غير متزامنة (`Promise`) وكل حقل للقراءة فقط (`readonly`) — اتساق مع بقية المنصة رغم عدم استيراد `shared-kernel`.

### 12. نقاط التوسعة

أي موصل جديد (extension) يجب أن يلتزم بواجهة `ConnectorProvider` أو `ConnectorProviderPort` المُصدّرة هنا دون تعديل هذه الحزمة؛ وأي تغيير مستقبلي على العقد نفسه يجب أن يمر بحزمة `integration-contracts` عبر التزام مخصص، لا عبر إضافة طفرات محلية في حزمة مستهلكة.

### 13. المحركات ذات الصلة

- [extension-system](./extension-system.md)

---

# English

## Integration Contracts Engine

### 1. Purpose

`@lateen-os/integration-contracts` is a **contracts-only** (types-only) package that defines the shape any connector extension integrating with Lateen OS must conform to — with no business logic and no dependency on `connector-base` or any other platform package. The goal is to let external connector developers (Slack, Stripe, Shopify, etc.) build a compatible integration without depending on any concrete in-platform implementation.

### 2. Responsibilities

- Define connector categories (`ConnectorCategory`: ERP, CRM, ECOMMERCE, ACCOUNTING, EMAIL, MESSAGING, STORAGE, CALENDAR, PAYMENTS, MARKETING, AI_PROVIDERS, CUSTOM_REST, GRAPHQL).
- Define authentication methods (`AuthMethod`), sync directions (`SyncDirection`), and sync modes (`SyncMode`).
- Define webhook event types (`WebhookEventType`).
- Define adapter interfaces: `SyncAdapter` (pull/push/supported modes/supported entities), `WebhookAdapter` (register/verify/parse event), `HealthAdapter` (health check).
- Define the full `ConnectorProvider` interface (a connector's complete surface within Integration Hub) and `ConnectorProviderPort` (the narrower, hub-compatible port Integration Hub actually consumes today).

### 3. Non-responsibilities

- No actual connector implementation — types only.
- No business logic, no state, no network calls, no LLM invocation.
- No dependency on `connector-base` or any other runtime package (deliberate full independence).

### 4. Public Runtime

**This package has no composition root (`createXRuntime()`), and this is architecturally correct** — the entire package is TypeScript types and interfaces (`src/index.ts`) with no state or collaborators to compose. There is not a single `create*` function anywhere in the package.

### 5. Public Queries

There is no `queries/` folder — there is no queryable domain state; this is a pure contracts package.

### 6. Typed Events

There is no event bus. `WebhookEventType` defines external webhook event naming (`installed`, `connected`, `disconnected`, `sync_started`, `sync_completed`, `sync_failed`) purely as a data type, not as events published through a Lateen OS event bus.

### 7. Dependencies

No `@lateen-os/*` entries appear in `dependencies` at all — only dev dependencies (`typescript-config`, `@types/node`, `typescript`, `vitest`). This is deliberate and matches the package's own self-description: "no business logic, no hub dependency."

### 8. Dependents

`@lateen-os/connector-base` depends on it. Nearly every `extensions/*` package also depends on it (dropbox, erpnext, gmail, google-drive, google-workspace, hubspot, microsoft-365, odoo, onedrive, outlook, paypal, quickbooks, shopify, slack, stripe, teams, whatsapp-business, woocommerce) — outside `packages/*` scope, but the largest real consumer of these contracts.

### 9. Integration Points

There is no `relationship-management/` folder and no runtime-surface integration with any sibling package — this is a contracts package imported by others (Connector Base and connector extensions), not one that imports from any other package itself.

### 10. Architecture Notes

One of the few packages (alongside `connector-base` and `typescript-config`) entirely missing its own README/ARCHITECTURE/MODEL trio — documented in `ARCHITECTURE_AUDIT.md` (F5) as a legitimate structural exemption for a thin, stable contracts-only package, not a genuine documentation gap.

### 11. Design Decisions

- Strict separation between `ConnectorProvider` (the full potential surface) and `ConnectorProviderPort` (the narrower port Integration Hub actually consumes today) — allows the contract to evolve incrementally without breaking the current consumer.
- Every operation is asynchronous (`Promise`) and every field is `readonly` — consistent with the rest of the platform despite not importing `shared-kernel`.

### 12. Extension Points

Any new connector (extension) must conform to the `ConnectorProvider` or `ConnectorProviderPort` interfaces exported here without modifying this package; any future change to the contract itself must go through `integration-contracts` in its own dedicated commit, not through local mutations added in a consuming package.

### 13. Related Engines

- [extension-system](./extension-system.md)
