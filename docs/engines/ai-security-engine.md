---
title: AI Security Engine
title_ar: محرك الأمن الذكي
version: 1.0.0
status: active
package: "@lateen-os/ai-security-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/SECURITY_AUDIT.md
related_packages:
  - ai-brain
  - ai-provider-hub
  - ai-runtime
  - business-dna
  - communication-hub
  - workflow-engine
  - admin-console
  - ai-compliance-engine
  - ai-governance-engine
  - analytics-engine
  - api-gateway
  - observability-engine
---

# العربية

## محرك الأمن الذكي (AI Security Engine)

### 1. الغرض

`ai-security-engine` هو محرك الأمن الشامل لـ Lateen OS، ويفتح طبقة الثقة في المنصة (أول التزام في تسلسل: أمن ← حوكمة ← امتثال). يغطي الهوية، المصادقة، التفويض، الأسرار، أمن المزوّدين/المطالبات/الأدوات، أمن البيانات، كشف التهديدات، والتدقيق — وهو السجل المركزي الذي تكتب إليه كل الأنظمة الفرعية الأخرى.

### 2. المسؤوليات

- خدمة الهوية (`IdentityService`).
- خدمة المصادقة (`AuthenticationService`) — مُركَّبة مع الهوية والتدقيق.
- خدمة التفويض (`AuthorizationService`) — أدوار/سياسات/تعيينات أدوار، مُركَّبة مع التدقيق.
- خدمة الأسرار (`SecretsService`) — تشفير AES-256-GCM حقيقي (انظر القسم 11).
- أمن المزوّدين (`ProviderSecurityService`) — مُركَّب مع `ai-provider-hub` عبر أنواع `Pick` ضيقة (`ProviderRegistry.findByKind`، `ModelRegistry.get`).
- أمن المطالبات (`PromptSecurityService`) — مبني فوق خدمة التدقيق.
- أمن الأدوات (`ToolSecurityService`) — مُركَّب مع `ai-runtime` عبر `Pick<ToolExecutionFramework,'listTools'>`.
- أمن البيانات (`DataSecurityService`) — قواعد الاحتفاظ.
- محرك كشف التهديدات (`ThreatDetectionEngine`).
- خدمة التدقيق (`AuditService`) — المخزن المشترك الذي تكتب إليه كل الأنظمة الفرعية الأخرى.
- طبقة العلاقات (العقل الاصطناعي، سير العمل، مركز الاتصال، Business DNA)، طبقة الاستعلام، وناقل الأحداث.

### 3. خارج نطاق المسؤولية

