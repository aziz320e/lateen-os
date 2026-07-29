---
title: Kernel Engine
title_ar: النواة
version: 1.0.0
status: active
package: "@lateen-os/kernel"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - extension-system
---

# العربية

## النواة — Kernel

### 1. الغرض

`@lateen-os/kernel` هو **طبقة تشغيل المنصة** لـ Lateen OS: يقوم بالإقلاع (Bootstrap)، والتهيئة، ومراقبة الصحة، وتحميل الإضافات (Plugins)، والإيقاف الآمن لمنصة Lateen على جهاز مطوّر أو بيئة تشغيل واحدة. هذه حزمة دعم منصّي من الجيل الأول تسبق اصطلاح `runtime.ts`/`createXRuntime()`، وهي **لا تنفذ منطق أعمال** ولا تحل محل Kubernetes — Kubernetes (Epic 18) يتولى نشر عناقيد الإنتاج، بينما تتولى النواة دورة حياة المنصة محليًا.

### 2. المسؤوليات

- تسلسل الإقلاع: تحديد جذر مساحة العمل → تحميل تهيئة النواة (Zod) → تسجيل Pino + OpenTelemetry → التحقق من متغيرات البيئة → بناء رسم بياني الاعتماديات وترتيب الإقلاع → تحميل الإضافات المفعّلة → إصدار `kernel.bootstrapped`.
- سجل الخدمات الخلفية (منافذ، حزم، مسارات صحة، حواف اعتمادية)، سجل التطبيقات (واجهات Next.js)، وسجل الإضافات (Plugins: تطبيقات، خدمات، عمال ذكاء اصطناعي، موصلات، تدفقات عمل، مهام).
- دورة الحياة: بدء البنية التحتية (`docker compose up -d`)، بدء الخدمات بترتيب الاعتماديات، إيقاف رشيق (SIGTERM)، واستعادة من الأعطال.
- فحوصات صحة: جاهزية (Liveness عبر `/health`)، استعداد (Readiness عبر استجابة الواجهة)، واعتمادية (مُجمّع OpenTelemetry، مراقبة NATS).
- تشخيصات (`lateen doctor`): متغيرات بيئة مفقودة/غير صالحة، تعارض/انشغال منافذ، دورة اعتماديات، مسار إضافة مفقود، بيانات اعتماد قاعدة بيانات نائبة.
- واجهة سطر أوامر كاملة (`lateen start/stop/restart/status/doctor/logs/backup/restore/update/version/recover/plugins/services/apps/config`).
- ناقل أحداث مطبوع النوع لدورة حياة المنصة (`kernel.bootstrapping`، `kernel.bootstrapped`، `kernel.starting`، إلخ).

### 3. خارج نطاق المسؤولية

- لا منطق نطاق أعمال (Business Domain).
- لا استدلال بنماذج لغة كبيرة.
- لا تحل محل Kubernetes أو Helm.
- لا ترحيل قواعد بيانات ولا ORM.

### 4. وقت التشغيل العام

**لا يوجد جذر تركيب (`createXRuntime()` أو ما يعادله) في هذه الحزمة** — وهذا سليم معماريًا، وليس نقصًا (موثّق في `ARCHITECTURE_AUDIT.md` F2 و`RUNTIME_AUDIT.md`). النواة تُصدّر بدائيات منخفضة المستوى (Bootstrap، Registry، Lifecycle، Health، Diagnostics، إلخ) تُستهلك عبر واجهة سطر الأوامر وليس كخدمة ذات حالة وتعاونيات تحتاج إلى تركيب. أقرب دالة تشغيل هي **`bootstrapPlatform(options?)`** التي تُرجع `BootstrapResult` (تهيئة، مسجّل أحداث، ترتيب إقلاع، إضافات محمّلة، بيئة) لا كائن تشغيل دائم بخدمات مُجمّعة.

### 5. الاستعلامات العامة

