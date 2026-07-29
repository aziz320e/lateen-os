---
title: Composition Roots
title_ar: جذور التركيب
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/RUNTIME_AUDIT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - RUNTIME_MODEL.md
  - PACKAGE_CATALOG.md
related_engines:
  - all
related_commits:
  - "35"
---

# العربية

## جذور التركيب

### 1. نمط `createXRuntime(deps = {})`

جذر التركيب هو الملف الوحيد المخوَّل داخل أي حزمة بـ:

- إنشاء كل مستودع (Repository).
- ربط كل خدمة/محرك داخلي مع اعتمادياته (المستودعات، ناقل الأحداث، `now()`، وأي شرائح متعاون سيبلينج مُحقنة لطبقة العلاقات).
- تجميع سطح المنصة العام النهائي وإرجاعه.

لا شيء فوق جذر التركيب (حزمة مستهلكة، اختبار، تطبيق) مسموح له بإنشاء مستودع مباشرة، أو الوصول إلى داخليات محرك واحد لتسليمها لمحرك آخر خارج تركيب جذر التركيب نفسه. مثال حقيقي كامل موثّق في `packages/finance-engine/src/runtime.ts`: يُنشئ 20 مستودعًا في-الذاكرة، يربطها بـ9 محركات فرعية (`financialOrganization`, `chartOfAccounts`, `generalLedger`, `accountsReceivable`, `accountsPayable`, `treasury`, `budgets`, `tax`, `reports`)، ثم يبني `relationships` و`queries` و`events` فوقها، ويُرجع `FinanceRuntime` واحدًا متماسكًا.

### 2. ما يُسمح لجذر التركيب فعله (ولا يُسمح بغيره)

| مسموح | غير مسموح |
| --- | --- |
| إنشاء مستودعات عبر `createXRepository(seed?)` | تصدير مستودع في سطح الـ Runtime العام |
| ربط الخدمات ببعضها عبر الحقن اليدوي | السماح لخدمة بإنشاء مستودعها الخاص خارج `runtime.ts` |
| حقن متعاون سيبلينج اختياري (`Pick<SiblingRuntime, '...'>`) عبر `deps` | استيراد سيبلينج بالكامل أو استيراد `repository.ts` الخاص به |
| توفير `now: () => string` قابل للحقن مع افتراضي حقيقي | الاعتماد على `Date.now()`/`new Date()` مباشرة داخل منطق الأعمال |
| إرجاع كائن واحد متماسك (`XRuntime`) | إرجاع عدة كائنات منفصلة غير مجمّعة لنفس الحزمة |

كل اعتمادية اختيارية تتدهور إلى قيمة افتراضية موثّقة (`null` لبحث كيان واحد، `[]` لقائمة) عند عدم حقنها — وهذا ما يجعل كل حزمة قابلة للاختبار بالكامل دون اتصال شبكي، بلا أي مكتبة محاكاة.

### 3. تغطية جذر التركيب الحقيقية (39/39، محقّقة مباشرة عبر `grep` على كل `runtime.ts`)

