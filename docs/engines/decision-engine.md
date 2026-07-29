---
title: Decision Engine
title_ar: محرك القرار
version: 1.0.0
status: active
package: "@lateen-os/decision-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - business-dna
  - capability-engine
  - domain-graph
  - institutional-memory
  - ceo-engine
---

# العربية

## الغرض

`@lateen-os/decision-engine` هو **الطبقة القانونية الوحيدة لاتخاذ القرار** في Lateen OS، وفق المبدأ التأسيسي للمنصة: "الذكاء الاصطناعي يُنتج توصيات؛ محرك القرار هو الجهة الوحيدة المخوّلة لتحويل التوصية إلى قرار تنفيذي." لا يجوز لأي وكيل ذكاء اصطناعي اتخاذ قرار عمل مباشرة — كل التوصيات، الموافقات، الرفض، الترتيب حسب الأولوية، والتصعيد تمر عبر العقود المعرَّفة هنا.

## المسؤوليات

- تعريف وتنفيذ دورة حياة القرار (`Decision`) وسياقه (`DecisionContext`).
- التقييم (`EvaluationResult`/`Criteria`/`Score`)، السياسات (`DecisionPolicy`) مع مقيّم تعبيرات حقيقي (`evaluatePolicyConstraints`، `evaluateExpression`)، والقواعد (`DecisionRule` بأنواعها التجارية/التقنية/الامتثالية).
- التوصيات والبدائل (`Recommendation`/`Alternative`)، تدفقات الموافقة (`ApprovalFlow`)، تقييم المخاطر (`RiskAssessment`)، الترتيب حسب الأولوية (`PriorityScore`)، وخطط التنفيذ (`DecisionExecutionPlan`).
- أربعة منافذ استدلال حقيقية على مستوى الوحدة (لا جذر تركيب موحّد): `createReasoner`، `createDecisionResolver`، `createConflictResolver`، `createContextResolver`.
- طبقة استعلامات حقيقية (`DecisionQueries`) للاكتشاف والمراقبة.

## خارج نطاق المسؤولية

- **لا استدلال ذكاء اصطناعي / نماذج لغة كبيرة** — الاستدلال حتمي وقائم على قواعد بالكامل، وهذا مذكور صراحة في التعليق التوثيقي لملف `index.ts` نفسه.
- لا استمرارية تتجاوز التخزين داخل الذاكرة، لا UI/API/HTTP.
- لا يجوز لأي حزمة أعلى (مثل `ai-workforce` أو التطبيقات) تجاوز هذا المحرك لاتخاذ قرار نهائي — هذا محظور صراحة في `ARCHITECTURE.md` الخاص بالحزمة.
- لا يوجد تنفيذ فعلي لتعبئة مراجع الحزم الشقيقة (`businessDnaRefs`، `capabilityRefs` في `DecisionContext`) — هذه مسؤولية طبقة بنية تحتية خارج هذه الحزمة، كما يذكر `context-resolver.impl.ts` صراحة.

## وقت التشغيل العام

**لا يوجد جذر تركيب موحّد (`createXRuntime()`)** في هذه الحزمة — وهذا انحراف موثّق ومُقَرّ رسميًا (`docs/handbook/08_PROJECT_STATUS.md` §21، `03_CONSTITUTION.md` §3 القاعدة 5.1)، وليس نقصًا. بدلًا من ذلك، تُصدّر الحزمة مصانع (factories) مستقلة على مستوى الوحدة، يُركِّبها المستهلك (بشكل رئيسي `ai-brain`) بنفسه: `createReasoner`، `createDecisionResolver`، `createConflictResolver`، `createContextResolver(deps: ContextResolverDeps)`، بالإضافة إلى `createDecisionQueries(deps: DecisionQueriesDeps)` وعشرة مصانع مستودع منفصلة (`createDecisionRepository`، `createDecisionContextRepository`، إلخ).