لا يوجد مجلد `queries/` — ليس لدى النواة حالة نطاق قابلة للاستعلام (لا كيانات أعمال، فقط سجلات تكوين ثابتة مثل `PLATFORM_MANIFEST`). هذا استثناء بنيوي مشروع، وليس فجوة.

### 6. الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`KernelEventBus`) يصدر: `kernel.bootstrapping`، `kernel.bootstrapped`، `kernel.starting`، `kernel.started`، `kernel.stopping`، `kernel.shutdown`، `kernel.health.checked`، `kernel.diagnostics.completed`، `kernel.recovery.started`، `kernel.recovery.completed`، `kernel.plugin.loaded`.

### 7. الاعتماديات

الاعتمادية الوحيدة من نوع `@lateen-os/*` هي `@lateen-os/extension-system` (تُستخدم لإدارة الإضافات). بقية الاعتماديات خارجية: `commander`، `zod`، `pino`، وحزم `@opentelemetry/*`.

### 8. الحزم المعتمِدة

لم يُعثر على أي حزمة أخرى في `packages/*` تعتمد على `@lateen-os/kernel`.

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/`. التكامل الوحيد مع حزمة شقيقة هو الاعتماد أعلاه على `@lateen-os/extension-system` — النواة تستدعي `createExtensionSystem()` لتشغيل اكتشاف/تسجيل الإضافات ضمن تسلسل الإقلاع وسجل الإضافات الخاص بها.

### 10. ملاحظات معمارية

`PLATFORM_MANIFEST` (`src/registry/manifest.ts`) هو سجل تصريحي شامل بكل البنية التحتية (postgres، redis، nats، minio، qdrant، prometheus، grafana، otel-collector)، والخدمات الخلفية (11 خدمة بمنافذ واعتماديات صريحة)، والتطبيقات (13 تطبيق Next.js) — يُستخدم لبناء رسم بياني الاعتماديات وترتيب الإقلاع، وليس آلية اكتشاف ديناميكية.

### 11. قرارات التصميم

- الإضافات (Plugins) هي **مراجع مسارات فقط** — النواة تتحقق من وجود المسار ولا تُحمّل كود أعمال ديناميكيًا.
- حالة العمليات تُحفظ في `.lateen/processes.json` لدعم الاستعادة من الأعطال.
- كل تشخيص (`doctor`) له رمز خطأ ثابت (`MISSING_ENV`، `PORT_CONFLICT`، `DEPENDENCY_CYCLE`، إلخ) لتمكين أتمتة قابلة للاختبار.

### 12. نقاط التوسعة

أي حزمة أو خدمة مستقبلية تريد أن تُدار عبر النواة يجب أن تُضاف كصف جديد في `PLATFORM_MANIFEST` (بدون تعديل منطق النواة نفسه) وأن تعرّض مسار صحة (`/health`) متوافقًا مع نموذج فحص النواة — لا يجوز لأي حزمة الوصول إلى حالة النواة الداخلية خارج واجهة `bootstrapPlatform()`/CLI العامة.

### 13. المحركات ذات الصلة

- [extension-system](./extension-system.md)

---

# English

## Kernel Engine

### 1. Purpose

`@lateen-os/kernel` is Lateen OS's **platform operating layer**: it bootstraps, configures, health-monitors, plugin-loads, and gracefully shuts down the Lateen platform on a developer machine or single-host runtime environment. This is an Era-1 platform-support package that predates the `runtime.ts`/`createXRuntime()` convention, and it contains **no business logic** and does not replace Kubernetes — Kubernetes (Epic 18) handles production-cluster deployment, while the Kernel handles local platform lifecycle.

### 2. Responsibilities

- Bootstrap sequence: resolve workspace root → load Kernel config (Zod) → initialize Pino + OpenTelemetry → validate environment variables → build the dependency graph and startup order → load enabled plugins → emit `kernel.bootstrapped`.
- A service registry (ports, packages, health paths, dependency edges), an application registry (Next.js frontends), and a plugin registry (applications, services, AI workers, connectors, workflows, missions).
- Lifecycle: start infrastructure (`docker compose up -d`), start services in dependency order, graceful shutdown (SIGTERM), and crash recovery.
- Health probes: liveness (`/health`), readiness (frontend response), and dependency (OTel collector, NATS monitoring).
- Diagnostics (`lateen doctor`): missing/invalid env vars, port conflicts/in-use, dependency cycles, missing plugin paths, placeholder database credentials.
- A full CLI (`lateen start/stop/restart/status/doctor/logs/backup/restore/update/version/recover/plugins/services/apps/config`).
- A typed event bus for platform lifecycle (`kernel.bootstrapping`, `kernel.bootstrapped`, `kernel.starting`, etc.).

### 3. Non-responsibilities

- No business domain logic.
- No LLM/AI inference.
- Does not replace Kubernetes or Helm.
- No database migrations or ORM.

### 4. Public Runtime

**This package has no composition root (`createXRuntime()` or equivalent)** — and this is architecturally correct, not a gap (documented in `ARCHITECTURE_AUDIT.md` F2 and `RUNTIME_AUDIT.md`). The Kernel exports low-level primitives (Bootstrap, Registry, Lifecycle, Health, Diagnostics, etc.) consumed through the CLI rather than as a stateful service with collaborators that need composing. The closest thing to a runtime entry point is **`bootstrapPlatform(options?)`**, which returns a `BootstrapResult` (config, logger, event bus, startup order, loaded plugins, environment) rather than a long-lived runtime object of aggregated services.

### 5. Public Queries

There is no `queries/` folder — the Kernel has no queryable domain state of its own (no business entities, only static configuration records like `PLATFORM_MANIFEST`). This is a legitimate structural exemption, not a gap.

### 6. Typed Events

A real event bus (`KernelEventBus`) emits: `kernel.bootstrapping`, `kernel.bootstrapped`, `kernel.starting`, `kernel.started`, `kernel.stopping`, `kernel.shutdown`, `kernel.health.checked`, `kernel.diagnostics.completed`, `kernel.recovery.started`, `kernel.recovery.completed`, `kernel.plugin.loaded`.

### 7. Dependencies

The only `@lateen-os/*` dependency is `@lateen-os/extension-system` (used to manage extensions). The remaining dependencies are external: `commander`, `zod`, `pino`, and the `@opentelemetry/*` packages.

### 8. Dependents

No other package under `packages/*` was found declaring a dependency on `@lateen-os/kernel`.

### 9. Integration Points

There is no `relationship-management/` folder. The one sibling integration is the dependency above on `@lateen-os/extension-system` — the Kernel calls `createExtensionSystem()` to run extension discovery/registration as part of its own bootstrap sequence and plugin registry.

### 10. Architecture Notes

`PLATFORM_MANIFEST` (`src/registry/manifest.ts`) is a comprehensive declarative registry of all infrastructure (postgres, redis, nats, minio, qdrant, prometheus, grafana, otel-collector), backend services (11 services with explicit ports and dependencies), and applications (13 Next.js apps) — used to build the dependency graph and startup order, not a dynamic discovery mechanism.

### 11. Design Decisions

- Plugins are treated as **path references only** — the Kernel verifies a path exists and never dynamically loads business code.
- Process state is persisted to `.lateen/processes.json` to support crash recovery.
- Every diagnostic (`doctor`) check has a stable error code (`MISSING_ENV`, `PORT_CONFLICT`, `DEPENDENCY_CYCLE`, etc.) to enable testable automation.

### 12. Extension Points

Any future package or service that wants to be managed by the Kernel should be added as a new row in `PLATFORM_MANIFEST` (without modifying the Kernel's own logic) and expose a `/health` path compatible with the Kernel's health-check model — no package may reach into the Kernel's internal state outside the public `bootstrapPlatform()`/CLI surface.

### 13. Related Engines

- [extension-system](./extension-system.md)
