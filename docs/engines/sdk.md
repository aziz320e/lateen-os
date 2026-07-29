---
title: SDK
title_ar: حزمة تطوير البرمجيات (SDK)
version: 1.0.0
status: active
package: "@lateen-os/sdk"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../handbook/03_CONSTITUTION.md
related_packages:
  - ai-provider-hub
  - decision-engine
  - intelligence-engine
  - ai-runtime
  - ai-brain
  - ceo-engine
---

# العربية

## الغرض

`@lateen-os/sdk` هو نقطة تركيب المنصة (Platform-level composition point) لنظام Lateen OS — يخدم غرضين منفصلين:

1. **جذر تركيب وقت التشغيل**: `createLateen()` يُركّب `ai-provider-hub` و`decision-engine` و`intelligence-engine` و`ai-runtime` و`ai-brain` و`ceo-engine` في نظام واحد يعمل (`LateenSystem`) — نقطة الدخول العامة الرسمية إلى المنصة الحية.
2. **`LateenSDK`**: أداة تأليف امتدادات مستقلة سابقة الوجود (`definePlugin`، `defineWorker`، `defineWorkflow`، `defineConnector`، وأداة سطر أوامر) تُغلّف عقود المنصة في تجربة مطوّر مُتحقق منها؛ لا تحتوي على أي منطق أعمال ولا صلة لها بـ `createLateen()`.

كما هو موثّق في `docs/handbook/03_CONSTITUTION.md` §6 و`docs/AI_PROJECT_CONTEXT.md`، هذه الحزمة **تُجمّع** محركات أخرى دون أن تحتوي على منطق أعمال خاص بها.

## المسؤوليات

- تركيب `LateenSystem` كاملًا عبر `createLateen()`: `providerHub`، `decisionEngine`، `intelligenceEngine`، `runtime`، `brain`، `ceo`، و`client` (سطح أضيق للقراءة فقط، آمن لتسليمه لمستهلك أقل ثقة مثل طبقة واجهة مستخدم).
- حقن التبعيات بين الواجهات المُركَّبة: مزوّد الدردشة إلى Runtime؛ سجل الوكلاء واستعلامات القرار إلى Brain.
- تدهور آمن للمزوّدين غير المُهيّئين: أي قدرة (`chat`/`embedding`/`vision`/`speech`/`image`) لم تُزوَّد تُصبح كائنًا وهميًا يطلق `ProviderNotConfiguredError` فقط عند استدعائها فعليًا.
- `LateenSDK` (`core/sdk.ts`): أداة تأليف تحتوي وحدات `application`، `service`، `plugin`، `worker`، `workflow`، `mission`، `connector`، `commands`، `events`، `configuration`، `validation`، `templates`، و`testing`، بالإضافة إلى أداة سطر أوامر (`lateen-sdk`).

## خارج نطاق المسؤولية

- **لا تحتوي على منطق أعمال خاص بها** — تُركّب فقط محركات أخرى وتُصدّرها بسطح عام مُنسَّق وصغير.
- **لا تملك طبقة `queries/` أو `events/` خاصة بها فوق كيانات مملوكة لها** — لأنها طبقة تركيب/تجميع (composition/aggregation layer)، وليست محرك نطاق (domain engine) له حالة قابلة للاستعلام. المجلد `events/` الموجود فعليًا في `src/` هو ناقل أحداث عام لمؤلفي الامتدادات (`SdkEventBus`، `defineEvent`، `publish`، `subscribe`) — وليس خريطة أحداث نطاق مكتوبة النوع فوق مجاميع خاصة بهذه الحزمة، لأن هذه الحزمة لا تملك مثل هذه المجاميع.
- لا تُنشئ أي مستودع (Repository) خاص بها — كل مستودع يُبنى داخل جذر تركيب الحزمة الفرعية التي تملكه فعليًا.

## وقت التشغيل العام

جذر التركيب هو `createLateen(config: LateenConfig = {})` في `src/system/create-lateen.ts`، ويُعيد `LateenSystem` يحتوي: `providerHub`، `decisionEngine`، `intelligenceEngine`، `runtime`، `brain`، `ceo`، و`client: LateenClient` (سطح أضيق: `ceo.getMission`/`listMissions`، `brain.queries`، `runtime.queries`، `decisions`، `intelligence`، `providers` — بدون تعديل مهمة، بدون وصول للمُستدل/المخطط/المنسّق/المحادثة).