## الاستعلامات العامة

عقد `DecisionQueries` حقيقي **ومُنفَّذ فعليًا** (`createDecisionQueries` في `queries/decision-queries.impl.ts`، بخلاف `capability-engine`): `findDecision`، `findRecommendations`، `findPendingApprovals`، `findRisks`، `findPolicyViolations` (يعتمد على `getPolicyViolations` اختياري، ويُرجع فارغًا إن لم يُحقن — لا يوجد تجميع `PolicyViolation` أو مستودع خاص به في عقود الحزمة)، `findAlternativeDecisions`.

## الأحداث المكتوبة النوع

**لا يوجد ناقل أحداث نطاق موحّد** (لا مجلد `events/` على مستوى الحزمة ولا `create*EventBus()`). بدلًا من ذلك، كل نطاق فرعي (`decision`, `context`, `evaluation`, `policy`, `rule`, `recommendation`, `approval`, `risk`, `priority`, `execution`) يملك ملف `events.ts` خاصًا به يُعرّف أنواع أحداثه فقط (مثل `decision.created`، `decision.approved`، `decision.escalated`، `decision.completed`، إلخ) دون آلية نشر موحّدة مُصدَّرة من الحزمة.

## الاعتماديات

حسب `package.json`: `@lateen-os/business-dna`، `@lateen-os/capability-engine`، `@lateen-os/domain-graph`، `@lateen-os/institutional-memory`، `@lateen-os/shared-kernel`. **ملاحظة مهمة**: فحص الشيفرة المصدرية أظهر أن الاستخدام الفعلي لكل من `business-dna`، `capability-engine`، `domain-graph`، و`institutional-memory` مقتصر بالكامل على استيراد معرّفات (`OrganizationId`، `CapabilityId`، `GraphNodeId`، `InstitutionalMemoryId`، إلخ) على **مستوى الأنواع فقط** في `src/shared/identifiers.ts` — لا يوجد أي استدعاء فعلي لأي دالة `createXRuntime()` من أي من هذه الحزم الأربع في كامل شجرة `src/` الخاصة بـ`decision-engine`.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع: `ai-brain`، `ai-runtime`، `ai-workforce`، `analytics-engine`، `intelligence-engine`، `multi-agent`، `sdk`، `workflow-engine`.

## نقاط التكامل

**لا يوجد مجلد `relationship-management/`**. هذه من الحزم التسع المذكورة في `INTEGRATION_AUDIT.md` (النتيجة F1) كحزم "تتكامل مع حزم شقيقة حقيقية بدون طبقة علاقات مخصصة" — لكن الفحص المباشر لهذه الحزمة تحديدًا يُظهر أن "التكامل" الفعلي محصور في إعادة استخدام أنواع المعرّفات فقط، وليس استدعاء خدمات تشغيلية حقيقية لأي من الحزم الأربع.

## ملاحظات معمارية

- **انحراف مُقَرّ رسميًا عن اصطلاح الـ Runtime**: `decision-engine`، `ai-runtime`، و`intelligence-engine` هي الحزم الثلاث الوحيدة في المنصة التي لا تُصدّر جذر تركيب موحّد، بتصميم مقصود يسمح لـ `ai-brain` بتركيب الأجزاء التي يحتاجها فقط.
- `DecisionQueries.findPolicyViolations` تعتمد على دالة استرجاع اختيارية (`getPolicyViolations`) لأنه لا يوجد تجميع `PolicyViolation` دائم في عقود هذه الحزمة — الانتهاكات تُنتَج بشكل عابر أثناء التقييم (`policy-evaluator.ts`).
- توثيق الحزمة نفسه (`ARCHITECTURE.md`) يستخدم جدولًا يشير إلى "أحداث ✓" لكل وحدة فرعية تقريبًا، وهذا صحيح على مستوى تعريف الأنواع فقط (`events.ts` لكل نطاق) وليس ناقل أحداث فعليًا مُصدَّرًا من الحزمة — لا تناقض هنا، لكنه تمييز دقيق يستحق الذكر.

