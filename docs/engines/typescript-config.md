---
title: TypeScript Config
title_ar: إعدادات TypeScript المشتركة
version: 1.0.0
status: active
package: "@lateen-os/typescript-config"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages: []
---

# العربية

## الغرض

`@lateen-os/typescript-config` هي حزمة `tsconfig.json` مشتركة بحتة — **ليست محركًا** (Engine) ولا حزمة تشغيل، بل حزمة أدوات بناء (build-tooling package). توفر إعدادات TypeScript موحدة تُستخدم عبر المنصة بأكملها لضمان اتساق خيارات المُصرِّف (compiler options) بين كل الحزم الـ38 الأخرى.

## المسؤوليات

- `base.json`: إعدادات أساسية مشتركة — `target: ES2022`، `module`/`moduleResolution: NodeNext`، `strict: true`، `noUncheckedIndexedAccess: true`، `noImplicitOverride: true`، `declaration`/`declarationMap`/`sourceMap: true`، `isolatedModules: true`.
- `node.json`: يمتد من `base.json` لحزم Node.js القابلة للبناء (`noEmit: false`، `outDir: dist`).
- `react.json`: يمتد من `base.json` لتطبيقات React (`jsx: react-jsx`، `lib: DOM`، `module: ESNext`، `moduleResolution: Bundler`).
- `tsconfig.json`: نقطة دخول مرجعية للحزمة نفسها.

## خارج نطاق المسؤولية

- **لا يوجد أي كود تشغيل (runtime source) في هذه الحزمة** — فقط ملفات JSON لإعدادات المُصرِّف.
- **لا سكربتات `build`/`test`/`lint`/`typecheck`** في `package.json` — لا يوجد شيء لبنائه أو اختباره؛ هذه الحزمة تُستهلَك فقط عبر `extends` في `tsconfig.json` لحزم أخرى.
- **لا `README.md`/`ARCHITECTURE.md`/`*_MODEL.md`** — هذا استثناء بنيوي مشروع وموثّق في `docs/certification/ARCHITECTURE_AUDIT.md` (النتيجة F5) و`KNOWN_TECHNICAL_DEBT.md` (البند 7)، وليس فجوة توثيقية حقيقية: لا يوجد نموذج تشغيل (runtime model) لتوثيقه في المقام الأول.
- لا منطق أعمال، لا استعلامات، لا أحداث، لا طبقة علاقات — لا شيء من هذه المفاهيم ينطبق على حزمة إعدادات بناء بحتة.

## وقت التشغيل العام

**لا يوجد** — لا يوجد `runtime.ts` ولا أي جذر تركيب من أي نوع، ولا يمكن أن يوجد: هذه الحزمة لا تحتوي على كود TypeScript قابل للتنفيذ على الإطلاق، فقط ملفات تكوين JSON ثابتة تُستهلك عبر حقل `extends` في ملفات `tsconfig.json` الخاصة بالحزم الأخرى.

## الاستعلامات العامة

**لا ينطبق** — لا توجد حالة نطاق من أي نوع لتُستعلَم عنها.

## الأحداث المكتوبة النوع

**لا ينطبق** — لا يوجد ناقل أحداث، ولا يمكن أن يوجد لحزمة إعدادات JSON ثابتة.

## الاعتماديات

