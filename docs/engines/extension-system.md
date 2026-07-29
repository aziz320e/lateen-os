---
title: Extension System Engine
title_ar: نظام الإضافات
version: 1.0.0
status: active
package: "@lateen-os/extension-system"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - kernel
  - sdk
  - shared-kernel
---

# العربية

## نظام الإضافات — Extension System

### 1. الغرض

`@lateen-os/extension-system` هو النظام الرسمي لاكتشاف، والتحقق من، وتحميل، وإصدار، وإدارة إضافات الطرف الثالث في Lateen OS، بحيث يستطيع المطورون الخارجيون توسيع المنصة دون تعديل الكود الأساسي. هذه حزمة دعم منصّي من الجيل الأول (Era 1) تسبق اصطلاح `relationship-management/` + `queries/` + `runtime.ts` المستخدم في حزم الجيل الثاني، وهي **لا تحتوي على منطق أعمال** — الاكتشاف والتحقق والتحميل والإدارة فقط، بينما تُدار الإضافات فعليًا (تسجيل، فحوصات صحة) من طرف الـ Kernel (`@lateen-os/kernel`).

### 2. المسؤوليات

- تحليل `extension.json` (المخطط عبر Zod) والتحقق من صحته.
- اكتشاف الإضافات عبر `extensions/*`، `packages/*`، `apps/*`، `services/*`، وذاكرة التخزين المؤقت للسوق (`.lateen/marketplace/*`).
- سجل تركيبات (Registry) بحالات: `pending` / `enabled` / `disabled` / `failed`.
- حل الاعتماديات عبر semver (تعارضات، دورات، اعتماديات مفقودة).
- تحميل/إلغاء تحميل/إعادة تحميل حي (Hot Reload) في وضع التطوير.
- نموذج الأذونات (19 إذنًا معرّفًا، مثل `filesystem:read`، `network:outbound`، `ai-runtime:invoke`) وفرضها عبر Sandbox (حد ذاكرة، حد وقت تنفيذ، حد طلبات شبكة، مضيفون مسموح بهم).
- دورة حياة كاملة عبر خطافات (`onInstall` / `onLoad` / `onStart` / `onStop` / `onUpdate` / `onRemove`).
- ناقل أحداث مطبوع النوع خاص بالإضافات.
- تكامل مع سجل الإضافات في الـ Kernel (`KernelIntegration`).
- واجهة سطر أوامر (`lateen extensions ...`) عبر Commander.

### 3. خارج نطاق المسؤولية

- لا تنفيذ لمنطق الأعمال داخل الإضافات نفسها.
- لا استدلال بنماذج لغة كبيرة.
- لا تعديل لأي كود مصدر في المنصة.
- لا تحل محل Kubernetes أو أي منسق حاويات.

### 4. وقت التشغيل العام

جذر التركيب الفعلي هو الصنف `ExtensionSystem` عبر الدالة **`createExtensionSystem(workspaceRoot)`** (وليس `createExtensionRuntime()` — هذا انحراف تسمية موثّق، انظر القسم 10). يُرجع كائن `ExtensionSystem` يجمّع: `config`، `logger`، `registry`، `discovery`، `validator`، `events`، `hooks`، `loader`، `installer`، `queries`، `dependencies`، `paths`، و`kernel` (تكامل الـ Kernel). كما يوفر توابع تشغيلية مباشرة مثل `discoverAndRegister()`.

### 5. الاستعلامات العامة

طبقة استعلام حقيقية `ExtensionQueries` (`src/queries/extension-queries.ts`): `listExtensions()`، `findExtension()`، `validateExtension()`، `checkCompatibility()` — تُبنى فوق السجل والاكتشاف والتحقق نفسها، دون طبقة `paginate`/`scoreLabel` المشتركة المستخدمة في حزم الجيل الثاني (هذه الحزمة تسبق ذلك الاصطلاح).

### 6. الأحداث المكتوبة النوع

خمسة أحداث حقيقية في `ExtensionEventName`: `extension.installed`، `extension.removed`، `extension.loaded`، `extension.failed`، `permission.denied` — كل منها يُنشر فعليًا عبر `ExtensionEventBus` المبني على بدائية `shared-kernel`.

### 7. الاعتماديات

