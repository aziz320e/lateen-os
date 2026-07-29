---
title: Marketplace Engine
title_ar: محرك السوق (المنصة الإضافية)
version: 1.0.0
status: active
package: "@lateen-os/marketplace-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - api-gateway
  - admin-console
  - ai-runtime
  - workflow-engine
  - analytics-engine
  - observability-engine
  - communication-hub
  - institutional-memory
---

# العربية

## الغرض

`@lateen-os/marketplace-engine` (اسم الحزمة في npm؛ مسار المجلد لا يزال `packages/marketplace`) هو منصة الإضافات (Extension Platform) لنظام Lateen OS — آخر محرك حقيقي بُني في المعلم الثاني (Milestone 2). يملك سجل الإضافات (Extension Registry)، سجل الإضافات المساعدة (Plugin Registry)، سجل الحزم (Package Registry)، صندوق عزل الإضافات (Extension Sandbox)، إعدادات الإضافات (Extension Configuration)، أحداث الإضافات (Extension Events)، وكتالوج السوق (Marketplace Catalog). **ملاحظة تسمية مهمة**: اسم حزمة npm هو `@lateen-os/marketplace-engine`، وليس `@lateen-os/marketplace` — ذلك الاسم يخص تطبيقًا أماميًا مختلفًا تمامًا (`apps/marketplace`، واجهة توزيع الإضافات) كان يتصادم معه سابقًا؛ تم إصلاح هذا التصادم في الالتزام (Commit) رقم 35.

## المسؤوليات

