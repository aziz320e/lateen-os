---
title: API Gateway Engine
title_ar: محرك بوابة API
version: 1.0.0
status: active
package: "@lateen-os/api-gateway"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-compliance-engine
  - ai-governance-engine
  - ai-runtime
  - ai-security-engine
  - analytics-engine
  - business-dna
  - communication-hub
  - crm-engine
  - customer-success-engine
  - finance-engine
  - hr-engine
  - inventory-engine
  - marketing-engine
  - observability-engine
  - project-management-engine
  - sales-engine
  - workflow-engine
  - admin-console
  - marketplace
---

# العربية

## بوابة API (API Gateway)

### 1. الغرض

`api-gateway` هي بوابة API مستقلة عن أي إطار عمل في Lateen OS (حزمة من الحقبة الثانية): سجلات API/الإصدار/نقطة النهاية، خط أنابيب الوسيطات (Middleware)، المصادقة والتفويض، تحديد المعدل وإدارة الحصص، التحقق من الصحة، سياق الطلب، المقاييس، اكتشاف الخدمة، التوثيق، وموزِّع تشغيل حتمي (Runtime Dispatcher) يُشكِّل نقطة الدخول الموحّدة لكل نطاقات الأعمال في المنصة.

### 2. المسؤوليات

- سجل API/الإصدار/نقطة النهاية/المسار (`RegistryEngine`).
- خط أنابيب الوسيطات (`MiddlewarePipelineEngine`).
- المصادقة (مفاتيح API + JWT) والتفويض (تقييم سياسة) (`AuthenticationEngine`، `AuthorizationEngine`).
- تحديد المعدل وإدارة الحصص (`RateLimitEngine`).
- التحقق من صحة الطلب/الاستجابة (`ValidationEngine`).
- سياق الطلب (`RequestContextEngine`)، المقاييس والصحة (`MetricsEngine`).
- اكتشاف الخدمة (`ServiceDiscoveryEngine`).
- التوثيق (OpenAPI + نموذج قابل للقراءة البشرية) (`DocumentationEngine`).
- **موزِّع التشغيل (`DispatcherEngine`)** — مُركَّب فوق كل ما سبق بالإضافة إلى طبقة العلاقات؛ الاستثناء الوحيد المتعمَّد للاستدعاء الديناميكي غير المكتوب النوع في المنصة، لكنه يحل عبر جدول بحث ثابت وقت الترجمة (انظر القسم 10).
- طبقة استعلام وناقل أحداث مكتوب النوع.

### 3. خارج نطاق المسؤولية