يعلن `package.json` عن `@lateen-os/sdk` و`@lateen-os/shared-kernel` كاعتماديتين — لكن تدقيق `DEPENDENCY_AUDIT.md` (النتيجة F2) وجد صفر استيرادات فعلية لأي منهما داخل `src/`. هذا اعتماد معلن غير مستخدم فعليًا، موثّق كدين تقني معروف (`KNOWN_TECHNICAL_DEBT.md`)، وليس خطأ يجب إصلاحه هنا.

### 8. الحزم المعتمِدة

`@lateen-os/kernel` يعلن اعتمادية حقيقية على `@lateen-os/extension-system` (الـ Kernel يستدعي `createExtensionSystem()` لإدارة الإضافات). كما يعتمد عليه `@lateen-os/connector-base`، وخارج نطاق `packages/*`: `apps/marketplace`، `services/marketplace`، و`extensions/printing-industry`.

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` (هذه الحزمة تسبق الاصطلاح). التكامل الوحيد مع حزمة شقيقة داخل `packages/*` هو مع الـ Kernel عبر `src/kernel/integration.ts` — الصنف `KernelIntegration` الذي يسجّل الإضافات المفعّلة في سجل الإضافات الخاص بالـ Kernel (`KernelPluginRegistryPort.register()`) ويربط أحداث دورة الحياة (`wireLifecycleEvents()`) — عبر منفذ (port) مُعرّف محليًا، لا عبر استيراد مباشر لنوع تشغيل الـ Kernel.

### 10. ملاحظات معمارية

جذر التركيب مُسمّى `createExtensionSystem()` وليس `createExtensionRuntime()` — هذا انحراف تسمية موثّق وحقيقي (`ARCHITECTURE_AUDIT.md` F1)، غير مُصلح عمدًا لأن إعادة تسمية دالة تصدير عامة تُعد تغييرًا كاسرًا لأي مستهلك حالي. الحزمة تتبع بنية modules مختلفة عن اصطلاح الجيل الثاني (`manifest`، `registry`، `loader`، `resolver`، `validator`، `permissions`، `sandbox`، `hooks`، إلخ) بدلاً من `subdomain/{types,repository,repository.impl,engine.impl}`.

### 11. قرارات التصميم

- الإضافات هي **مراجع مسارات** فقط — الـ Kernel يتحقق من وجود المسارات ولا يُحمّل كودًا تجاريًا ديناميكيًا بنفسه.
- التحقق من التوافق (`checkCompatibility`) والامتثال لإصدار الـ SDK (`isSdkCompatible`) يعتمدان على semver الحتمي، لا استدلال.
- كل الأذونات تُفرض في وقت التحميل والتشغيل عبر Sandbox محدد الحدود (ذاكرة، وقت، طلبات شبكة، مضيفون).

### 12. نقاط التوسعة

أي حزمة مستقبلية تريد التكامل مع نظام الإضافات يجب أن تستهلك `createExtensionSystem()` العام فقط (أو تسجّل أوامر CLI عبر `registerExtensionCommands`/`registerMarketplaceCommands`/`registerProvisioningCommands`/`registerGatewayCommands` المُصدّرة) — لا يجوز لها الوصول إلى `registry`/`discovery` الداخليين مباشرة خارج الكائن المُرجَع، ولا تعديل هذه الحزمة لاستيعاب حاجة حزمة أخرى.

### 13. المحركات ذات الصلة

- [kernel](./kernel.md)
- [integration-contracts](./integration-contracts.md)

---

# English

## Extension System Engine

### 1. Purpose

`@lateen-os/extension-system` is Lateen OS's official system for discovering, validating, loading, versioning, and managing third-party extensions, so external developers can extend the platform without modifying core code. This is an Era-1 platform-support package that predates the `relationship-management/` + `queries/` + `runtime.ts` convention used by Era-2 packages, and it contains **no business logic** — discovery, validation, loading, and management only. Extensions themselves are actually administered (registration, health checks) by the Kernel (`@lateen-os/kernel`).

### 2. Responsibilities

- Parse and validate `extension.json` (Zod schema).
- Discover extensions across `extensions/*`, `packages/*`, `apps/*`, `services/*`, and the marketplace cache (`.lateen/marketplace/*`).
- Maintain an installation registry with `pending` / `enabled` / `disabled` / `failed` statuses.
- Resolve dependencies via semver (conflicts, cycles, missing dependencies).
- Load / unload / hot-reload extensions in development.
- Enforce a permission model (19 defined permissions, e.g. `filesystem:read`, `network:outbound`, `ai-runtime:invoke`) through a Sandbox (memory limit, execution-time limit, network-request limit, allowed hosts).
- Drive a full lifecycle through hooks (`onInstall` / `onLoad` / `onStart` / `onStop` / `onUpdate` / `onRemove`).
- Expose a typed extension event bus.
- Integrate with the Kernel's own plugin registry (`KernelIntegration`).
- Provide a CLI (`lateen extensions ...`) via Commander.

### 3. Non-responsibilities

- No execution of business logic inside extensions themselves.
- No LLM/AI inference.
- No modification of any platform source code.
- Does not replace Kubernetes or any container orchestrator.

### 4. Public Runtime

The real composition root is the `ExtensionSystem` class via **`createExtensionSystem(workspaceRoot)`** (not `createExtensionRuntime()` — a documented naming deviation, see §10). It returns an `ExtensionSystem` object aggregating: `config`, `logger`, `registry`, `discovery`, `validator`, `events`, `hooks`, `loader`, `installer`, `queries`, `dependencies`, `paths`, and `kernel` (Kernel integration). It also exposes direct operational methods such as `discoverAndRegister()`.

### 5. Public Queries

A real `ExtensionQueries` query layer (`src/queries/extension-queries.ts`): `listExtensions()`, `findExtension()`, `validateExtension()`, `checkCompatibility()` — built directly over the registry, discovery, and validator services, without the shared `paginate`/`scoreLabel` helper pattern used by Era-2 packages (this package predates that convention).

### 6. Typed Events

Five real events in `ExtensionEventName`: `extension.installed`, `extension.removed`, `extension.loaded`, `extension.failed`, `permission.denied` — each genuinely published through the `ExtensionEventBus`, built on `shared-kernel`'s primitive.

### 7. Dependencies

`package.json` declares `@lateen-os/sdk` and `@lateen-os/shared-kernel` as dependencies — but `DEPENDENCY_AUDIT.md` (finding F2) found zero actual imports of either inside `src/`. This is a real, unused declared dependency, tracked as known technical debt (`KNOWN_TECHNICAL_DEBT.md`), not something fixed as part of this documentation.

### 8. Dependents

`@lateen-os/kernel` declares a real dependency on `@lateen-os/extension-system` (the Kernel calls `createExtensionSystem()` to manage extensions). `@lateen-os/connector-base` also depends on it. Outside `packages/*`: `apps/marketplace`, `services/marketplace`, and `extensions/printing-industry`.

### 9. Integration Points

There is no `relationship-management/` folder (this package predates the convention). Its one sibling integration inside `packages/*` is with the Kernel via `src/kernel/integration.ts` — the `KernelIntegration` class, which registers enabled extensions into the Kernel's own plugin registry (`KernelPluginRegistryPort.register()`) and wires lifecycle events (`wireLifecycleEvents()`) through a locally-defined port, not a direct import of the Kernel's runtime type.

### 10. Architecture Notes

The composition root is named `createExtensionSystem()`, not `createExtensionRuntime()` — a real, documented naming deviation (`ARCHITECTURE_AUDIT.md` F1), deliberately not fixed because renaming a public exported factory would be a breaking change for any existing consumer. The package's module layout (`manifest`, `registry`, `loader`, `resolver`, `validator`, `permissions`, `sandbox`, `hooks`, etc.) differs from the Era-2 `subdomain/{types,repository,repository.impl,engine.impl}` convention.

### 11. Design Decisions

- Extensions are treated as **path references** only — the Kernel verifies paths exist and never dynamically loads business code itself.
- Compatibility checking (`checkCompatibility`) and SDK-version compliance (`isSdkCompatible`) rely on deterministic semver comparison, not inference.
- Every permission is enforced at load and run time through a bounded Sandbox (memory, time, network requests, hosts).

### 12. Extension Points

Any future package that wants to integrate with the Extension System must consume the public `createExtensionSystem()` (or register CLI commands via the exported `registerExtensionCommands`/`registerMarketplaceCommands`/`registerProvisioningCommands`/`registerGatewayCommands`) — it must never reach into internal `registry`/`discovery` state outside the returned object, and must never modify this package to accommodate its own needs.

### 13. Related Engines

- [kernel](./kernel.md)
- [integration-contracts](./integration-contracts.md)
