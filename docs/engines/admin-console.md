---
title: Admin Console Engine
title_ar: محرك لوحة الإدارة
version: 1.0.0
status: active
package: "@lateen-os/admin-console"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-compliance-engine
  - ai-governance-engine
  - ai-security-engine
  - analytics-engine
  - api-gateway
  - business-dna
  - communication-hub
  - institutional-memory
  - observability-engine
  - marketplace
---

# العربية

## لوحة الإدارة (Admin Console)

### 1. الغرض

لوحة الإدارة هي سطح المنصة الإداري في Lateen OS (حزمة من الحقبة الثانية/Era 2). توفر سجلات المؤسسات (Organizations)، المستأجرين والبيئات (Tenants/Environments)، أعلام الميزات (Feature Flags)، إدارة الهوية (المستخدمون/المجموعات/الأدوار/الصلاحيات)، الإعدادات النظامية المُصدَّرة، إدارة التهيئة، مركز التدقيق، مراقبة النظام، ولوحة إدارة تنفيذية — كل ذلك دون تكرار منطق أي حزمة شقيقة أخرى.

### 2. المسؤوليات

- سجل المؤسسات (تسجيل، انتقال حالة عبر `canTransitionOrganization`).
- سجل المستأجرين والبيئات (`createTenantEngine`، `canTransitionTenant`).
- سجل أعلام الميزات مع سياق تحليل (`FeatureFlagResolutionContext`).
- إدارة الهوية: المستخدمون، المجموعات، الأدوار، الصلاحيات (`IdentityAdministrationEngine`) — إدارة سجلات الهوية فقط.
- الإعدادات المُصدَّرة (عامة/مستأجر/مؤسسة) عبر `SettingsEngine`.
- إدارة التهيئة وقت التشغيل مع التحقق (`validateConfigPayload`).
- مركز التدقيق (`AuditCenterEngine`).
- مراقبة النظام — مبنية بالكامل فوق طبقة العلاقات (Observability/Analytics/Security/Governance/Compliance) دون تكرار منطق أي منها.
- لوحة القيادة الإدارية (`computeSystemStatus`) — مركّبة فوق كل ما سبق.
- طبقة استعلام CQRS وناقل أحداث مكتوب النوع.

### 3. خارج نطاق المسؤولية

