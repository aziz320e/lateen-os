---
title: Intelligence Engine
title_ar: محرك الذكاء
version: 1.0.0
status: active
package: "@lateen-os/intelligence-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - business-dna
  - capability-engine
  - decision-engine
  - domain-graph
  - institutional-memory
---

# العربية

## محرك الذكاء — Intelligence Engine

### 1. الغرض

`@lateen-os/intelligence-engine` هو طبقة **الاستدلال والتوصية** الرسمية لـ Lateen OS: يكتشف الفرص، يحلّل الأسواق، يكتشف الاتجاهات، يتنبأ بالطلب، ويولّد توصيات — دون تنفيذ أي قرار ودون أي منطق ذكاء اصطناعي/نموذج لغوي داخله. **هذه الحزمة، إلى جانب `ai-runtime` و`decision-engine`، انحراف موثّق ومُصرّح به رسميًا** عن اصطلاح `createXRuntime()` (موثّق في `docs/handbook/08_PROJECT_STATUS.md` §21 ونتيجة F3 في `docs/certification/ARCHITECTURE_AUDIT.md`) — مقصود لأنها مصمّمة لتُركَّب جزئيًا من طرف مستهلك (بشكل أساسي `ai-brain`)، لا لتُشغَّل ككائن تشغيل واحد.

### 2. المسؤوليات

خمسة عشر وحدة قدرة، كل منها بمجمّع أساسي خاص بها: اكتشاف الاتجاهات (Trend)، بحث السوق (Market)، استخبارات المنافسين (Competitor)، اكتشاف المنتجات (ProductOpportunity)، اكتشاف الآلات (MachineOpportunity)، استخبارات التسعير (PriceAnalysis)، رؤى العملاء (CustomerInsight)، تنقيب المعرفة (KnowledgeFinding)، التنبؤ (Forecast)، محرك التوصيات (RecommendationCandidate)، التسجيل (IntelligenceScore)، الترتيب (RankingResult)، الإشارات (Signal)، والفرص التجارية (BusinessOpportunity) — بالإضافة إلى طبقة استعلام (`IntelligenceQueries`) موحّدة فوق هذه المستودعات.

### 3. خارج نطاق المسؤولية

- لا تكامل نموذج لغوي كبير أو ذكاء اصطناعي داخل هذه الحزمة.
- لا تنفيذ قرارات — Decision Engine وحده المخوّل بذلك.
- لا استمرارية حقيقية (ORM)، لا UI، لا HTTP.
- لا تنفيذ منطق أعمال نطاقات أخرى.

### 4. وقت التشغيل العام

**لا يوجد `createIntelligenceRuntime()` ولا كائن تشغيل موحّد واحد في هذه الحزمة — وهذا انحراف موثّق ومُصرّح به، وليس عيبًا.** بدلًا من ذلك، تُصدّر الحزمة مصانع (factories) مستقلة على مستوى الوحدة، من بينها: `createForecaster()`، `createRecommender()`، `createScorer()`، `createRanker()` — كل منها تُنشئ خدمة مستقلة قابلة للتركيب يدويًا من طرف المستهلك (بشكل رئيسي `ai-brain`)، بالإضافة إلى `createIntelligenceQueries(deps)` كطبقة استعلام موحّدة فوق كل المستودعات. كل وحدة قدرة تُصدّر أيضًا دالة إنشاء مستودعها الخاص (مثل `createTrendRepository()`).

### 5. الاستعلامات العامة

طبقة `IntelligenceQueries` حقيقية وموحّدة (رغم غياب Runtime موحّد): `findTrendingProducts`، `findTrendingCapabilities`، `findMachineOpportunities`، `findBusinessOpportunities`، `findCompetitorThreats`، `findPriceGaps`، `findMarketDemand`، `findRecommendedProducts` — مبنية عبر `createIntelligenceQueries(deps)` فوق ثمانية مستودعات مُحقنة صراحة (`trendRepository`، `productOpportunityRepository`، إلخ)، مع نقاط ربط اختيارية (`resolveCapabilityIdsForTrends`، `resolveProductIdsForCandidates`، `listAllPriceAnalyses`) لأن بعض المجاميع لا تحمل روابط `capabilityId`/`productId` ضمن عقود هذه الحزمة نفسها (تلك الروابط تعيش في Business DNA/Domain Graph) — عند عدم توفيرها، تُعاد قوائم فارغة بدلاً من بيانات مُختلَقة.

### 6. الأحداث المكتوبة النوع

**لا يوجد ناقل أحداث موحّد واحد (`createIntelligenceEventBus()`) في هذه الحزمة.** بدلاً من ذلك، تُعرّف كل واحدة من الوحدات الأربع عشرة (`trend-discovery`، `market-research`، `competitor-intelligence`، إلخ) ملف `events.ts` خاصًا بها يصرّح عن اتحاد أسماء أحداث (`DomainEventName`) وأشكال حمولة (`DomainEvent`) محليًا — على سبيل المثال `trend.discovered`/`trend.updated`/`trend.peaking`/`trend.declining`/`trend.archived` في `trend-discovery/events.ts` — لكن دون تجميعها في ناقل واحد مُصدَّر أو استدعاء نشر (`publish`) فعلي موحّد على مستوى الحزمة. هذا يتسق مع غياب كائن Runtime موحّد يمكن أن يستضيف مثل هذا الناقل.