- دورة حياة الإضافة الكاملة: `install` → `enabled ⇄ disabled` → `uninstall`، بالإضافة إلى `validateExtension()` التي تُركّب سجل الحزم وسجل الإضافات المساعدة وصندوق العزل معًا.
- سجل الإضافات المساعدة: القدرات، الصلاحيات المطلوبة، وفحص التوافق بمدى الإصدارات الدلالية (semantic version range) بشكل حتمي.
- سجل الحزم: الإصدارات، الاعتماديات، وتوقيع سلامة محتوى حقيقي بخوارزمية SHA-256 (عبر `node:crypto` المدمجة — بدون أي مكتبة تشفير خارجية).
- صندوق عزل الإضافات: بيانات وصفية حتمية للقدرات/الصلاحيات/مستوى العزل — **بدون أي تنفيذ فعلي للكود** في أي مكان بهذه الحزمة.
- إعدادات الإضافات: القيم الافتراضية، التجاوزات (overrides)، والتحقق الحقلي.
- أحداث الإضافات: اشتراكات/نشرات معلنة وفحص توافق مقابل كتالوج أسماء أحداث معروف — بيانات وصفية فقط، وليست اشتراكًا حيًا.
- كتالوج السوق: الفئات، الناشرون، تقييمات بمعدل متحرك حتمي، وعدادات التنزيل.
- مقارن إصدارات دلالية (semver) حقيقي وخالٍ من أي اعتمادية خارجية (`shared/semver.ts`).
- طبقة علاقات (Relationship Layer) تُكامل مع 8 حزم شقيقة مطلوبة.
- طبقة استعلامات (`MarketplaceQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- لا تنفيذ فعلي لأي كود إضافة — صندوق العزل بيانات وصفية حتمية فقط.
- لا نموذج لغة كبير ولا استدلال ذكاء اصطناعي في أي مكان بهذه الحزمة.
- لا اشتراك حي في الأحداث المُعلَنة (Extension Events) — فحص توافق وصفي فقط.
- لا تعديل لأي من الحزم الثماني الشقيقة لخدمة هذه الحزمة — التكامل يمر حصرًا عبر واجهة التشغيل العامة لكل حزمة.

## وقت التشغيل العام

جذر التركيب هو `createMarketplaceRuntime(deps: MarketplaceRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد كائن `MarketplaceRuntime` يحوي: `extensions`، `plugins`، `packages`، `sandbox`، `configuration`، `extensionEvents`، `catalog`، `relationshipManagement`، `queries`، و`events`. المستودعات السبعة تُبنى داخل `runtime.ts` فقط ولا تظهر أبدًا على السطح العام المُعاد.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`MarketplaceQueries`) تحتوي: `findExtensions`، `findPlugins`، `findPackages`، `findCatalog`، `findConfigurations`، `findCompatibility`، `searchMarketplace` — كلها للقراءة فقط وفوق مستودعات الحزمة نفسها حصرًا.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`MarketplaceEventMap`، 10 أحداث)، كل حدث منشور فعليًا من قِبل الخدمة الحقيقية التي تُسببه: `extension.installed`، `extension.uninstalled`، `extension.enabled`، `extension.disabled`، `extension.upgraded`، `plugin.registered`، `catalog.updated`، `configuration.changed`، `compatibility.checked`، `extension.validated`.

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel`، وكمتعاونين اختياريين حقيقيين في طبقة العلاقات: `@lateen-os/api-gateway`، `@lateen-os/admin-console`، `@lateen-os/ai-runtime`، `@lateen-os/workflow-engine`، `@lateen-os/analytics-engine`، `@lateen-os/observability-engine`، `@lateen-os/communication-hub`، `@lateen-os/institutional-memory`، بالإضافة إلى `@lateen-os/business-dna` كإعادة استخدام على مستوى النوع فقط.

## الحزم المعتمِدة

لا توجد أي حزمة أخرى في المنصة (بحثًا فعليًا في كل ملفات `package.json`) تعتمد على `@lateen-os/marketplace-engine` حتى الآن — وهذا متوقع، فهي أحدث محرك حقيقي بُني في المنصة (آخر محرك في المعلم الثاني).

## نقاط التكامل

مجلد `relationship-management/` حقيقي يُكامل مع 8 حزم شقيقة مطلوبة بالضبط، كل تكامل عبر واجهة تشغيل عامة واحدة محددة (`Pick<SiblingRuntime, '...'>`) فقط:

- **بوابة الـ API** — `getApiGatewayContext()` تقرأ كل واجهة API مسجّلة فعليًا عبر `queries.findApis()`.
- **لوحة الإدارة** — `getAdminOrganizationContext()` تجلب سجل منظمة حقيقي عبر `organizations.getOrganization()`.
- **وقت تشغيل الذكاء الاصطناعي** — `getAgentContext()` تجلب وكيلًا حقيقيًا عبر `RuntimeQueries.findAgent()` (مُكتوب كـ `Pick<RuntimeQueries, 'findAgent'>` لأن `ai-runtime` لا يملك جذر تركيب موحّد واحد).
- **محرك سير العمل** — `raiseExtensionApprovalWorkflow()` تُعرّف وتبدأ سير عمل موافقة إضافة حقيقيًا.
- **محرك التحليلات** — `getAnalyticsSnapshotContext()` تقرأ كل لقطة KPI حقيقية عبر `queries.findKPIs()`.
- **محرك المراقبة** — `getObservabilityHealthContext()` تقرأ كل فحص صحة حقيقي عبر `queries.findHealth()`.
- **مركز الاتصالات** — `notifyMarketplaceEvent()` تُنشئ وترسل إشعار `'escalation'` حقيقيًا.
- **الذاكرة المؤسسية** — `logMarketplaceDecisionToMemory()` تُسجّل مُدخل معرفة `'decision'` حقيقيًا عبر `lifecycle.create()`.

كل متعاون اختياري يتدهور إلى قيمة فارغة موثقة (`null`/`[]`) عند عدم حقنه، فتبقى المنصة قابلة للاستخدام والاختبار الكامل دون اتصال بأي منها.

## ملاحظات معمارية

- توقيع سلامة محتوى حقيقي بخوارزمية SHA-256 عبر `node:crypto` المدمجة في Node — بدون أي مكتبة تشفير خارجية.
- مقارن إصدارات دلالية (semver) حقيقي وخالٍ من أي اعتمادية خارجية.
- إصلاح تصادم اسم حقيقي في الالتزام رقم 35: كانت `packages/marketplace/package.json` تحمل نفس اسم `apps/marketplace` (`@lateen-os/marketplace`)، مما كسر تحليل مساحة عمل `pnpm`/`turbo` بالكامل؛ تم إصلاحه بإعادة تسمية محرك الواجهة الخلفية إلى `@lateen-os/marketplace-engine` دون تغيير مسار المجلد.
- صندوق عزل الإضافات بيانات وصفية حتمية فقط — لا تنفيذ فعلي لأي كود في أي مكان بهذه الحزمة.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية.
- كل متعاون في `relationship-management` مُكتوب كـ `Pick<SiblingRuntime, '...'>` ضيق النطاق — أبدًا النوع الكامل للتشغيل، وأبدًا مستودع.
- أسماء الأحداث تتبع اصطلاح `noun.verb` بصيغة الماضي.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات من السوق يجب أن تستهلك `createMarketplaceRuntime()` العام فقط أو أنواعه المُصدَّرة (مثل `Extension`، `Plugin`، `PackageVersion`) — لا يجوز أبدًا الوصول إلى مستودعاتها الداخلية، ولا يجوز تعديل هذه الحزمة لخدمة حزمة جديدة؛ أي حزمة جديدة تريد التكامل تنضم كمتعاون اختياري إضافي في `RelationshipManagementDeps` عبر التزام (commit) مخصص لهذه الحزمة نفسها.

## المحركات ذات الصلة

- [API Gateway](./api-gateway.md)
- [Admin Console](./admin-console.md)
- [AI Runtime](./ai-runtime.md)
- [Workflow Engine](./workflow-engine.md)
- [Analytics Engine](./analytics-engine.md)
- [Observability Engine](./observability-engine.md)
- [Communication Hub](./communication-hub.md)
- [Institutional Memory](./institutional-memory.md)

---

# English

## Purpose

`@lateen-os/marketplace-engine` (the npm package name; the directory path remains `packages/marketplace`) is the Extension Platform for Lateen OS — the final real engine built in Milestone 2. It owns the Extension Registry, the Plugin Registry, the Package Registry, the Extension Sandbox, Extension Configuration, Extension Events, and the Marketplace Catalog. **Important naming note**: the npm package name is `@lateen-os/marketplace-engine`, not `@lateen-os/marketplace` — that name belongs to an entirely different frontend (`apps/marketplace`, the extension-distribution UI) with which it used to collide; the collision was fixed in Commit 35.

## Responsibilities

- Full extension lifecycle: `install` → `enabled ⇄ disabled` → `uninstall`, plus `validateExtension()` composing the Package Registry, Plugin Registry, and Extension Sandbox together.
- Plugin Registry: capabilities, required permissions, and deterministic semantic-version-range compatibility checking.
- Package Registry: versions, dependencies, and a real content-integrity signature via SHA-256 (through Node's built-in `crypto` — no external cryptography library).
- Extension Sandbox: deterministic capability/permission/isolation-level metadata — **no code execution anywhere** in this package.
- Extension Configuration: defaults, overrides, and field-level validation.
- Extension Events: declared subscriptions/publications and compatibility checking against a known event-name catalog — metadata only, never a live subscription.
- Marketplace Catalog: categories, publishers, a deterministic running-average rating, and download counters.
- A real, dependency-free semantic-version comparator (`shared/semver.ts`).
- A Relationship Layer integrating 8 required sibling packages.
- A `MarketplaceQueries` query layer and a typed event bus.

## Non-responsibilities

- No real code execution for any extension — the sandbox is deterministic metadata only.
- No LLM/AI inference anywhere in this package.
- No live subscription to declared Extension Events — compatibility checking is metadata-only.
- No modification of any of the 8 sibling packages to accommodate this package — integration goes exclusively through each sibling's own public runtime.

## Public Runtime

The composition root is `createMarketplaceRuntime(deps: MarketplaceRuntimeDeps = {})` in `src/runtime.ts`, returning a `MarketplaceRuntime` object with: `extensions`, `plugins`, `packages`, `sandbox`, `configuration`, `extensionEvents`, `catalog`, `relationshipManagement`, `queries`, and `events`. All seven repositories are constructed only inside `runtime.ts` and never appear on the returned surface.

## Public Queries

A real `queries/` layer (`MarketplaceQueries`) exposes: `findExtensions`, `findPlugins`, `findPackages`, `findCatalog`, `findConfigurations`, `findCompatibility`, `searchMarketplace` — all read-only and composed exclusively over this package's own repositories.

## Typed Events

A real event bus (`MarketplaceEventMap`, 10 events), each genuinely published by the real service that causes it: `extension.installed`, `extension.uninstalled`, `extension.enabled`, `extension.disabled`, `extension.upgraded`, `plugin.registered`, `catalog.updated`, `configuration.changed`, `compatibility.checked`, `extension.validated`.

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel`, plus these real, optional Relationship Layer collaborators: `@lateen-os/api-gateway`, `@lateen-os/admin-console`, `@lateen-os/ai-runtime`, `@lateen-os/workflow-engine`, `@lateen-os/analytics-engine`, `@lateen-os/observability-engine`, `@lateen-os/communication-hub`, `@lateen-os/institutional-memory`, plus `@lateen-os/business-dna` as type-only reuse.