| الفئة | العدد | الحزم |
| --- | --- | --- |
| يطابق `createXRuntime()` تمامًا | 24 | جميع حزم العصر الثاني (`finance-engine` … `marketplace`) + محركات العصر الأول الناضجة: `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `domain-graph`, `institutional-memory`, `business-dna`, `ai-workforce`, `workflow-engine`, `multi-agent`, `observability-engine`, `analytics-engine`, `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine` |
| موجود لكن بتسمية/موقع مختلف | 4 | `ai-brain` (`createBrain()` / `createBrainSystem()` — انظر ملاحظة أدناه)، `ai-provider-hub` (`createAiProviderHub()` — انظر ملاحظة التصحيح أدناه)، `ceo-engine` (`createCEOEngine()`)، `extension-system` (`createExtensionSystem()`) |
| انحراف موثّق ومُصرَّح به — بلا كائن Runtime موحّد | 3 | `ai-runtime`, `decision-engine`, `intelligence-engine` (وفق `08_PROJECT_STATUS.md` §21 و`03_CONSTITUTION.md` §3 القاعدة 5.1) |
| بلا جذر تركيب — بنيويًا صحيح، لا شيء ليُركَّب | 2 | `capability-engine`, `kernel` |
| حالة خاصة — ليست حزمة Runtime | 3 | `sdk` (SDK عميل، لا خدمة)، `shared-kernel` (مكتبة أوليات)، `typescript-config` (تكوين tsconfig فقط) |
| عقد فقط، بلا حالة تشغيلية | 2 | `connector-base`, `integration-contracts` |
| جناح اختبار، ليست حزمة Runtime | 1 | `integration-tests` |
| **الإجمالي** | **39** | |

**ملاحظة تحقّق (سبق مسبق التوثيق)**: قراءة `packages/ai-provider-hub/src/index.ts` و`hub.impl.ts` مباشرة تُظهر أن الدالة المُصدَّرة فعليًا هي `createAiProviderHub()`، وليس `createProviderHub()` كما ورد نصًا في `RUNTIME_AUDIT.md`/`ARCHITECTURE_AUDIT.md`/`KNOWN_TECHNICAL_DEBT.md` — انظر §4 أدناه.

### 4. تناقض حقيقي وُجد أثناء التحقق (يُبلَّغ عنه، لا يُصحَّح هنا)

تقارير الشهادة الثلاثة (`ARCHITECTURE_AUDIT.md` F1، `RUNTIME_AUDIT.md` جدول التغطية، `KNOWN_TECHNICAL_DEBT.md` البند 5) تذكر جميعها اسم جذر تركيب `ai-provider-hub` كـ **`createProviderHub()`**. الفحص المباشر لـ`packages/ai-provider-hub/src/hub.impl.ts:48` و`index.ts:37` يُظهر أن الاسم الحقيقي المُصدَّر هو **`createAiProviderHub()`**. هذا خطأ اسمي في تقارير الشهادة نفسها، لا في الكود المصدري — الكود صحيح ومتّسق داخليًا؛ فقط توثيق الشهادة يحمل الاسم الخطأ. هذا المستند يسجّل الاسم الصحيح المُتحقَّق منه (`createAiProviderHub`) دون تعديل أي كود أو تقرير شهادة قائم، تماشيًا مع تعليمات هذه المهمة.

كذلك، `ceo-engine`'s الدالة الحقيقية هي `createCEOEngine()` (بأحرف كبيرة CEO) حسب `packages/ceo-engine/src/ceo.ts:36` — تقارير الشهادة تكتبها `createCeoEngine()`؛ فرق حالة أحرف بسيط، مُسجَّل هنا للدقة.

بالنسبة لـ`ai-brain`: الملف `brain.impl.ts` يُصدّر كلا الدالتين `createBrain()` (الواجهة الأساسية لمعالجة الجلسة) و`createBrainSystem()` (المُجمِّع الكامل الذي يُعيد `{ brain, queries }` معًا) — التسمية في `ARCHITECTURE_AUDIT.md` (`createBrain()`) صحيحة جزئيًا؛ جذر التركيب الأشمل فعليًا هو `createBrainSystem()`.

---

# English

## Composition Roots

### 1. The `createXRuntime(deps = {})` Pattern

The composition root is the one file inside a package authorized to:

- Construct every repository.
- Wire every internal service/engine with its dependencies (repositories, the event bus, `now()`, and any injected sibling-package slices for the Relationship Layer).
- Assemble the final public runtime surface and return it.

Nothing above the composition root (a consuming package, a test, an application) is allowed to construct a repository directly, or reach into one engine's internals to hand it to another engine outside the composition root's own wiring. A full real example is documented in `packages/finance-engine/src/runtime.ts`: it constructs 20 in-memory repositories, wires them into 9 sub-engines (`financialOrganization`, `chartOfAccounts`, `generalLedger`, `accountsReceivable`, `accountsPayable`, `treasury`, `budgets`, `tax`, `reports`), then builds `relationships`, `queries`, and `events` on top, returning one coherent `FinanceRuntime`.

### 2. What a Composition Root May Do (and May Not)

| Allowed | Not Allowed |
| --- | --- |
| Construct repositories via `createXRepository(seed?)` | Export a repository on the public Runtime surface |
| Wire services together via manual injection | Let a service construct its own repository outside `runtime.ts` |
| Inject an optional sibling collaborator (`Pick<SiblingRuntime, '...'>`) via `deps` | Import a sibling's whole runtime, or its `repository.ts` |
| Provide an injectable `now: () => string` with a real default | Call `Date.now()`/`new Date()` directly inside business logic |
| Return one coherent object (`XRuntime`) | Return several separate, unaggregated objects for the same package |

Every optional dependency degrades to a documented default (`null` for a single-entity lookup, `[]` for a list) when not injected — this is what makes every package fully testable offline, with zero mocking libraries.

### 3. Real Composition-Root Coverage (39/39, verified directly by grepping every `runtime.ts`)

| Category | Count | Packages |
| --- | --- | --- |
| Conforms to `createXRuntime()` exactly | 24 | All Era-2 packages (`finance-engine` … `marketplace`) + mature Era-1 engines: `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `domain-graph`, `institutional-memory`, `business-dna`, `ai-workforce`, `workflow-engine`, `multi-agent`, `observability-engine`, `analytics-engine`, `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine` |
| Present, differently named/located | 4 | `ai-brain` (`createBrain()` / `createBrainSystem()` — see note below), `ai-provider-hub` (`createAiProviderHub()` — see correction note below), `ceo-engine` (`createCEOEngine()`), `extension-system` (`createExtensionSystem()`) |
| Documented, sanctioned deviation — no unified runtime object | 3 | `ai-runtime`, `decision-engine`, `intelligence-engine` (per `08_PROJECT_STATUS.md` §21 / `03_CONSTITUTION.md` §3 Rule 5.1) |
| No composition root — structurally correct, nothing to compose | 2 | `capability-engine`, `kernel` |
| Special case — not a runtime package | 3 | `sdk` (a client SDK, not a service), `shared-kernel` (primitives library), `typescript-config` (tsconfig only) |
| Contract-only, no runtime state | 2 | `connector-base`, `integration-contracts` |
| Test harness, not a runtime package | 1 | `integration-tests` |
| **Total** | **39** | |