- لا تقوم بالمصادقة (Authentication) بنفسها — "إدارة الهوية" هنا تعني إدارة سجلات المستخدم/الدور/الصلاحية فقط؛ التحقق الفعلي من الهوية مُركَّب دائمًا مع `ai-security-engine` عبر طبقة العلاقات، وليس مكررًا هنا.
- لا تنفّذ منطق المراقبة أو التحليلات بنفسها — تستهلك `queries` الخاصة بـ `observability-engine`/`analytics-engine`/`ai-security-engine`/`ai-governance-engine`/`ai-compliance-engine` فقط.
- لا تستدعي أي نموذج لغة كبير.
- لا تُخزِّن أي مستودع (`Repository`) كجزء من سطحها العام — كل مستودع داخلي فقط.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createAdminConsoleRuntime(deps: AdminConsoleRuntimeDeps = {})` في `runtime.ts`، ويُعيد `AdminConsoleRuntime`:
`{ organizations, tenants, featureFlags, identity, settings, configuration, audit, monitoring, dashboard, relationshipManagement, queries, events }`.
كل مستودع (10 مستودعات) يُنشأ داخل `runtime.ts` فقط ولا يظهر أبدًا في هذا الكائن المُعاد.

### 5. الاستعلامات العامة

`AdminQueries` (من `queries/admin-queries.ts`): `findOrganizations`، `findTenants`، `findUsers`، `findRoles`، `findSettings`، `findAudits`، `findDashboard`، `searchAdministration`.

### 6. الأحداث المكتوبة النوع

`ADMIN_EVENT_NAMES` (10 أحداث حقيقية، جميعها بصيغة `noun.verb`): `organization.created`، `tenant.created`، `user.created`، `role.created`، `settings.updated`، `feature.enabled`، `feature.disabled`، `audit.recorded`، `dashboard.generated`، `configuration.updated`.

### 7. الاعتماديات

من `package.json`: `ai-compliance-engine`، `ai-governance-engine`، `ai-security-engine`، `analytics-engine`، `api-gateway`، `business-dna`، `communication-hub`، `institutional-memory`، `observability-engine`، `shared-kernel` (10 اعتماديات).

### 8. الحزم المعتمِدة

`packages/marketplace` (`@lateen-os/marketplace-engine`) هي المستهلك الوحيد المسجَّل حاليًا ضمن `packages/*`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 9 متعاونين اختياريين، كل واحد مُنمَّط بشكل ضيق عبر `Pick<...>`: `apiGateway: Pick<ApiGatewayRuntime,'queries'>`، `observability: Pick<ObservabilityRuntime,'queries'>`، `analytics: Pick<AnalyticsRuntime,'queries'>`، `aiSecurity: Pick<SecurityRuntime,'queries'>`، `aiGovernance: Pick<GovernanceRuntime,'queries'>`، `aiCompliance: Pick<ComplianceRuntime,'queries'>`، `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`، `institutionalMemory: Pick<InstitutionalMemoryRuntime,'lifecycle'>`، `communicationHub: Pick<CommunicationRuntime,'notifications'>`. محرك المراقبة (`monitoring`) هو المستهلك الرئيسي لهذه الطبقة.

### 10. ملاحظات معمارية

حزمة من الحقبة الثانية تتبع النمط القياسي بدقة (`shared/`، `events/`، مجلد فرعي لكل نطاق، `relationship-management/`، `queries/`، `runtime.ts`). لا انحراف معماري مسجَّل لهذه الحزمة في تقارير الشهادة.

### 11. قرارات التصميم

- ساعة حقن (`now: () => string` تلقائيًا `nowIso`) في كل خدمة تحتاج طابعًا زمنيًا.
- ناقل الأحداث اختياري، ويُبنى تلقائيًا عبر `createAdminEventBus()` إن لم يُحقن.
- لوحة القيادة (`dashboard`) لا تعيد حساب منطق كل نطاق فرعي بل تُركِّب نتائج `tenants`/`featureFlags`/`identity`/`audit`/`monitoring` مباشرة.

### 12. نقاط التوسعة

أي حزمة مستقبلية تريد بيانات إدارية (مثل حالة مؤسسة أو نتيجة تدقيق) يجب أن تستهلك `AdminQueries` أو تُحقن نفسها كمتعاون في `RelationshipManagementDeps` الخاص بها هي — لا يجوز تعديل `admin-console` نفسها لخدمة حزمة أخرى.

### 13. المحركات ذات الصلة

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [institutional-memory](./institutional-memory.md) · [observability-engine](./observability-engine.md) · [marketplace](./marketplace.md)

---

# English

## Admin Console

### 1. Purpose

The Admin Console is Lateen OS's administrative platform surface (an Era-2 package). It provides the Organization registry, the Tenant/Environment registry, Feature Flags, Identity Administration (users/groups/roles/permissions), versioned System Settings, Configuration Management, the Audit Center, System Monitoring, and an executive Administration Dashboard — without duplicating any sibling package's logic.

### 2. Responsibilities

- Organization registry (registration, state transition via `canTransitionOrganization`).
- Tenant/Environment registry (`createTenantEngine`, `canTransitionTenant`).
- Feature Flag registry with resolution context (`FeatureFlagResolutionContext`).
- Identity Administration: Users, Groups, Roles, Permissions (`IdentityAdministrationEngine`) — record administration only.
- Versioned Settings (global/tenant/organization) via `SettingsEngine`.
- Runtime Configuration Management with validation (`validateConfigPayload`).
- Audit Center (`AuditCenterEngine`).
- System Monitoring — built entirely on the Relationship Layer (Observability/Analytics/Security/Governance/Compliance) without re-implementing any of their logic.
- Administration Dashboard (`computeSystemStatus`) — composed over everything above.
- A CQRS query layer and a typed event bus.

### 3. Non-responsibilities

- Does not perform authentication itself — "Identity Administration" here means administering user/role/permission records only; real credential verification is always composed with `ai-security-engine` through the Relationship Layer, never duplicated here.
- Does not implement monitoring or analytics logic itself — it only consumes `observability-engine`'s/`analytics-engine`'s/`ai-security-engine`'s/`ai-governance-engine`'s/`ai-compliance-engine`'s `queries`.
- Never calls an LLM.
- Never exposes a repository on its public surface — every repository is internal to `runtime.ts`.

### 4. Public Runtime

The real composition root is `createAdminConsoleRuntime(deps: AdminConsoleRuntimeDeps = {})` in `runtime.ts`, returning `AdminConsoleRuntime`:
`{ organizations, tenants, featureFlags, identity, settings, configuration, audit, monitoring, dashboard, relationshipManagement, queries, events }`.
All 10 repositories are constructed inside `runtime.ts` only and never appear on this returned object.

### 5. Public Queries

`AdminQueries` (from `queries/admin-queries.ts`): `findOrganizations`, `findTenants`, `findUsers`, `findRoles`, `findSettings`, `findAudits`, `findDashboard`, `searchAdministration`.

### 6. Typed Events

`ADMIN_EVENT_NAMES` (10 real events, all `noun.verb`): `organization.created`, `tenant.created`, `user.created`, `role.created`, `settings.updated`, `feature.enabled`, `feature.disabled`, `audit.recorded`, `dashboard.generated`, `configuration.updated`.

### 7. Dependencies

From `package.json`: `ai-compliance-engine`, `ai-governance-engine`, `ai-security-engine`, `analytics-engine`, `api-gateway`, `business-dna`, `communication-hub`, `institutional-memory`, `observability-engine`, `shared-kernel` (10 dependencies).

### 8. Dependents

`packages/marketplace` (`@lateen-os/marketplace-engine`) is the only currently-registered consumer within `packages/*`.

### 9. Integration Points

`relationship-management/types.ts` defines 9 optional collaborators, each narrowly `Pick<...>`-typed: `apiGateway: Pick<ApiGatewayRuntime,'queries'>`, `observability: Pick<ObservabilityRuntime,'queries'>`, `analytics: Pick<AnalyticsRuntime,'queries'>`, `aiSecurity: Pick<SecurityRuntime,'queries'>`, `aiGovernance: Pick<GovernanceRuntime,'queries'>`, `aiCompliance: Pick<ComplianceRuntime,'queries'>`, `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`, `institutionalMemory: Pick<InstitutionalMemoryRuntime,'lifecycle'>`, `communicationHub: Pick<CommunicationRuntime,'notifications'>`. The `monitoring` engine is the primary consumer of this layer.

### 10. Architecture Notes

An Era-2 package following the standard construction pattern precisely (`shared/`, `events/`, one folder per subdomain, `relationship-management/`, `queries/`, `runtime.ts`). No architectural deviation is recorded for this package in the certification reports.

### 11. Design Decisions

- An injectable clock (`now: () => string`, defaulting to `nowIso`) on every service that needs a timestamp.
- The event bus is optional and defaults to `createAdminEventBus()` if not injected.
- The dashboard does not recompute each subdomain's logic — it composes `tenants`/`featureFlags`/`identity`/`audit`/`monitoring` results directly.

### 12. Extension Points

Any future package that needs administrative data (e.g., organization status or an audit result) should consume `AdminQueries`, or inject itself as a collaborator in its own `RelationshipManagementDeps` — `admin-console` itself must never be modified to accommodate another package.

### 13. Related Engines

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [institutional-memory](./institutional-memory.md) · [observability-engine](./observability-engine.md) · [marketplace](./marketplace.md)