## Dependents

No other package in the platform (verified by grepping every `package.json`) depends on `@lateen-os/marketplace-engine` yet — expected, since it is the newest real engine built on the platform (the final engine of Milestone 2).

## Integration Points

A real `relationship-management/` folder integrates exactly 8 required sibling packages, each through one narrowly-typed public runtime slice (`Pick<SiblingRuntime, '...'>`):

- **API Gateway** — `getApiGatewayContext()` reads every real registered API via `queries.findApis()`.
- **Admin Console** — `getAdminOrganizationContext()` fetches a real organization record via `organizations.getOrganization()`.
- **AI Runtime** — `getAgentContext()` fetches a real agent via `RuntimeQueries.findAgent()` (typed as `Pick<RuntimeQueries, 'findAgent'>` since `ai-runtime` has no single unified composition root).
- **Workflow Engine** — `raiseExtensionApprovalWorkflow()` defines and starts a real extension-approval workflow instance.
- **Analytics Engine** — `getAnalyticsSnapshotContext()` reads every real KPI snapshot via `queries.findKPIs()`.
- **Observability Engine** — `getObservabilityHealthContext()` reads every real health check via `queries.findHealth()`.
- **Communication Hub** — `notifyMarketplaceEvent()` creates and sends a real `'escalation'` notification.
- **Institutional Memory** — `logMarketplaceDecisionToMemory()` logs a real `'decision'` knowledge entry via `lifecycle.create()`.