### 7. الاعتماديات

`@lateen-os/business-dna`، `@lateen-os/capability-engine`، `@lateen-os/decision-engine`، `@lateen-os/domain-graph`، `@lateen-os/institutional-memory`، `@lateen-os/shared-kernel`. الاستخدام الفعلي داخل الكود محدود لإعادة استخدام أنواع بنيوية فقط (مثل `DecisionCategory` من `decision-engine` في `recommendation-engine/recommender.impl.ts`، ومعرّفات من `business-dna`/`domain-graph` في `shared/identifiers.ts`).

### 8. الحزم المعتمِدة

`@lateen-os/ai-runtime`، `@lateen-os/ai-workforce`، `@lateen-os/analytics-engine`، `@lateen-os/sdk`، وخارج `packages/*`: `services/product-discovery`.

### 9. نقاط التكامل

**لا يوجد مجلد `relationship-management/`** — هذه الحزمة تنتمي إلى المجموعة الأصغر من حزم لا Runtime موحّد فيها أصلًا، فلا معنى لطبقة علاقات مركزية فوق كائن غير موجود. التكامل الفعلي مع Decision Engine هو من طرف واحد ونوعي فقط: `recommendation-engine` يستورد نوع `DecisionCategory` من `@lateen-os/decision-engine` لبناء `RecommendationCandidate` متوافق مع ما يستهلكه Decision Engine — لا استدعاء تشغيلي فعلي لأي واجهة Decision Engine من هذه الحزمة. حسب مخطط العمارة الخاص بالحزمة (`ARCHITECTURE.md`)، يُستهلك ناتج هذه الحزمة من طرف Decision Engine وAI Workforce، وليس العكس.

### 10. ملاحظات معمارية

هذا الانحراف عن `createXRuntime()` **مُصرّح به رسميًا وموثّق مسبقًا** — لا يجوز اعتباره خطأ أو محاولة "إصلاحه" بفرض غلاف Runtime. الحزمة مصمّمة عمدًا لتُستهلك جزئيًا (وحدة تلو الأخرى) من طرف مستهلك واحد رئيسي هو `ai-brain`، تمامًا كما هو الحال مع `ai-runtime` و`decision-engine`.

### 11. قرارات التصميم

- كل وحدة قدرة مستقلة تمامًا بمستودعها ومصنعها الخاص — لا اقتران بين الوحدات الأربع عشرة خارج ما تحتاجه `IntelligenceQueries` صراحة.
- `Recommender.rankCandidates()` يرتّب حتميًا حسب النتيجة تنازليًا ويحسب المئين (percentile) حسابيًا — لا نموذج تعلّم آلي.
- عند غياب رابط `capabilityId`/`productId` صريح في عقود هذه الحزمة، تُعاد قائمة فارغة بدلاً من افتراض رابط غير موجود.

### 12. نقاط التوسعة

أي حزمة مستقبلية تريد الاستفادة من هذه الحزمة يجب أن تستهلك المصانع المفردة العامة (`createForecaster`، `createRecommender`، `createScorer`، `createRanker`، `createIntelligenceQueries`) مباشرة وتُركّبها بنفسها (كما يفعل `ai-brain`) — لا يجوز افتراض وجود `createIntelligenceRuntime()` أو محاولة إضافته لهذه الحزمة لتوحيد الاستهلاك؛ ذلك يتعارض صراحة مع الانحراف المُصرّح به.

### 13. المحركات ذات الصلة

- [institutional-memory](./institutional-memory.md)

---

# English

## Intelligence Engine

### 1. Purpose

`@lateen-os/intelligence-engine` is Lateen OS's canonical **analysis and recommendation** layer: it discovers opportunities, analyzes markets, detects trends, forecasts demand, and generates recommendations — without executing any decision and without any AI/LLM logic inside it. **This package, along with `ai-runtime` and `decision-engine`, is an officially documented, sanctioned deviation** from the `createXRuntime()` convention (documented in `docs/handbook/08_PROJECT_STATUS.md` §21 and finding F3 of `docs/certification/ARCHITECTURE_AUDIT.md`) — deliberate, because it is designed to be partially composed by a consumer (chiefly `ai-brain`), not instantiated as a single runtime object.

### 2. Responsibilities

Fifteen capability modules, each with its own primary aggregate: Trend Discovery (Trend), Market Research (Market), Competitor Intelligence (Competitor), Product Discovery (ProductOpportunity), Machine Discovery (MachineOpportunity), Pricing Intelligence (PriceAnalysis), Customer Insights (CustomerInsight), Knowledge Mining (KnowledgeFinding), Forecasting (Forecast), Recommendation Engine (RecommendationCandidate), Scoring (IntelligenceScore), Ranking (RankingResult), Signals (Signal), and Opportunities (BusinessOpportunity) — plus a unified query layer (`IntelligenceQueries`) over these repositories.

