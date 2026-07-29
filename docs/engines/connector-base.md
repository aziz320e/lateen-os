---
title: Connector Base
title_ar: القاعدة الأساسية للموصلات
version: 1.0.0
status: active
package: "@lateen-os/connector-base"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/KNOWN_TECHNICAL_DEBT.md
related_packages:
  - sdk
  - integration-contracts
---

# العربية

## الغرض

`@lateen-os/connector-base` يوفّر تنفيذًا أساسيًا (Base) قابلاً لإعادة الاستخدام لموصلات التكامل الحقيقية في Lateen OS (مثل Slack، Stripe، Shopify ضمن `extensions/*`). يمنح كل موصل جديد تنفيذًا جاهزًا للمزامنة (Sync)، الويب هوك (Webhook)، وفحص الصحة (Health)، بدلًا من أن يعيد كل موصل تنفيذ هذا المنطق المتكرر من الصفر.

هذه حزمة دعم منصّي (platform-support) من الحقبة الأولى (Era 1)، تسبق اصطلاح `relationship-management/` + `queries/` + `runtime.ts` + ثلاثية التوثيق (README/ARCHITECTURE/MODEL) — لا تمتلك أيًّا من هذه العناصر، وهذا استثناء بنيوي مشروع موثّق في `docs/certification/ARCHITECTURE_AUDIT.md` (F5)، وليس نقصًا يجب "تصحيحه" ضمن هذه المهمة التوثيقية.

## المسؤوليات

- `BaseConnectorProvider`: الواجهة الأساسية التي تجمع `sync`، `webhook`، `health`، إضافة إلى `testConnection` و`authenticate`.
- `BaseSyncAdapter`: سحب (`pull`) ودفع (`push`) بيانات محاكاة (simulated) لكل كيان، مع إعادة محاولة (`withRetry`) حقيقية.
- `BaseWebhookAdapter`: تسجيل ويب هوك، التحقق من التوقيع، وتحليل الحدث الوارد.
- `BaseHealthAdapter`: فحص صحة حقيقي يعتمد على وجود بيانات اعتماد (Credentials) فعلية.
- **تتبّع حقيقي (Telemetry) عبر OpenTelemetry**: كل عملية (`sync.pull`، `sync.push`، `webhook.register`، `health.check`، `testConnection`، `authenticate`) تُغلَّف بـ `withTelemetry()` التي تفتح Span حقيقيًا عبر `@opentelemetry/api` وتُسجّل الحالة (نجاح/خطأ) عليه.
- سجل تعريفات موفّري خدمات جاهزين (`PROVIDER_DEFINITIONS`) لثمانية عشر خدمة حقيقية معروفة (Google Workspace، Microsoft 365، Gmail، Outlook، Google Drive، OneDrive، Dropbox، Slack، Microsoft Teams، WhatsApp Business، Shopify، WooCommerce، Stripe، PayPal، HubSpot، Odoo، ERPNext، QuickBooks) مع طرق مصادقتها والمفاتيح المطلوبة لكل منها.

## خارج نطاق المسؤولية

- **لا بيانات حقيقية**: `BaseSyncAdapter.pull` يُرجع سجلات محاكاة (`simulateRecords`) وليست بيانات فعلية من أي خدمة خارجية — التنفيذ الفعلي للسحب/الدفع مقابل كل خدمة يعيش داخل `extensions/*` نفسها، وليس في هذه الحزمة.
- لا مجلد `queries/`، لا مجلد `events/`، لا مجلد `relationship-management/`، لا `runtime.ts`.
- لا وثائق `README.md`/`ARCHITECTURE.md`/`*_MODEL.md` لهذه الحزمة على الإطلاق.
- لا منطق أعمال خاص بمنصة Lateen OS نفسها — هذه حزمة بنية تحتية تقنية بحتة لموصلات خارجية.

## وقت التشغيل العام

لا يوجد جذر تركيب (`runtime.ts`/`createXRuntime()`). أقرب مكافئ هو دالة المصنع `createConnectorProvider(config: ProviderConfig): BaseConnectorProvider` في `src/base-provider.ts`، التي تبني كائن `BaseConnectorProvider` واحدًا يجمع `sync`/`webhook`/`health` لموصل واحد بعينه — وليس تركيبًا لكامل الحزمة. هذا يعكس طبيعة الحزمة كقالب أساسي (base class) يُستخدَم من قِبل كل موصل على حدة، لا كخدمة تشغيلية واحدة للمنصة.

## الاستعلامات العامة

لا يوجد. لا مجلد `queries/` ولا حالة قابلة للاستعلام تخص هذه الحزمة نفسها — الحزمة توفّر سلوكًا (behavior)، لا بيانات محفوظة.