## الاستعلامات العامة

**لا توجد** طبقة `queries/` خاصة بهذه الحزمة فوق كيانات مملوكة لها — وهذا صحيح معماريًا وليس نقصًا: `sdk` حزمة تركيب/تجميع (aggregation layer) لا تملك حالة نطاق خاصة بها لتستعلم عنها؛ كل استعلام مُعرَّض عبر `LateenSystem`/`LateenClient` هو استعلام حقيقي للحزمة الفرعية المُركَّبة نفسها (`decisionEngine.queries`، `intelligenceEngine.queries`، إلخ)، معاد تصديره فقط.

## الأحداث المكتوبة النوع

**لا توجد** خريطة أحداث نطاق (Domain EventMap) خاصة بهذه الحزمة فوق كيانات مملوكة لها، لنفس السبب أعلاه. مجلد `events/` الموجود يُصدّر أداة عامة عامة الغرض لمؤلفي الامتدادات (`SdkEventBus`، `defineEvent`، `publish`، `subscribe`) لا ترتبط بمجاميع نطاق خاصة بـ `sdk`.

## الاعتماديات

حسب `package.json`: `@lateen-os/ai-brain`، `@lateen-os/ai-provider-hub`، `@lateen-os/ai-runtime`، `@lateen-os/ai-workforce`، `@lateen-os/business-dna`، `@lateen-os/ceo-engine`، `@lateen-os/decision-engine`، `@lateen-os/intelligence-engine`، `@lateen-os/multi-agent`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`. **ملاحظة ديون تقنية معروفة** (موثقة في `docs/certification/DEPENDENCY_AUDIT.md` F2 و`KNOWN_TECHNICAL_DEBT.md` البند 6): خمس من هذه الاعتماديات المُعلَنة — `@lateen-os/ai-workforce`، `@lateen-os/business-dna`، `@lateen-os/multi-agent`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine` — لها صفر استيراد فعلي في `src/` حسب البحث المُتحقق منه في هذه الجولة التوثيقية أيضًا؛ فعليًا تُستخدم فقط `ai-brain`، `ai-provider-hub`، `ai-runtime`، `ceo-engine`، `decision-engine`، `intelligence-engine` (الست المُركَّبة داخل `createLateen()`). هذا دين تقني منخفض الأولوية معروف مسبقًا، ولا يُصلح ضمن هذه المهمة التوثيقية.

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`: `@lateen-os/connector-base`، `@lateen-os/extension-system`، `@lateen-os/integration-tests`.

## نقاط التكامل

لا يوجد مجلد `relationship-management/` في هذه الحزمة — وهذا صحيح معماريًا: `sdk` مُجمِّع من جانب العميل (client-side aggregator) لسطوح عامة لحزم شقيقة من أجل مستهلكين خارجيين، وليس تركيبًا من نظير إلى نظير (peer-to-peer) بحاجة لطبقة علاقات مركزية. التكامل الفعلي الوحيد هو التركيب المباشر داخل `system/create-lateen.ts`:

- **AI Provider Hub** — `createAiProviderHub()` مُستخدَمة كما هي (واجهة نظيفة مسبقًا). (تصحيح: الاسم الحقيقي `createAiProviderHub()`، وليس `createProviderHub()` كما ورد في تقارير الشهادة — انظر `docs/architecture/COMPOSITION_ROOTS.md`.)
- **Decision Engine** — `createDecisionEngineFacade()` تُغلّف `createReasoner` الحقيقية + `createDecisionQueries`.
- **Intelligence Engine** — `createIntelligenceEngineFacade()` تُغلّف `createScorer`/`createRanker`/`createForecaster`/`createRecommender` الحقيقية + `createIntelligenceQueries`.
- **AI Runtime** — `createRuntimeFacade()` تُغلّف سجل الوكلاء وطابور المهام وتشغيل المحادثة والمنسّق + `createRuntimeQueries` (سطح مُختار، وليس إعادة تصدير شاملة).
- **AI Brain** — `createBrainFacade()` تُغلّف `createBrainSystem` الحقيقية، بحقن سجل الوكلاء واستعلامات القرار من الواجهات أعلاه.
- **CEO Engine** — `createCEO()` تُغلّف `createCEOEngine` الحقيقية كما هي.

## ملاحظات معمارية

- `sdk` **لا يحتوي على منطق أعمال خاص به** — هذا مبدأ صريح موثّق في `docs/handbook/03_CONSTITUTION.md` §6؛ الحزمة تُركّب محركات أخرى فقط.
- لا طبقة `queries/` ولا `events/` خاصة بها فوق كيانات مملوكة — صحيح معماريًا لأنها طبقة تركيب/تجميع، وليست محرك نطاق.
- خمس اعتماديات مُعلَنة غير مُستخدمة (`ai-workforce`، `business-dna`، `multi-agent`، `shared-kernel`، `workflow-engine`) — دين تقني معروف منخفض الأولوية موثّق في `KNOWN_TECHNICAL_DEBT.md`، وليس شيئًا يُصلح هنا.
- **ملاحظة عدم اتساق حقيقية بين `README.md` والمصدر الفعلي**: يذكر `README.md` الحالي أن `LateenSDK` (أداة تأليف الامتدادات) "تُغلّف عقودًا من `shared-kernel`، `business-dna`، `workflow-engine`، `multi-agent`، `ai-workforce`، `ai-runtime`، `ai-brain`" — لكن بحثًا فعليًا في `src/` لم يُعثر على أي استيراد فعلي من `shared-kernel`، `business-dna`، `workflow-engine`، أو `multi-agent` (فقط `ai-runtime` و`ai-brain` مُستوردان فعليًا، وذلك حصرًا داخل `system/`، وليس داخل وحدات `LateenSDK` نفسها). هذا عدم اتساق حقيقي بين التوثيق والمصدر — تم الإبلاغ عنه فقط، ولم يُصلح ضمن هذه المهمة.
- لا اعتماد دائري: كان `ceo-engine` يُعلن سابقًا اعتمادية غير مُستخدمة على `sdk`؛ بما أن `sdk` يعتمد الآن على `ceo-engine`، أُزيلت تلك الاعتمادية القديمة تجنبًا للدورية (انظر `docs/adr/0003-no-cyclic-dependencies.md`).

## قرارات التصميم

- كل مستودع يُبنى داخل جذر تركيب الحزمة الفرعية التي تملكه — أبدًا داخل `sdk` نفسها، وأبدًا معروض على `LateenSystem`.
- `LateenClient` سطح أضيق ومتعمَّد للقراءة فقط، منفصل عن `LateenSystem` الكامل، لتسليمه لمستهلك أقل ثقة.
- تدهور آمن: أي قدرة مزوّد لم تُهيَّأ تُصبح كائنًا وهميًا يطلق خطأً فقط عند الاستدعاء الفعلي — لا حاجة لمزوّد حي أثناء التركيب أو الاختبار.

## نقاط التوسعة

أي حزمة مستقبلية تريد الانضمام إلى `LateenSystem` يجب أن تُضاف كواجهة تجميع (facade) جديدة داخل `system/` عبر التزام (commit) مخصص، بعد أن تُصبح تلك الحزمة الشقيقة نفسها جاهزة بجذر تركيب عام حقيقي — لا يجوز أبدًا تعديل الحزمة الشقيقة لتلائم `sdk`، والتكامل يمر حصرًا عبر جذر تركيبها العام.

## المحركات ذات الصلة

- [AI Provider Hub](./ai-provider-hub.md)
- [Decision Engine](./decision-engine.md)
- [Intelligence Engine](./intelligence-engine.md)
- [AI Runtime](./ai-runtime.md)
- [AI Brain](./ai-brain.md)
- [CEO Engine](./ceo-engine.md)

---

# English

## Purpose

`@lateen-os/sdk` is the platform-level composition point for Lateen OS — serving two distinct purposes:

1. **The runtime composition root**: `createLateen()` assembles `ai-provider-hub`, `decision-engine`, `intelligence-engine`, `ai-runtime`, `ai-brain`, and `ceo-engine` into one working system (`LateenSystem`) — the official public entry point into the running platform.
2. **`LateenSDK`**: a separate, pre-existing extension-authoring toolkit (`definePlugin`, `defineWorker`, `defineWorkflow`, `defineConnector`, and a CLI) that wraps platform contracts into a validated developer experience; it contains no business logic and is unrelated to `createLateen()`.

As documented in `docs/handbook/03_CONSTITUTION.md` §6 and `docs/AI_PROJECT_CONTEXT.md`, this package **assembles** other engines together without containing business logic of its own.

## Responsibilities

- Assembling the full `LateenSystem` via `createLateen()`: `providerHub`, `decisionEngine`, `intelligenceEngine`, `runtime`, `brain`, `ceo`, and `client` (a narrower, read-only surface safe to hand to a less-trusted consumer such as a UI layer).
- Wiring dependency injection between the composed facades: the chat provider into Runtime; the agent registry and decision queries into Brain.
- Safe degradation for unconfigured providers: any capability (`chat`/`embedding`/`vision`/`speech`/`image`) not supplied becomes a stub that throws `ProviderNotConfiguredError` only when actually invoked.
- `LateenSDK` (`core/sdk.ts`): an authoring toolkit with `application`, `service`, `plugin`, `worker`, `workflow`, `mission`, `connector`, `commands`, `events`, `configuration`, `validation`, `templates`, and `testing` modules, plus a CLI (`lateen-sdk`).

## Non-responsibilities

- **Contains no business logic of its own** — it only assembles other engines and re-exports them behind a small, curated public surface.
- **Has no `queries/` or `events/` layer of its own over any owned aggregates** — because it is a composition/aggregation layer, not a domain engine with queryable state. The `events/` folder that does exist in `src/` is a generic event bus for extension authors (`SdkEventBus`, `defineEvent`, `publish`, `subscribe`) — not a typed domain EventMap over aggregates this package owns, because this package owns no such aggregates.
- Never constructs any repository of its own — every repository is constructed inside the composition root of the subordinate package that actually owns it.

## Public Runtime

The composition root is `createLateen(config: LateenConfig = {})` in `src/system/create-lateen.ts`, returning a `LateenSystem` with: `providerHub`, `decisionEngine`, `intelligenceEngine`, `runtime`, `brain`, `ceo`, and `client: LateenClient` (a narrower surface: `ceo.getMission`/`listMissions`, `brain.queries`, `runtime.queries`, `decisions`, `intelligence`, `providers` — no mission mutation, no reasoner/planner/orchestrator/conversation access).

## Public Queries

There is **no** `queries/` layer of this package's own over owned aggregates — this is architecturally correct, not a gap: `sdk` is an aggregation layer with no domain state of its own to query; every query exposed via `LateenSystem`/`LateenClient` is a real query of the composed sub-package itself (`decisionEngine.queries`, `intelligenceEngine.queries`, etc.), simply re-exported.

## Typed Events

There is **no** domain EventMap of this package's own over owned aggregates, for the same reason above. The `events/` folder that exists exports a generic, purpose-agnostic tool for extension authors (`SdkEventBus`, `defineEvent`, `publish`, `subscribe`) unrelated to any domain aggregate `sdk` itself owns.

## Dependencies

Per `package.json`: `@lateen-os/ai-brain`, `@lateen-os/ai-provider-hub`, `@lateen-os/ai-runtime`, `@lateen-os/ai-workforce`, `@lateen-os/business-dna`, `@lateen-os/ceo-engine`, `@lateen-os/decision-engine`, `@lateen-os/intelligence-engine`, `@lateen-os/multi-agent`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`. **Known technical-debt note** (documented in `docs/certification/DEPENDENCY_AUDIT.md` F2 and `KNOWN_TECHNICAL_DEBT.md` item 6): five of these declared dependencies — `@lateen-os/ai-workforce`, `@lateen-os/business-dna`, `@lateen-os/multi-agent`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine` — have zero real imports in `src/` per the search re-verified during this documentation pass as well; only `ai-brain`, `ai-provider-hub`, `ai-runtime`, `ceo-engine`, `decision-engine`, `intelligence-engine` (the six actually composed inside `createLateen()`) are genuinely used. This is known, low-priority technical debt and is not fixed by this documentation task.

## Dependents

Verified by grepping every `package.json`: `@lateen-os/connector-base`, `@lateen-os/extension-system`, `@lateen-os/integration-tests`.

## Integration Points

There is no `relationship-management/` folder in this package — architecturally correct: `sdk` is a client-side aggregator of sibling public surfaces for external consumers, not a peer-to-peer service composition needing a centralized Relationship Layer. The one real integration style is the direct composition inside `system/create-lateen.ts`:

- **AI Provider Hub** — `createAiProviderHub()` is used as-is (already a clean facade). (Correction: the real name is `createAiProviderHub()`, not `createProviderHub()` as stated in the certification reports — see `docs/architecture/COMPOSITION_ROOTS.md`.)
- **Decision Engine** — `createDecisionEngineFacade()` wraps the real `createReasoner` + `createDecisionQueries`.
- **Intelligence Engine** — `createIntelligenceEngineFacade()` wraps the real `createScorer`/`createRanker`/`createForecaster`/`createRecommender` + `createIntelligenceQueries`.
- **AI Runtime** — `createRuntimeFacade()` wraps the agent registry, task queue, conversation runtime, orchestrator + `createRuntimeQueries` (a curated, not exhaustive, surface).
- **AI Brain** — `createBrainFacade()` wraps the real `createBrainSystem`, injected with the agent registry and decision queries from the facades above.
- **CEO Engine** — `createCEO()` wraps the real `createCEOEngine` as-is.

## Architecture Notes

- `sdk` **contains no business logic of its own** — an explicit principle documented in `docs/handbook/03_CONSTITUTION.md` §6; the package only assembles other engines.
- No `queries/` or `events/` layer of its own over owned aggregates — architecturally correct because it is a composition/aggregation layer, not a domain engine.
- Five declared, unused dependencies (`ai-workforce`, `business-dna`, `multi-agent`, `shared-kernel`, `workflow-engine`) — known, low-priority technical debt documented in `KNOWN_TECHNICAL_DEBT.md`, not fixed here.
- **A real documentation/source inconsistency found**: the current `README.md` states that `LateenSDK` (the extension-authoring toolkit) "wraps contracts from `shared-kernel`, `business-dna`, `workflow-engine`, `multi-agent`, `ai-workforce`, `ai-runtime`, `ai-brain`" — but a real search of `src/` found no actual import from `shared-kernel`, `business-dna`, `workflow-engine`, or `multi-agent` (only `ai-runtime` and `ai-brain` are genuinely imported, and exclusively inside `system/`, not inside `LateenSDK`'s own modules). This is a real inconsistency between the documentation and the source — reported here only, not fixed as part of this task.
- No circular dependency: `ceo-engine` used to declare an unused dependency on `sdk`; since `sdk` now depends on `ceo-engine`, that old declaration was removed to avoid a cycle (see `docs/adr/0003-no-cyclic-dependencies.md`).

## Design Decisions

- Every repository is constructed inside the composition root of the subordinate package that owns it — never inside `sdk` itself, and never exposed on `LateenSystem`.
- `LateenClient` is a deliberately narrower, read-only surface, separate from the full `LateenSystem`, meant to be handed to a less-trusted consumer.
- Safe degradation: any unconfigured provider capability becomes a stub that throws only on actual invocation — no live provider is required to compose or test.

## Extension Points

Any future package wanting to join `LateenSystem` should be added as a new facade inside `system/` through a dedicated commit, once that sibling package itself has a real public composition root — the sibling package must never be modified to suit `sdk`, and integration flows exclusively through its own public composition root.

## Related Engines

- [AI Provider Hub](./ai-provider-hub.md)
- [Decision Engine](./decision-engine.md)
- [Intelligence Engine](./intelligence-engine.md)
- [AI Runtime](./ai-runtime.md)
- [AI Brain](./ai-brain.md)
- [CEO Engine](./ceo-engine.md)