### 3. Non-responsibilities

- No LLM/AI model integration inside this package.
- No decision execution — Decision Engine alone is authorized for that.
- No real persistence (ORM), no UI, no HTTP.
- No implementation of other domains' business logic.

### 4. Public Runtime

**There is no `createIntelligenceRuntime()` and no single unified runtime object in this package — this is a documented, sanctioned deviation, not a defect.** Instead, the package exports independent module-level factories, including: `createForecaster()`, `createRecommender()`, `createScorer()`, `createRanker()` — each creating an independent service meant to be manually composed by a consumer (chiefly `ai-brain`) — plus `createIntelligenceQueries(deps)` as a unified query layer over all repositories. Each capability module also exports its own repository factory (e.g. `createTrendRepository()`).

### 5. Public Queries

A real, unified `IntelligenceQueries` layer (despite the absence of a unified runtime): `findTrendingProducts`, `findTrendingCapabilities`, `findMachineOpportunities`, `findBusinessOpportunities`, `findCompetitorThreats`, `findPriceGaps`, `findMarketDemand`, `findRecommendedProducts` — built via `createIntelligenceQueries(deps)` over eight explicitly-injected repositories (`trendRepository`, `productOpportunityRepository`, etc.), with optional bridging hooks (`resolveCapabilityIdsForTrends`, `resolveProductIdsForCandidates`, `listAllPriceAnalyses`) because some aggregates don't carry `capabilityId`/`productId` links within this package's own contracts (those links live in Business DNA/Domain Graph) — when not supplied, empty lists are returned rather than fabricated data.

### 6. Typed Events

**There is no single unified event bus (`createIntelligenceEventBus()`) in this package.** Instead, each of the 14 modules (`trend-discovery`, `market-research`, `competitor-intelligence`, etc.) declares its own local `events.ts` with a `DomainEventName` union and `DomainEvent` payload shapes — for example `trend.discovered`/`trend.updated`/`trend.peaking`/`trend.declining`/`trend.archived` in `trend-discovery/events.ts` — but these are not aggregated into one exported bus, nor is there a single package-level `publish` call site. This is consistent with the absence of a unified runtime object that could host such a bus.

### 7. Dependencies

`@lateen-os/business-dna`, `@lateen-os/capability-engine`, `@lateen-os/decision-engine`, `@lateen-os/domain-graph`, `@lateen-os/institutional-memory`, `@lateen-os/shared-kernel`. Actual in-code usage is limited to structural, type-only reuse (e.g. `DecisionCategory` from `decision-engine` in `recommendation-engine/recommender.impl.ts`, and identifiers from `business-dna`/`domain-graph` in `shared/identifiers.ts`).

### 8. Dependents

`@lateen-os/ai-runtime`, `@lateen-os/ai-workforce`, `@lateen-os/analytics-engine`, `@lateen-os/sdk`, and outside `packages/*`: `services/product-discovery`.

### 9. Integration Points

**There is no `relationship-management/` folder** — this package belongs to the smaller group of packages with no unified runtime at all, so a centralized Relationship Layer over a non-existent object would have nothing to sit on. The actual integration with Decision Engine is one-directional and type-only: `recommendation-engine` imports the `DecisionCategory` type from `@lateen-os/decision-engine` to build a `RecommendationCandidate` compatible with what Decision Engine consumes — there is no actual runtime call to any Decision Engine interface from this package. Per the package's own architecture diagram (`ARCHITECTURE.md`), this package's output is consumed by Decision Engine and AI Workforce, not the reverse.

### 10. Architecture Notes

This deviation from `createXRuntime()` is **officially sanctioned and pre-documented** — it must not be treated as a bug or "fixed" by forcing a Runtime wrapper onto it. The package is deliberately designed to be consumed piecemeal (module by module) by one chief consumer, `ai-brain`, exactly as is the case for `ai-runtime` and `decision-engine`.

### 11. Design Decisions

- Each capability module is fully independent with its own repository and factory — no coupling between the 14 modules beyond what `IntelligenceQueries` explicitly requires.
- `Recommender.rankCandidates()` sorts deterministically by score descending and computes a percentile arithmetically — not a machine-learning model.
- When an explicit `capabilityId`/`productId` link is absent from this package's own contracts, an empty list is returned rather than assuming a link that doesn't exist.

### 12. Extension Points

Any future package wanting to use this engine should consume the individual public factories (`createForecaster`, `createRecommender`, `createScorer`, `createRanker`, `createIntelligenceQueries`) directly and compose them itself (as `ai-brain` does) — it must not assume a `createIntelligenceRuntime()` exists, nor attempt to add one to this package to unify consumption; doing so would directly contradict the sanctioned deviation.

### 13. Related Engines

- [institutional-memory](./institutional-memory.md)