## قرارات التصميم

- الاستدلال حتمي وقائم على قواعد بالكامل، بلا أي استدعاء لنموذج لغة كبير — مذكور صراحة في `@packageDocumentation` الخاص بالحزمة.
- مقيّم السياسات (`evaluatePolicyConstraints`/`evaluateExpression`) دوال نقية قابلة للاختبار بمعزل عن أي حالة.
- كل نطاق فرعي يملك مستودعه الخاص (`create*Repository`) وحدثه الخاص، مما يتيح تركيبًا انتقائيًا من قِبل المستهلك بدلًا من فرض جذر تركيب واحد ضخم.

## نقاط التوسعة

أي حزمة مستقبلية تريد استهلاك محرك القرار يجب أن تستورد المصانع المستقلة التي تحتاجها فقط (`createReasoner`، `createDecisionQueries`، إلخ) وتُركِّبها بنفسها — تمامًا كما تفعل `ai-brain` حاليًا — بدلًا من افتراض وجود `createDecisionRuntime()` غير موجود. لا يجوز لأي وكيل تجاوز هذا المحرك لاتخاذ قرار نهائي مباشرة.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)
- [Capability Engine](./capability-engine.md)
- [Domain Graph](./domain-graph.md)
- [CEO Engine](./ceo-engine.md)

---

# English

## Purpose

`@lateen-os/decision-engine` is the **sole authorized decision layer** in Lateen OS, per the platform's founding principle: "AI produces recommendations; the Decision Engine is the sole authority that turns a recommendation into an executable decision." No AI agent may make a business decision directly — every recommendation, approval, rejection, prioritization, and escalation passes through the contracts defined here.

## Responsibilities

- Defines and implements the Decision lifecycle and its `DecisionContext`.
- Evaluation (`EvaluationResult`/`Criteria`/`Score`), policies (`DecisionPolicy`) with a real expression evaluator (`evaluatePolicyConstraints`, `evaluateExpression`), and rules (`DecisionRule` in business/technical/compliance variants).
- Recommendations and alternatives (`Recommendation`/`Alternative`), approval flows (`ApprovalFlow`), risk assessment (`RiskAssessment`), priority scoring (`PriorityScore`), and execution plans (`DecisionExecutionPlan`).
- Four real, module-level reasoning ports (no unified composition root): `createReasoner`, `createDecisionResolver`, `createConflictResolver`, `createContextResolver`.
- A real query layer (`DecisionQueries`) for discovery and monitoring.

## Non-responsibilities

- **No LLM/AI inference** — reasoning is entirely deterministic and rule-based, stated explicitly in the package's own `index.ts` doc comment.
- No persistence beyond in-memory storage, no UI/API/HTTP.
- No package above it (e.g. `ai-workforce` or applications) may bypass this engine to make a final decision — explicitly forbidden in the package's own `ARCHITECTURE.md`.
- No real implementation of populating sibling references (`businessDnaRefs`, `capabilityRefs` in `DecisionContext`) — this is explicitly stated in `context-resolver.impl.ts` as an infrastructure-layer concern outside this package.

## Public Runtime

**There is no unified composition root (`createXRuntime()`)** in this package — this is a formally documented and sanctioned deviation (`docs/handbook/08_PROJECT_STATUS.md` §21, `03_CONSTITUTION.md` §3 Rule 5.1), not a gap. Instead, the package exports independent, module-level factories, meant to be composed by the consumer (chiefly `ai-brain`) itself: `createReasoner`, `createDecisionResolver`, `createConflictResolver`, `createContextResolver(deps: ContextResolverDeps)`, plus `createDecisionQueries(deps: DecisionQueriesDeps)` and ten separate repository factories (`createDecisionRepository`, `createDecisionContextRepository`, etc.).

