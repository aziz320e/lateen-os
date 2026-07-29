---
title: AI Provider Hub Engine
title_ar: محرك مركز مزوّدي الذكاء الاصطناعي
version: 1.0.0
status: active
package: "@lateen-os/ai-provider-hub"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - ai-runtime
  - ai-security-engine
  - sdk
  - ai-brain
---

# العربية

## مركز مزوّدي الذكاء الاصطناعي (AI Provider Hub)

### 1. الغرض

`ai-provider-hub` هو التجريد القانوني الوحيد لكل مزوّدي نماذج اللغة الكبيرة في Lateen OS (حزمة أساس من الحقبة الأولى، طبقة "عزل مزوّدي نماذج اللغة" في الخطة الرئيسية). التعليق الرسمي أعلى الحزمة ينص صراحةً: يجب أن يستهلك `ai-brain` هذا المركز، ويجب ألا تستدعي التطبيقات أي مزوّد مباشرة. من الناحية العملية، هذا القيد يتحقق عبر السلسلة الفعلية `ai-brain → ai-runtime → ai-provider-hub` (انظر القسم 10).

### 2. المسؤوليات

- سجل المزوّدين وكتالوجهم وفحص صحتهم (`ProviderRegistry`، `PROVIDER_CATALOG`، `ProviderHealth`).
- سجل النماذج وكتالوجها (`ModelRegistry`، `MODEL_CATALOG`).
- محدد المزوّد واستراتيجيات التوجيه (`ProviderSelector`: أرخص، أسرع، أعلى جودة، يدوي، موزون).
- مزوّد تضمين حقيقي متوافق مع OpenAI (`createOpenAiCompatibleEmbeddingProvider`).
- مزوّد محادثة/بث حقيقي متوافق مع OpenAI (`createOpenAiCompatibleChatProvider`).
- منافذ الرؤية/الكلام/الصورة (`VisionProvider`/`SpeechProvider`/`ImageProvider`) — عقود فقط.
- استدعاء الأدوات ومخرجات مُهيكلة (عقود).
- سلاسل احتياطية (`FallbackPolicy`)، تخزين مؤقت داخل الذاكرة، تيليمتري متوافق مع OpenTelemetry، حاسبة تكلفة، منفذ سياسة.
- طبقة استعلام (`ProviderQueries`).

### 3. خارج نطاق المسؤولية

- لا تُنفَّذ منافذ الرؤية/الكلام/الصورة داخل هذه الحزمة — عقود فقط، "bring-your-own"، خارج نطاق هذا التمرير صراحةً حسب `ARCHITECTURE.md` الخاص بها.
- لا تُعدَّل `ai-brain` أو `ai-runtime` أو `sdk` (قيد مذكور صراحةً في `ARCHITECTURE.md`).
- لا تخزين دائم — التخزين المؤقت داخل الذاكرة فقط.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو **`createAiProviderHub(config: CreateAiProviderHubConfig)`** في `hub.impl.ts`، ويُعيد `AiProviderHub: { capabilities: ProviderHubCapabilities, version }`. بخلاف معظم حزم المنصة، **المعامِلات هنا إلزامية وليست `deps = {}`** — يجب على المستدعي تزويد تطبيقات حقيقية لـ `chat`/`embedding`/`vision`/`speech`/`image` (لا يوجد افتراضي منطقي لمزوّد LLM داخل الذاكرة)؛ `chat`/`embedding` لديهما مصانع تطبيق حقيقية جاهزة، بينما البقية "bring-your-own".

**تناقض حقيقي موثَّق**: يذكر كل من `docs/certification/ARCHITECTURE_AUDIT.md` و`RUNTIME_AUDIT.md` (الجدول F1) اسم جذر التركيب كـ`createProviderHub()` — وهذا غير مطابق للمصدر الفعلي؛ الدالة المُصدَّرة فعليًا هي `createAiProviderHub`.

### 5. الاستعلامات العامة

`ProviderQueries`: `listProviders`، `listModels`، `estimateCost`، `selectProvider`، `getHealth` (5 طرق).

### 6. الأحداث المكتوبة النوع