Every optional collaborator degrades to a documented no-op (`null`/`[]`) when not injected, so the Marketplace stays fully usable — and fully tested — completely offline without any of them.

## Architecture Notes

- A real content-integrity signature via SHA-256, through Node's built-in `crypto` — no external cryptography library.
- A real, dependency-free semantic-version comparator.
- A real name-collision fix landed in Commit 35: `packages/marketplace/package.json` previously shared the name `@lateen-os/marketplace` with `apps/marketplace`, breaking `pnpm`/`turbo` workspace resolution outright; fixed by renaming the backend engine's identity to `@lateen-os/marketplace-engine` without moving its directory.
- The Extension Sandbox is deterministic metadata only — no code execution anywhere in this package.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to a deterministic `nowIso`.
- Every `relationship-management` collaborator is typed as a narrow `Pick<SiblingRuntime, '...'>` slice — never the sibling's whole runtime type, never a repository.
- Event names follow the `noun.verb` past-tense convention.

## Extension Points

Any future package needing marketplace data should consume only the public `createMarketplaceRuntime()` (or its exported types, such as `Extension`, `Plugin`, `PackageVersion`) — it must never reach into this package's internal repositories, and this package must never be modified to accommodate a new consumer; a new sibling integration is added as an additional optional collaborator in `RelationshipManagementDeps` through a dedicated commit scoped to this package.

## Related Engines

- [API Gateway](./api-gateway.md)
- [Admin Console](./admin-console.md)
- [AI Runtime](./ai-runtime.md)
- [Workflow Engine](./workflow-engine.md)
- [Analytics Engine](./analytics-engine.md)
- [Observability Engine](./observability-engine.md)
- [Communication Hub](./communication-hub.md)
- [Institutional Memory](./institutional-memory.md)