## الأحداث المكتوبة النوع

لا يوجد. لا مجلد `events/` ولا ناقل أحداث نطاق. أقرب مفهوم للأحداث هو `WebhookEventType` (من `@lateen-os/integration-contracts`) المستخدَم في `BaseWebhookAdapter`، وهو نوع حدث ويب هوك خارجي وارد، وليس حدث نطاق داخلي منشور عبر ناقل أحداث.

## الاعتماديات

حسب `package.json`: `@lateen-os/integration-contracts` (أنواع الموصل والمزامنة والويب هوك)، `@lateen-os/sdk` (نوع `ConnectorManifest`/`ConnectorAuth`)، و`@opentelemetry/api` (تتبّع حقيقي، وليس Mock).

## الحزم المعتمِدة

لا توجد حزمة تحت `packages/*` تعتمد على `@lateen-os/connector-base` حاليًا (بحث فعلي في كل ملفات `package.json` عبر المستودع لم يُظهر أي نتيجة). مستهلكوها الفعليون يعيشون خارج نطاق `packages/*` — داخل `extensions/*` (موصلات Slack، Stripe، Shopify، إلخ)، وهي خارج نطاق انضباط بناء الحزم الموصوف في `AI_PROJECT_CONTEXT.md`.

## نقاط التكامل

لا يوجد مجلد `relationship-management/`. لا تكامل مع أي حزمة عمل (Business Engine) في المنصة — التكامل الوحيد هو مع عقود `integration-contracts` و`sdk` على مستوى الأنواع، واستهلاك خارجي من حزم `extensions/*`.

## ملاحظات معمارية

- **تتبّع حقيقي عبر OpenTelemetry**: هذه من الحزم القليلة في المنصة التي تستخدم مكتبة قياس/تتبع خارجية حقيقية (`@opentelemetry/api`) بدلًا من أن تكون "الذكاء الاصطناعي" أو "التتبّع" مجرد اسم بلا تنفيذ فعلي.
- تملك مجموعة اختبارات حقيقية (`tests/base-provider.test.ts`، `tests/discovery.test.ts`) رغم غياب توثيق README/ARCHITECTURE/MODEL — الفجوة هنا توثيقية فقط، وليست غيابًا للاختبارات.
- إعادة المحاولة (`withRetry`) تُميّز بين `RateLimitError` (تحترم `retryAfterMs`) وأي خطأ آخر (تأخير أُسّي بسيط عبر `baseDelayMs * attempt`).

## قرارات التصميم

- فصل صارم بين ثلاث قدرات مستقلة (مزامنة، ويب هوك، صحة) كفئات (`BaseSyncAdapter`/`BaseWebhookAdapter`/`BaseHealthAdapter`) بدلًا من فئة واحدة ضخمة، مع تجميعها في `BaseConnectorProvider` كواجهة واحدة.
- `toHubPort()` يوفّر واجهة مبسّطة متوافقة مع مستهلك مركزي (Hub) دون كشف كامل تفاصيل `BaseConnectorProvider`.
- سجل تعريفات الموفّرين (`PROVIDER_DEFINITIONS`) بيانات ساكنة صريحة بدلًا من اكتشاف ديناميكي، بما يحافظ على الحتمية.

## نقاط التوسعة

أي موصل جديد يجب أن يبني على `BaseConnectorProvider` عبر `createConnectorProvider()` ويزوّد `simulateRecords`/الإعدادات الخاصة به، بدلًا من تعديل هذه الحزمة الأساسية. إضافة موفّر خدمة جديد تكون عبر إضافة سطر جديد إلى `PROVIDER_DEFINITIONS` في `src/providers/registry.ts`، لا عبر تفريع الفئات الأساسية.

## المحركات ذات الصلة

- [SDK](./sdk.md)
- [Integration Contracts](./integration-contracts.md)

---

# English

## Purpose

`@lateen-os/connector-base` provides a reusable base implementation for Lateen OS's real integration connectors (e.g. Slack, Stripe, Shopify under `extensions/*`). It gives every new connector a ready-made sync, webhook, and health-check implementation instead of each connector reimplementing this repeated logic from scratch.

This is an Era-1 platform-support package that predates the `relationship-management/` + `queries/` + `runtime.ts` + doc-trio (README/ARCHITECTURE/MODEL) convention — it has none of these, which is a legitimate structural exemption documented in `docs/certification/ARCHITECTURE_AUDIT.md` (F5), not a gap to "correct" as part of this documentation task.

## Responsibilities