- لا تُخزِّن أي سر بنص صريح — كل قيمة سر تُشفَّر بخوارزمية AES-256-GCM حقيقية قبل التخزين (انظر القسم 11).
- لا تستدعي أي نموذج لغة كبير.
- لا تُسجِّل مزوّدين أو نماذج أو أدوات بنفسها — فقط تقرأ عبر منافذ `Pick` ضيقة مزوَّدة من `ai-provider-hub`/`ai-runtime`.
- لا تُنفِّذ سير عمل — فقط تدمج مع `workflow-engine` عبر شريحة علاقات اختيارية.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createSecurityRuntime(deps: SecurityRuntimeDeps = {})` في `runtime.ts`، ويُعيد `SecurityRuntime`:
`{ identity, authentication, authorization, secrets, providerSecurity, promptSecurity, toolSecurity, dataSecurity, threatDetection, audit, relationships, queries, events }`.

### 5. الاستعلامات العامة

`SecurityQueries`: `findAuditEvents`، `findThreats`، `findSecrets`، `findPolicies`، `findViolations`، `searchSecurity` (6 طرق).

### 6. الأحداث المكتوبة النوع

`SECURITY_EVENT_NAMES` (8 أحداث): `authentication.failed`، `authorization.denied`، `secret.rotated`، `prompt.attack.detected`، `tool.blocked`، `provider.blocked`، `policy.updated`، `audit.created`.

### 7. الاعتماديات

من `package.json`: `ai-brain`، `ai-provider-hub`، `ai-runtime`، `business-dna`، `communication-hub`، `shared-kernel`، `workflow-engine` (7 اعتماديات).

### 8. الحزم المعتمِدة

`admin-console`، `ai-compliance-engine`، `ai-governance-engine`، `analytics-engine`، `api-gateway`، `observability-engine`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 4 متعاونين: `aiBrain: { queries: Pick<BrainQueries,'explainPlan'> }`، `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`، `communicationHub: Pick<CommunicationRuntime,'notifications'>`، `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`. التكامل مع `ai-runtime` و`ai-provider-hub` **منفصل عن هذه الطبقة عمدًا** — موثَّق في تعليق الكود: يتم عبر `SecurityRuntimeDeps.toolExecution`/`providerRegistry`/`modelRegistry` مباشرة، لخدمتي أمن الأدوات وأمن المزوّدين تحديدًا.

### 10. ملاحظات معمارية

مسارا تكامل منفصلان بوضوح — طبقة علاقات عامة لأربعة أشقاء، ومنافذ ضيقة إضافية مباشرة في `SecurityRuntimeDeps` لخدمتي أمن الأدوات/المزوّدين — موثَّقان في الكود، وليسا تعارضًا.

### 11. قرارات التصميم

- **تشفير حقيقي** عبر `node:crypto` فقط (بدون مكتبات خارجية): AES-256-GCM حقيقي (`encryptValue`/`decryptValue` في `shared/crypto.ts`) لقيم الأسرار، SHA-256 أحادي الاتجاه للرموز/مفاتيح API (`hashValue`)، HMAC-SHA256 حقيقي للتوقيع (`signHmac`) مع تحقق آمن زمنيًا (`verifyHmac` عبر `timingSafeEqual`)، ومولّد بايتات عشوائي قابل للحقن (`RandomBytesFn`) لجعل الاختبارات حتمية دون إضعاف السلوك الفعلي.
- ساعة حقن (`now`) افتراضية `nowIso`، وناقل أحداث افتراضي `createSecurityEventBus()`.
- خدمة التدقيق (`audit`) تُحقن في كل خدمة أخرى تقريبًا (المصادقة، التفويض، الأسرار، أمن المزوّدين، أمن الأدوات، كشف التهديدات) لتكون سجلًا مركزيًا واحدًا.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات أمنية يجب أن تستهلك `SecurityQueries` فقط، أو تُحقن كمتعاون في `SecurityRuntimeDeps` عبر التزام مخصص لهذه الحزمة.

### 13. المحركات ذات الصلة

[ai-brain](./ai-brain.md) · [ai-provider-hub](./ai-provider-hub.md) · [ai-runtime](./ai-runtime.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)

---

# English

## AI Security Engine

### 1. Purpose

`ai-security-engine` is Lateen OS's comprehensive security engine, and it opens the platform's trust layer (the first commit in the sequence: security → governance → compliance). It covers identity, authentication, authorization, secrets, provider/prompt/tool security, data security, threat detection, and audit — and is the central sink every other subsystem writes to.

### 2. Responsibilities

- Identity service (`IdentityService`).
- Authentication service (`AuthenticationService`) — composed with identity and audit.
- Authorization service (`AuthorizationService`) — roles/policies/role-assignments, composed with audit.
- Secrets service (`SecretsService`) — real AES-256-GCM encryption (see Section 11).
- Provider security (`ProviderSecurityService`) — composed with `ai-provider-hub` through narrow `Pick` types (`ProviderRegistry.findByKind`, `ModelRegistry.get`).
- Prompt security (`PromptSecurityService`) — built on the audit service.
- Tool security (`ToolSecurityService`) — composed with `ai-runtime` via `Pick<ToolExecutionFramework,'listTools'>`.
- Data security (`DataSecurityService`) — retention rules.
- The threat detection engine (`ThreatDetectionEngine`).
- The audit service (`AuditService`) — the shared sink every other subsystem writes to.
- The Relationship Layer (AI Brain, Workflow Engine, Communication Hub, Business DNA), the query layer, and the event bus.

### 3. Non-responsibilities

- Never stores a secret in plaintext — every secret value is encrypted with real AES-256-GCM before storage (see Section 11).
- Never calls an LLM.
- Does not register providers, models, or tools itself — it only reads through narrow `Pick` ports supplied by `ai-provider-hub`/`ai-runtime`.
- Does not execute workflows — it only integrates with `workflow-engine` through an optional relationship slice.

### 4. Public Runtime

The real composition root is `createSecurityRuntime(deps: SecurityRuntimeDeps = {})` in `runtime.ts`, returning `SecurityRuntime`:
`{ identity, authentication, authorization, secrets, providerSecurity, promptSecurity, toolSecurity, dataSecurity, threatDetection, audit, relationships, queries, events }`.

### 5. Public Queries

`SecurityQueries`: `findAuditEvents`, `findThreats`, `findSecrets`, `findPolicies`, `findViolations`, `searchSecurity` (6 methods).

### 6. Typed Events

`SECURITY_EVENT_NAMES` (8 events): `authentication.failed`, `authorization.denied`, `secret.rotated`, `prompt.attack.detected`, `tool.blocked`, `provider.blocked`, `policy.updated`, `audit.created`.

### 7. Dependencies

From `package.json`: `ai-brain`, `ai-provider-hub`, `ai-runtime`, `business-dna`, `communication-hub`, `shared-kernel`, `workflow-engine` (7 dependencies).

### 8. Dependents

`admin-console`, `ai-compliance-engine`, `ai-governance-engine`, `analytics-engine`, `api-gateway`, `observability-engine`.

### 9. Integration Points

`relationship-management/types.ts` defines 4 collaborators: `aiBrain: { queries: Pick<BrainQueries,'explainPlan'> }`, `workflow: Pick<WorkflowRuntime,'defineWorkflow'|'startWorkflow'>`, `communicationHub: Pick<CommunicationRuntime,'notifications'>`, `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`. Integration with `ai-runtime` and `ai-provider-hub` is **deliberately separate from this layer** — documented in the code comment: it happens through `SecurityRuntimeDeps.toolExecution`/`providerRegistry`/`modelRegistry` directly, specifically for the tool security and provider security services.

### 10. Architecture Notes

Two clearly separate integration paths — a general Relationship Layer for four siblings, plus additional narrow ports directly in `SecurityRuntimeDeps` for the tool/provider security services — both documented in code, not a conflict.

### 11. Design Decisions

- **Real cryptography** via `node:crypto` only (no third-party library): real AES-256-GCM (`encryptValue`/`decryptValue` in `shared/crypto.ts`) for secret values, one-way SHA-256 for tokens/API keys (`hashValue`), real HMAC-SHA256 signing (`signHmac`) with timing-safe verification (`verifyHmac` via `timingSafeEqual`), and an injectable random-bytes source (`RandomBytesFn`) to keep tests deterministic without weakening production behavior.
- An injectable clock (`now`), defaulting to `nowIso`, and a default event bus, `createSecurityEventBus()`.
- The audit service (`audit`) is injected into nearly every other service (authentication, authorization, secrets, provider security, tool security, threat detection) so there is one single central log.

### 12. Extension Points

Any future package needing security data should consume `SecurityQueries` only, or inject itself as a collaborator in `SecurityRuntimeDeps` via a dedicated commit for this package.

### 13. Related Engines

[ai-brain](./ai-brain.md) · [ai-provider-hub](./ai-provider-hub.md) · [ai-runtime](./ai-runtime.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [analytics-engine](./analytics-engine.md) · [api-gateway](./api-gateway.md) · [observability-engine](./observability-engine.md)