تُعرِّف `events/provider-events.ts` مفردات أحداث مكتوبة النوع (`PROVIDER_EVENT_NAMES`, `ProviderHubEvent`) — لكن **خلافًا لكل حزمة أخرى في هذا النطاق، لا يوجد `create*EventBus()` ولا حقل `events` على `ProviderHubCapabilities`** — أي لا يوجد ناقل أحداث فعلي مُشغَّل. هذا متوافق مع جدول المحركات في `08_PROJECT_STATUS.md` الذي يُدرِج عمود "الأحداث" لهذه الحزمة كـ "—".
ملاحظة دقة إضافية: من بين 7 أسماء أحداث في `PROVIDER_EVENT_NAMES` (بما فيها `provider.request.failed` و`provider.policy.violated`)، لا يوجد سوى 5 واجهات فعلية في اتحاد `ProviderHubEvent` (`ProviderSelected`، `ProviderFailed`، `ProviderFallback`، `RequestCompleted`، `BudgetExceeded`) — اسمان مُعرَّفان بلا نوع حدث مطابق.

### 7. الاعتماديات

من `package.json`: `shared-kernel` فقط ضمن `@lateen-os/*` (زائد اعتماديات خارجية حقيقية: `@opentelemetry/api`، `zod`) — اعتمادية واحدة.

### 8. الحزم المعتمِدة