- لا تُنفِّذ منطق أعمال أي نطاق شقيق — فقط توجّه الطلبات إليه عبر طبقة العلاقات.
- لا تستدعي أي نموذج لغة كبير.
- لا يوجد استدعاء ديناميكي حر بالسلسلة النصية (`any`-typed reflection) — حتى الموزِّع نفسه يحل عبر جدول ثابت.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createApiGatewayRuntime(deps: ApiGatewayRuntimeDeps = {})` في `runtime.ts`، ويُعيد `ApiGatewayRuntime`:
`{ registry, middleware, authentication, authorization, rateLimit, validation, requestContext, metrics, discovery, documentation, dispatcher, relationshipManagement, queries, events }`.

### 5. الاستعلامات العامة

`GatewayQueries`: `findApis`، `findRoutes`، `findApiKeys`، `findPolicies`، `findRequestContexts`، `findMetrics`، `findHealthSnapshots`، `findServices`، `searchGateway` (9 طرق).

### 6. الأحداث المكتوبة النوع

`GATEWAY_EVENT_NAMES` (10 أحداث): `api.registered`، `route.registered`، `version.published`، `apikey.issued`/`revoked`، `request.received`/`completed`/`rejected`، `ratelimit.exceeded`، `quota.exceeded`.

### 7. الاعتماديات

من `package.json`: `ai-compliance-engine`، `ai-governance-engine`، `ai-runtime`، `ai-security-engine`، `analytics-engine`، `business-dna`، `communication-hub`، `crm-engine`، `customer-success-engine`، `finance-engine`، `hr-engine`، `inventory-engine`، `marketing-engine`، `observability-engine`، `project-management-engine`، `sales-engine`، `shared-kernel`، `workflow-engine` (18 اعتمادية).

### 8. الحزم المعتمِدة

`admin-console`، `marketplace`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 16 متعاونًا اختياريًا — أوسع طبقة علاقات في المنصة — بما فيها `aiRuntime: Pick<RuntimeQueries,'findAgent'>` (النمط الخاص الموثَّق لـ`ai-runtime`)، `crm: Pick<CrmRuntime,'customers'>`، `sales: Pick<SalesRuntime,'opportunities'>`، `finance: Pick<FinanceRuntime,'chartOfAccounts'>`، `hr: Pick<HrRuntime,'employees'>`، `inventory: Pick<InventoryRuntime,'catalog'>`، وغيرها. **موزِّع التشغيل** (`dispatcher`) هو المستهلك الرئيسي لهذه الطبقة بأكملها.

### 10. ملاحظات معمارية

**موزِّع التشغيل هو الاستثناء المتعمَّد الوحيد في المنصة للاستدعاء الديناميكي** — موثَّق في `docs/AI_PROJECT_CONTEXT.md` §6 و`packages/api-gateway/GATEWAY_MODEL.md`. تم التحقق مباشرة من الشيفرة: `dispatcher/invoker-map.ts`'s `buildInvokerMap(relationships)` يبني `Readonly<Record<string, TargetInvoker>>` — جدول بحث ثابت مبني مرة واحدة من طبقة العلاقات نفسها، مفتاحه `` `${targetService}:${targetOperation}` `` — وليس انعكاسًا (`reflection`) حرًا أو استدعاءً بسلسلة نصية عشوائية. هذا يحل عبر نفس طبقة العلاقات الموحّدة ولا يشكّل استثناءً حقيقيًا لقاعدة "لا استدعاء ديناميكي غير مكتوب النوع".

### 11. قرارات التصميم

- ساعة حقن (`now`) افتراضية `nowIso`، وناقل أحداث افتراضي `createGatewayEventBus()`.
- التوثيق (`documentation`) يُركَّب مباشرة فوق `registry` القائم دون مستودع إضافي.
- 12 مستودعًا داخليًا مستقلًا، كل واحد مخصص لنطاق واحد (API، إصدار، نقطة نهاية، مسار، خطوة وسيط، مفتاح API، سياسة، سياسة تحديد معدل، عداد تحديد معدل، حصة، مخطط تحقق، سياق طلب، مقياس طلب، لقطة صحة، تسجيل خدمة).

### 12. نقاط التوسعة

أي نطاق أعمال جديد (Era 2 مستقبلية) يُدمَج مع البوابة بإضافة شريحة `Pick<XRuntime,'...'>` جديدة إلى `RelationshipManagementDeps` وربطها في `invoker-map.ts` — دون تعديل منطق الموزِّع الأساسي نفسه.

### 13. المحركات ذات الصلة

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [analytics-engine](./analytics-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [crm-engine](./crm-engine.md) · [customer-success-engine](./customer-success-engine.md) · [finance-engine](./finance-engine.md) · [hr-engine](./hr-engine.md) · [inventory-engine](./inventory-engine.md) · [marketing-engine](./marketing-engine.md) · [observability-engine](./observability-engine.md) · [project-management-engine](./project-management-engine.md) · [sales-engine](./sales-engine.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [marketplace](./marketplace.md)

---

# English

## API Gateway

### 1. Purpose

`api-gateway` is Lateen OS's framework-agnostic API gateway (an Era-2 package): API/version/endpoint registries, the middleware pipeline, authentication and authorization, rate limiting and quota management, request/response validation, request context, metrics, service discovery, documentation, and a deterministic Runtime Dispatcher forming the unified entry point into every business domain on the platform.

### 2. Responsibilities

- API/version/endpoint/route registry (`RegistryEngine`).
- The middleware pipeline (`MiddlewarePipelineEngine`).
- Authentication (API keys + JWT) and authorization (policy evaluation) (`AuthenticationEngine`, `AuthorizationEngine`).
- Rate limiting and quota management (`RateLimitEngine`).
- Request/response validation (`ValidationEngine`).
- Request context (`RequestContextEngine`), metrics and health (`MetricsEngine`).
- Service discovery (`ServiceDiscoveryEngine`).
- Documentation (OpenAPI + a human-readable model) (`DocumentationEngine`).
- **The Runtime Dispatcher (`DispatcherEngine`)** — composed over everything above plus the Relationship Layer; the platform's one deliberate exception for dynamic, non-statically-typed invocation, but resolved through a fixed, compile-time lookup table (see Section 10).
- A query layer and a typed event bus.

### 3. Non-responsibilities

- Does not implement any sibling domain's business logic — it only routes requests to it through the Relationship Layer.
- Never calls an LLM.
- No free-form, string-based dynamic invocation (`any`-typed reflection) — even the dispatcher itself resolves through a fixed table.

### 4. Public Runtime

The real composition root is `createApiGatewayRuntime(deps: ApiGatewayRuntimeDeps = {})` in `runtime.ts`, returning `ApiGatewayRuntime`:
`{ registry, middleware, authentication, authorization, rateLimit, validation, requestContext, metrics, discovery, documentation, dispatcher, relationshipManagement, queries, events }`.

### 5. Public Queries

`GatewayQueries`: `findApis`, `findRoutes`, `findApiKeys`, `findPolicies`, `findRequestContexts`, `findMetrics`, `findHealthSnapshots`, `findServices`, `searchGateway` (9 methods).

### 6. Typed Events

`GATEWAY_EVENT_NAMES` (10 events): `api.registered`, `route.registered`, `version.published`, `apikey.issued`/`revoked`, `request.received`/`completed`/`rejected`, `ratelimit.exceeded`, `quota.exceeded`.

### 7. Dependencies

From `package.json`: `ai-compliance-engine`, `ai-governance-engine`, `ai-runtime`, `ai-security-engine`, `analytics-engine`, `business-dna`, `communication-hub`, `crm-engine`, `customer-success-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `marketing-engine`, `observability-engine`, `project-management-engine`, `sales-engine`, `shared-kernel`, `workflow-engine` (18 dependencies).