حسب `package.json`: **لا توجد أي اعتماديات** — لا `dependencies`، ولا `devDependencies`، ولا اعتماد على `@lateen-os/shared-kernel` حتى.

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json` (باستثناء إشارة `name` الخاصة بها في ملفها هي)، تعتمد عليها جميع الحزم الـ38 الأخرى في المنصة، كاعتمادية تطوير (`devDependency`) موحّدة لإعدادات المُصرِّف.

## نقاط التكامل

لا يوجد مجلد `relationship-management/` ولا أي تكامل حقيقي — هذا صحيح معماريًا: التكامل الوحيد هو استهلاك ثابت (`extends`) لملفات JSON عبر `tsconfig.json` الخاصة بكل حزمة أخرى، وليس تكاملًا سلوكيًا على مستوى وقت التشغيل.

## ملاحظات معمارية

- حزمة أدوات بناء بحتة (build-tooling package)، وليست محركًا (Engine) — يجب ألا تُقاس بنفس معايير حزم الأعمال (Era 2).
- غياب `README.md`/`ARCHITECTURE.md`/`*_MODEL.md` استثناء بنيوي مشروع، مؤكَّد ومسجَّل في تقارير الشهادة (`docs/certification/ARCHITECTURE_AUDIT.md`، `KNOWN_TECHNICAL_DEBT.md`) — لا يجوز اختلاق محتوى لهذه الملفات لعدم وجود نموذج تشغيل حقيقي ليُوثَّق.
- غياب سكربتات `lint`/`test`/`typecheck`/`build` صحيح أيضًا: لا يوجد كود قابل للبناء أو الاختبار في هذه الحزمة.

## قرارات التصميم

- فصل واضح بين إعدادات Node (`node.json`) وReact (`react.json`)، كلاهما يمتد من قاعدة مشتركة واحدة (`base.json`) لتجنب ازدواجية الإعدادات عبر المنصة.
- `strict: true` و`noUncheckedIndexedAccess: true` مفروضان على مستوى القاعدة المشتركة، مما يضمن أعلى مستوى من الأمان النوعي (type safety) لكل حزمة تستهلك هذه الإعدادات.

## نقاط التوسعة

أي حزمة جديدة تحتاج إعداد TypeScript مختلفًا (مثلًا لبيئة تشغيل جديدة) يجب أن تُضيف ملف تكوين جديدًا هنا (مثل `<env>.json`) يمتد من `base.json`، عبر التزام (commit) مخصص لهذه الحزمة نفسها — لا يجوز أبدًا تكرار الإعدادات الأساسية محليًا داخل حزمة أخرى.

## المحركات ذات الصلة

لا توجد حزم شقيقة ذات صلة حقيقية — هذه حزمة أدوات بناء يستهلكها الجميع أحاديًا، وليست محركًا يتكامل مع محركات أخرى.

---

# English

## Purpose

`@lateen-os/typescript-config` is a pure shared `tsconfig.json` package — **not an Engine**, and not a runtime package at all, but a build-tooling package. It provides unified TypeScript settings used across the entire platform to keep compiler options consistent across all 38 other packages.

## Responsibilities

- `base.json`: the shared base configuration — `target: ES2022`, `module`/`moduleResolution: NodeNext`, `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`, `declaration`/`declarationMap`/`sourceMap: true`, `isolatedModules: true`.
- `node.json`: extends `base.json` for buildable Node.js packages (`noEmit: false`, `outDir: dist`).
- `react.json`: extends `base.json` for React applications (`jsx: react-jsx`, `lib: DOM`, `module: ESNext`, `moduleResolution: Bundler`).
- `tsconfig.json`: a reference entry point for the package itself.

## Non-responsibilities

- **No runtime source code exists in this package** — only JSON compiler-configuration files.
- **No `build`/`test`/`lint`/`typecheck` scripts** in `package.json` — there is nothing to build or test; this package is consumed only via `extends` in other packages' `tsconfig.json` files.
- **No `README.md`/`ARCHITECTURE.md`/`*_MODEL.md`** — a legitimate structural exemption, documented in `docs/certification/ARCHITECTURE_AUDIT.md` (finding F5) and `KNOWN_TECHNICAL_DEBT.md` (item 7), not real documentation debt: there is no runtime model to document in the first place.
- No business logic, no queries, no events, no relationship layer — none of these concepts apply to a pure build-configuration package.

## Public Runtime

**None** — there is no `runtime.ts` and no composition root of any kind, and there cannot be one: this package contains no executable TypeScript code at all, only static JSON configuration files consumed through the `extends` field in other packages' `tsconfig.json` files.

## Public Queries

**Not applicable** — there is no domain state of any kind to query.

## Typed Events

**Not applicable** — there is no event bus, and there cannot be one for a static JSON configuration package.

## Dependencies

Per `package.json`: **no dependencies at all** — no `dependencies`, no `devDependencies`, not even a dependency on `@lateen-os/shared-kernel`.

## Dependents

Verified by grepping every `package.json` (excluding its own self-referential `name` field match): all 38 other packages on the platform depend on it, as a unified `devDependency` for compiler configuration.

## Integration Points

There is no `relationship-management/` folder and no real integration — architecturally correct: the only "integration" is the static consumption (`extends`) of its JSON files through every other package's `tsconfig.json`, not a runtime-level behavioral integration.

## Architecture Notes

- A pure build-tooling package, not an Engine — it should not be measured against the same standards as business engines (Era 2).
- The absence of `README.md`/`ARCHITECTURE.md`/`*_MODEL.md` is a legitimate structural exemption, confirmed and recorded in the certification reports (`docs/certification/ARCHITECTURE_AUDIT.md`, `KNOWN_TECHNICAL_DEBT.md`) — fabricating content for these files would be inappropriate since there is no real runtime model to document.
- The absence of `lint`/`test`/`typecheck`/`build` scripts is also correct: there is no buildable or testable code in this package.

## Design Decisions

- A clear separation between Node (`node.json`) and React (`react.json`) configurations, both extending one shared base (`base.json`) to avoid duplicating settings across the platform.
- `strict: true` and `noUncheckedIndexedAccess: true` are enforced at the shared base level, guaranteeing the highest level of type safety for every package that consumes these settings.

## Extension Points

Any new package needing a different TypeScript setup (e.g. for a new runtime environment) should add a new configuration file here (e.g. `<env>.json`) extending `base.json`, through a dedicated commit scoped to this package — the base settings must never be duplicated locally inside another package.

## Related Engines

No genuinely related sibling packages exist — this is a build-tooling package everyone consumes one-way, not an engine that integrates with other engines.