ضمن `packages/*`: `ai-runtime`، `ai-security-engine`، `sdk`. (كذلك `services/knowledge-platform` و`services/search-platform` خارج نطاق `packages/*`.)

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` — وهذا صحيح بنيويًا وليس نقصًا: الحزمة أساسية/ورقية بلا اعتماديات أشقاء حقيقية (`INTEGRATION_AUDIT.md` F2).

### 10. ملاحظات معمارية

- انحراف تسمية موثَّق (F1 في `ARCHITECTURE_AUDIT.md`) — انظر القسم 4.
- رغم أن تعليق التوثيق يذكر "AI Brain MUST consume this hub"، فإن `ai-brain/package.json` **لا يعتمد مباشرة على** `@lateen-os/ai-provider-hub`؛ المسار الفعلي هو عبر `ai-runtime` (الذي يعتمد عليه `ai-brain` مباشرة، ويعتمد بدوره على `ai-provider-hub`). هذا وصف دقيق للتدفق المعماري المقصود، وليس اعتمادية مباشرة في `package.json`.
- بروتوكولات المحادثة/التضمين لديها محوّلات HTTP حقيقية متوافقة مع OpenAI؛ الرؤية/الكلام/الصورة عقود فقط.

### 11. قرارات التصميم

- حاسبة التكلفة (`calculateTokenCost`/`defaultCostCalculator`) دالة نقية حتمية.
- مخططات Zod حقيقية للتحقق من طلبات المحادثة/التضمين/استدعاء الأدوات/المخرجات المُهيكلة.
- سمات تيليمتري متوافقة مع OpenTelemetry (`lateen.provider.id`، `lateen.tokens.*`، `lateen.cost.usd`، `lateen.latency.ms`).

### 12. نقاط التوسعة

أي مزوّد جديد يُطبَّق كـ `StreamingChatProvider`/`EmbeddingProvider`/`VisionProvider`/`SpeechProvider`/`ImageProvider` ويُمرَّر إلى `config` عند استدعاء `createAiProviderHub` — دون تعديل هذه الحزمة أبدًا.

### 13. المحركات ذات الصلة

[ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [sdk](./sdk.md) · [ai-brain](./ai-brain.md)

---

# English

## AI Provider Hub

### 1. Purpose

`ai-provider-hub` is the platform's sole canonical LLM-provider abstraction (a foundation Era-1 package, the "LLM provider isolation" layer in the Master Plan). Its own top-level doc comment states explicitly: `ai-brain` MUST consume this hub, and applications MUST NEVER call providers directly. In practice, this constraint is enforced through the real chain `ai-brain → ai-runtime → ai-provider-hub` (see Section 10).

### 2. Responsibilities

- Provider registry, catalog, and health checking (`ProviderRegistry`, `PROVIDER_CATALOG`, `ProviderHealth`).
- Model registry and catalog (`ModelRegistry`, `MODEL_CATALOG`).
- Provider selector and routing strategies (`ProviderSelector`: cheapest, fastest, highest-quality, manual, weighted).
- A real OpenAI-compatible embedding provider (`createOpenAiCompatibleEmbeddingProvider`).
- A real OpenAI-compatible chat/streaming provider (`createOpenAiCompatibleChatProvider`).
- Vision/speech/image ports (`VisionProvider`/`SpeechProvider`/`ImageProvider`) — contracts only.
- Tool-calling and structured-output contracts.
- Fallback chains (`FallbackPolicy`), an in-memory cache, OpenTelemetry-compatible telemetry, a cost calculator, a policy enforcer.
- A query layer (`ProviderQueries`).

### 3. Non-responsibilities

- Vision/speech/image ports are not implemented in this package — contracts only, "bring-your-own," explicitly out of scope for this pass per its own `ARCHITECTURE.md`.
- Never modifies `ai-brain`, `ai-runtime`, or `sdk` (an explicit constraint stated in `ARCHITECTURE.md`).
- No durable persistence — only an in-memory cache.

### 4. Public Runtime

The real composition root is **`createAiProviderHub(config: CreateAiProviderHubConfig)`** in `hub.impl.ts`, returning `AiProviderHub: { capabilities: ProviderHubCapabilities, version }`. Unlike most platform packages, **the argument here is mandatory, not `deps = {}`** — the caller must supply real `chat`/`embedding`/`vision`/`speech`/`image` implementations (there is no sensible in-memory default for an LLM provider); `chat`/`embedding` have ready-made real adapter factories, while the rest remain bring-your-own.

**A real, documented inconsistency**: both `docs/certification/ARCHITECTURE_AUDIT.md` and `RUNTIME_AUDIT.md` (their F1 table) name the composition root `createProviderHub()` — this does not match the actual source; the real exported function is `createAiProviderHub`.

### 5. Public Queries

`ProviderQueries`: `listProviders`, `listModels`, `estimateCost`, `selectProvider`, `getHealth` (5 methods).

### 6. Typed Events

`events/provider-events.ts` declares a typed event vocabulary (`PROVIDER_EVENT_NAMES`, `ProviderHubEvent`) — but **unlike every other package in this scope, there is no `create*EventBus()` and no `events` field on `ProviderHubCapabilities`** — i.e., no live event bus is actually constructed. This matches `08_PROJECT_STATUS.md`'s Engine Matrix, which lists this package's Events column as "—".
An additional accuracy note: of the 7 event names in `PROVIDER_EVENT_NAMES` (including `provider.request.failed` and `provider.policy.violated`), only 5 actual interfaces exist in the `ProviderHubEvent` union (`ProviderSelected`, `ProviderFailed`, `ProviderFallback`, `RequestCompleted`, `BudgetExceeded`) — two names are declared without a matching event type.

### 7. Dependencies

From `package.json`: `shared-kernel` only among `@lateen-os/*` (plus real external dependencies: `@opentelemetry/api`, `zod`) — one dependency.

### 8. Dependents

Within `packages/*`: `ai-runtime`, `ai-security-engine`, `sdk`. (Also `services/knowledge-platform` and `services/search-platform`, outside `packages/*` scope.)

### 9. Integration Points

No `relationship-management/` folder — this is structurally correct, not a gap: the package is foundational/leaf with no real sibling dependency (`INTEGRATION_AUDIT.md` F2).

### 10. Architecture Notes

- A documented naming deviation (F1 in `ARCHITECTURE_AUDIT.md`) — see Section 4.
- Although the doc comment states "AI Brain MUST consume this hub," `ai-brain/package.json` does **not** directly depend on `@lateen-os/ai-provider-hub`; the real path is through `ai-runtime` (which `ai-brain` depends on directly, and which itself depends on `ai-provider-hub`). This accurately describes the intended architectural flow, not a direct `package.json` dependency.
- Chat/embedding have real OpenAI-compatible HTTP adapters; vision/speech/image remain contracts only.

### 11. Design Decisions

- The cost calculator (`calculateTokenCost`/`defaultCostCalculator`) is a pure, deterministic function.
- Real Zod schemas validate chat/embedding/tool-calling/structured-output requests.
- OpenTelemetry-compatible span attributes (`lateen.provider.id`, `lateen.tokens.*`, `lateen.cost.usd`, `lateen.latency.ms`).

### 12. Extension Points

Any new provider is implemented as a `StreamingChatProvider`/`EmbeddingProvider`/`VisionProvider`/`SpeechProvider`/`ImageProvider` and passed into `config` when calling `createAiProviderHub` — never by modifying this package.

### 13. Related Engines

[ai-runtime](./ai-runtime.md) · [ai-security-engine](./ai-security-engine.md) · [sdk](./sdk.md) · [ai-brain](./ai-brain.md)