### 8. Dependents

`admin-console`, `marketplace`.

### 9. Integration Points

`relationship-management/types.ts` defines 16 optional collaborators — the platform's widest Relationship Layer — including `aiRuntime: Pick<RuntimeQueries,'findAgent'>` (the documented `ai-runtime` special case), `crm: Pick<CrmRuntime,'customers'>`, `sales: Pick<SalesRuntime,'opportunities'>`, `finance: Pick<FinanceRuntime,'chartOfAccounts'>`, `hr: Pick<HrRuntime,'employees'>`, `inventory: Pick<InventoryRuntime,'catalog'>`, and others. The **Runtime Dispatcher** (`dispatcher`) is the primary consumer of this entire layer.

### 10. Architecture Notes

**The Runtime Dispatcher is the platform's one deliberate exception for dynamic invocation** — documented in `docs/AI_PROJECT_CONTEXT.md` §6 and `packages/api-gateway/GATEWAY_MODEL.md`. Verified directly against the source: `dispatcher/invoker-map.ts`'s `buildInvokerMap(relationships)` builds a `Readonly<Record<string, TargetInvoker>>` — a fixed lookup table built once from the Relationship Layer itself, keyed by `` `${targetService}:${targetOperation}` `` — not free reflection or arbitrary string-based invocation. It resolves through the same unified Relationship Layer and does not constitute a real exception to "no untyped dynamic invocation."

### 11. Design Decisions

- An injectable clock (`now`), defaulting to `nowIso`, and a default event bus, `createGatewayEventBus()`.
- Documentation (`documentation`) is composed directly over the existing `registry` with no extra repository.
- 12 independent internal repositories, each dedicated to one subdomain (API, version, endpoint, route, middleware step, API key, policy, rate-limit policy, rate-limit counter, quota, validation schema, request context, request metric, health snapshot, service registration).

### 12. Extension Points

Any new (future Era-2) business domain integrates with the gateway by adding a new `Pick<XRuntime,'...'>` slice to `RelationshipManagementDeps` and wiring it into `invoker-map.ts` — without modifying the dispatcher's own core logic.

### 13. Related Engines

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [analytics-engine](./analytics-engine.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [crm-engine](./crm-engine.md) · [customer-success-engine](./customer-success-engine.md) · [finance-engine](./finance-engine.md) · [hr-engine](./hr-engine.md) · [inventory-engine](./inventory-engine.md) · [marketing-engine](./marketing-engine.md) · [observability-engine](./observability-engine.md) · [project-management-engine](./project-management-engine.md) · [sales-engine](./sales-engine.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [marketplace](./marketplace.md)