- `BaseConnectorProvider`: the base facade combining `sync`, `webhook`, `health`, plus `testConnection` and `authenticate`.
- `BaseSyncAdapter`: pulls and pushes simulated per-entity data, with a real `withRetry()` retry mechanism.
- `BaseWebhookAdapter`: webhook registration, signature verification, and inbound event parsing.
- `BaseHealthAdapter`: a real health check based on whether real credentials are present.
- **Real telemetry via OpenTelemetry**: every operation (`sync.pull`, `sync.push`, `webhook.register`, `health.check`, `testConnection`, `authenticate`) is wrapped in `withTelemetry()`, which opens a real span via `@opentelemetry/api` and records success/error status on it.
- A registry of ready-made provider definitions (`PROVIDER_DEFINITIONS`) for eighteen real, known services (Google Workspace, Microsoft 365, Gmail, Outlook, Google Drive, OneDrive, Dropbox, Slack, Microsoft Teams, WhatsApp Business, Shopify, WooCommerce, Stripe, PayPal, HubSpot, Odoo, ERPNext, QuickBooks) with their auth methods and required keys.

## Non-responsibilities

- **No real data**: `BaseSyncAdapter.pull` returns simulated records (`simulateRecords`), not actual data from any external service — the real pull/push implementation against each service lives inside `extensions/*` itself, not in this package.
- No `queries/` folder, no `events/` folder, no `relationship-management/` folder, no `runtime.ts`.
- No `README.md`/`ARCHITECTURE.md`/`*_MODEL.md` documentation for this package at all.
- No business logic specific to Lateen OS itself — this is a purely technical infrastructure package for external connectors.

## Public Runtime

There is no composition root (`runtime.ts`/`createXRuntime()`). The closest equivalent is the factory function `createConnectorProvider(config: ProviderConfig): BaseConnectorProvider` in `src/base-provider.ts`, which builds one `BaseConnectorProvider` object combining `sync`/`webhook`/`health` for a single specific connector — not a composition of the whole package. This reflects the package's nature as a base class template used by each connector individually, not one platform-wide runtime service.

## Public Queries

None. There is no `queries/` folder and no queryable state belonging to this package itself — the package provides behavior, not persisted data.

## Typed Events

None. There is no `events/` folder and no domain event bus. The closest concept is `WebhookEventType` (from `@lateen-os/integration-contracts`), used in `BaseWebhookAdapter` — an inbound external webhook event type, not an internal domain event published through an event bus.

## Dependencies

Per `package.json`: `@lateen-os/integration-contracts` (connector/sync/webhook types), `@lateen-os/sdk` (the `ConnectorManifest`/`ConnectorAuth` types), and `@opentelemetry/api` (real tracing, not a mock).

## Dependents

No package under `packages/*` currently depends on `@lateen-os/connector-base` (verified by grepping every `package.json` across the workspace — zero matches). Its real consumers live outside `packages/*` scope — inside `extensions/*` (Slack, Stripe, Shopify connectors, etc.), which is outside the package-construction discipline described in `AI_PROJECT_CONTEXT.md`.

## Integration Points

No `relationship-management/` folder exists. There is no integration with any business engine in the platform — the only integration is with `integration-contracts` and `sdk` contracts at the type level, and external consumption from `extensions/*` packages.

## Architecture Notes

- **Real telemetry via OpenTelemetry**: one of the few packages on the platform that uses a real external observability library (`@opentelemetry/api`) rather than "telemetry" being a name with no real implementation behind it.
- It has a real test suite (`tests/base-provider.test.ts`, `tests/discovery.test.ts`) despite lacking README/ARCHITECTURE/MODEL documentation — the gap here is purely documentation, not missing tests.
- Retry logic (`withRetry`) distinguishes `RateLimitError` (honors `retryAfterMs`) from any other error (simple exponential-ish delay via `baseDelayMs * attempt`).

## Design Decisions

- Strict separation of three independent capabilities (sync, webhook, health) into their own classes (`BaseSyncAdapter`/`BaseWebhookAdapter`/`BaseHealthAdapter`), composed together in `BaseConnectorProvider` as one facade.
- `toHubPort()` provides a simplified interface compatible with a central hub consumer, without exposing all of `BaseConnectorProvider`'s detail.
- The provider-definition registry (`PROVIDER_DEFINITIONS`) is explicit static data rather than dynamic discovery, preserving determinism.

## Extension Points

Any new connector should build on `BaseConnectorProvider` via `createConnectorProvider()` and supply its own `simulateRecords`/configuration, rather than modifying this base package. Adding a new provider is done by adding an entry to `PROVIDER_DEFINITIONS` in `src/providers/registry.ts`, not by subclassing the base classes.

## Related Engines

- [SDK](./sdk.md)
- [Integration Contracts](./integration-contracts.md)