**Verification note (predates this document)**: reading `packages/ai-provider-hub/src/index.ts` and `hub.impl.ts` directly shows the actually-exported factory is `createAiProviderHub()`, not `createProviderHub()` as literally stated in `RUNTIME_AUDIT.md`/`ARCHITECTURE_AUDIT.md`/`KNOWN_TECHNICAL_DEBT.md` — see §4 below.

### 4. A Real Inconsistency Found During Verification (Reported, Not Fixed Here)

All three certification reports (`ARCHITECTURE_AUDIT.md` F1, `RUNTIME_AUDIT.md`'s coverage table, `KNOWN_TECHNICAL_DEBT.md` item 5) name `ai-provider-hub`'s composition root as **`createProviderHub()`**. Direct inspection of `packages/ai-provider-hub/src/hub.impl.ts:48` and `index.ts:37` shows the real exported name is **`createAiProviderHub()`**. This is a naming error in the certification reports themselves, not in the source code — the code is correct and internally consistent; only the certification prose carries the wrong name. This document records the verified correct name (`createAiProviderHub`) without modifying any source code or existing certification report, per this task's instructions.

Similarly, `ceo-engine`'s real factory is `createCEOEngine()` (capitalized "CEO") per `packages/ceo-engine/src/ceo.ts:36` — the certification reports write it as `createCeoEngine()`; a minor casing difference, recorded here for accuracy.

For `ai-brain`: `brain.impl.ts` exports both `createBrain()` (the core session-processing facade) and `createBrainSystem()` (the fuller aggregator that returns `{ brain, queries }` together) — `ARCHITECTURE_AUDIT.md`'s naming (`createBrain()`) is partially accurate; the more complete composition root is actually `createBrainSystem()`.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)
- [../certification/ARCHITECTURE_AUDIT.md](../certification/ARCHITECTURE_AUDIT.md)
- [RUNTIME_MODEL.md](./RUNTIME_MODEL.md)
- [PACKAGE_CATALOG.md](./PACKAGE_CATALOG.md)

## Related Engines

All 39 `packages/*` engines; `finance-engine` as the worked example.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