## Public Queries

A real `DecisionQueries` contract that is **actually implemented** (`createDecisionQueries` in `queries/decision-queries.impl.ts`, unlike `capability-engine`): `findDecision`, `findRecommendations`, `findPendingApprovals`, `findRisks`, `findPolicyViolations` (relies on an optional `getPolicyViolations` callback, returning empty if not injected — there is no persistent `PolicyViolation` aggregate or repository in this package's contracts), `findAlternativeDecisions`.

## Typed Events

**There is no unified domain event bus** (no package-level `events/` folder, no `create*EventBus()`). Instead, each subdomain (`decision`, `context`, `evaluation`, `policy`, `rule`, `recommendation`, `approval`, `risk`, `priority`, `execution`) has its own `events.ts` file declaring only its own event types (e.g. `decision.created`, `decision.approved`, `decision.escalated`, `decision.completed`, etc.) with no unified publication mechanism exported from the package.

## Dependencies

Per `package.json`: `@lateen-os/business-dna`, `@lateen-os/capability-engine`, `@lateen-os/domain-graph`, `@lateen-os/institutional-memory`, `@lateen-os/shared-kernel`. **Important note**: direct source inspection showed that the actual usage of `business-dna`, `capability-engine`, `domain-graph`, and `institutional-memory` is entirely limited to importing identifiers (`OrganizationId`, `CapabilityId`, `GraphNodeId`, `InstitutionalMemoryId`, etc.) at the **type level only** in `src/shared/identifiers.ts` — there is no actual call to any `createXRuntime()` from any of these four packages anywhere in `decision-engine`'s `src/` tree.

## Dependents

Verified by grepping `package.json` across the workspace: `ai-brain`, `ai-runtime`, `ai-workforce`, `analytics-engine`, `intelligence-engine`, `multi-agent`, `sdk`, `workflow-engine`.

## Integration Points

**There is no `relationship-management/` folder.** This is one of the nine packages named in `INTEGRATION_AUDIT.md` (finding F1) as integrating with real siblings without a dedicated Relationship Layer — but direct inspection of this specific package shows the actual "integration" is limited to identifier-type reuse, not real runtime service calls to any of the four packages.

## Architecture Notes

- **A formally sanctioned deviation from the Runtime convention**: `decision-engine`, `ai-runtime`, and `intelligence-engine` are the only three packages on the platform with no unified composition root, by deliberate design allowing `ai-brain` to compose only the parts it needs.
- `DecisionQueries.findPolicyViolations` relies on an optional callback (`getPolicyViolations`) because there is no persistent `PolicyViolation` aggregate in this package's contracts — violations are produced transiently during evaluation (`policy-evaluator.ts`).
- The package's own documentation (`ARCHITECTURE.md`) uses a table marking "Events ✓" for nearly every subdomain — this is accurate only at the type-declaration level (a per-subdomain `events.ts`), not an actual event bus exported by the package. Not a contradiction, but a distinction worth noting precisely.

## Design Decisions

- Reasoning is entirely deterministic and rule-based, with no LLM call whatsoever — stated explicitly in the package's own `@packageDocumentation`.
- The policy evaluator (`evaluatePolicyConstraints`/`evaluateExpression`) consists of pure functions testable in isolation from any state.
- Each subdomain owns its own repository (`create*Repository`) and its own events, enabling selective composition by the consumer instead of one large forced composition root.

## Extension Points

Any future package that wants to consume the Decision Engine should import only the independent factories it needs (`createReasoner`, `createDecisionQueries`, etc.) and compose them itself — exactly as `ai-brain` already does — rather than assuming a nonexistent `createDecisionRuntime()`. No agent may bypass this engine to make a final decision directly.

## Related Engines

- [Business DNA](./business-dna.md)
- [Capability Engine](./capability-engine.md)
- [Domain Graph](./domain-graph.md)
- [CEO Engine](./ceo-engine.md)
