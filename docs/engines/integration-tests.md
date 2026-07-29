---
title: Integration Tests Engine
title_ar: اختبارات التكامل
version: 1.0.0
status: active
package: "@lateen-os/integration-tests"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - sdk
---

# العربية

## اختبارات التكامل — Integration Tests

### 1. الغرض

`@lateen-os/integration-tests` هي **حزمة أدوات اختبار من طرف إلى طرف (Test Harness)**، وليست محركًا قابلًا للتركيب (Composable Engine). هدفها الوحيد هو التحقق من أن المحركات الحقيقية (CEO Engine، AI Brain، AI Runtime، Decision Engine، Intelligence Engine، Provider Hub) تعمل معًا بشكل صحيح عندما تُركَّب بالطريقة الوحيدة المدعومة: عبر `createLateen()` من `@lateen-os/sdk`. لا تُنفّذ هذه الحزمة أي منطق أعمال جديد ولا تُغيّر أي عمارة — تمارس فقط ما تفعله المحركات فعليًا من خلال واجهاتها العامة المُنفّذة مسبقًا.

### 2. المسؤوليات

- خمسة سيناريوهات اختبار من طرف إلى طرف تمارس التركيب الحقيقي فقط عبر `createLateen()`، دون أي محاكاة (mocks) أو كائنات مزيّفة (fakes) أو محركات وهمية.
- التحقق من المسار الناجح الكامل: تقديم/إرسال مهمة عبر CEO، توليد خطة عبر AI Brain (يمر فعليًا عبر سجل عملاء Runtime نفسه)، تفكير Decision Engine في اقتراح إلى نتيجة، تسجيل Intelligence Engine لفرصة، واكتمال المهمة.
- التحقق من سلوكيات حتمية للانحدار: تحذير التحقق من الصلاحيات في AI Brain، رفض حتمي لتوصية ضعيفة أمام مخاطرة عالية في Decision Engine، تصنيف نية غير معروفة، رفض اقتراح ضعيف أمام مخاطرة حرجة، ثبات آلة الحالة النهائية للمهمة.
- التحقق من عزل المهام متعددة التسلسل ضمن نفس `LateenSystem` طويل العمر عبر منظمات متعددة.

### 3. خارج نطاق المسؤولية

- لا تنفيذ منطق أعمال جديد.
- لا تغيير معماري لأي محرك.
- لا محاكاة أو كائنات وهمية للمحركات الحقيقية — الكائن الوحيد المبني يدويًا هو تركيبات Decision Engine الثابتة (`tests/fixtures.ts`)، لأن واجهة Decision Engine لا تعرض مسار كتابة مستودع عمدًا.
- لا افتراض بأن CEO وBrain يشكّلان خط أنابيب واحدًا — هما شقيقان مستقلان في `LateenSystem`، ولا يستدعي أحدهما الآخر.

### 4. وقت التشغيل العام

**لا يوجد `createXRuntime()` خاص بهذه الحزمة، وهذا صحيح معماريًا وليس فجوة** — `integration-tests` ليست محركًا قابلًا للتركيب بحد ذاتها، بل تتحقق من تركيب `sdk`'s `createLateen()` لمحركات أخرى. لا يوجد حتى مجلد `src/` — الحزمة تتكون من ملفات اختبار (`tests/*.test.ts`) وتركيبات (`tests/fixtures.ts`) تستهلك `@lateen-os/sdk` مباشرة.

### 5. الاستعلامات العامة

لا يوجد مجلد `queries/` — لا حالة نطاق خاصة بهذه الحزمة يمكن الاستعلام عنها؛ كل استعلام يمارَس هو استعلام المحركات الحقيقية المستهلكة عبر `createLateen()`.

### 6. الأحداث المكتوبة النوع

لا يوجد ناقل أحداث خاص بهذه الحزمة. السيناريوهات حتمية بالكامل (بدون مؤقتات، بدون عشوائية في التوقعات) — منطق Decision Engine دالة نقية على مدخلها (قوة التوصية ناقص عقوبة المخاطرة)، لذا التوقعات أرقام دقيقة وليست نطاقات.

### 7. الاعتماديات

الاعتمادية الوحيدة المعلنة من نوع `@lateen-os/*` هي `@lateen-os/sdk` — عبرها فقط تصل هذه الحزمة إلى `createLateen()` وكل المحركات المُركَّبة تحته.

### 8. الحزم المعتمِدة

لم يُعثر على أي حزمة أخرى تعتمد على `@lateen-os/integration-tests` — وهذا متوقع لحزمة اختبار طرفية لا تُصدّر واجهة برمجية للاستهلاك.

### 9. نقاط التكامل

لا يوجد مجلد `relationship-management/` — التكامل الوحيد هو استهلاك `createLateen()` من `sdk`، الذي بدوره يُركّب CEO Engine وAI Brain وAI Runtime وDecision Engine وIntelligence Engine وProvider Hub. `integration-tests` لا تتكامل مع أي محرك مباشرة؛ كل تكامل يمر عبر `LateenSystem` المُرجَع من `sdk`.

### 10. ملاحظات معمارية

هذه الحزمة هي الاستثناء الموثّق الوحيد من قاعدة "كل حزمة يجب أن تُصدّر `createXRuntime()`" لأنها ببساطة ليست محركًا — إنها المُدقّق الوحيد الذي يمارس التركيب الحقيقي عبر SDK. تفتقر أيضًا إلى `ARCHITECTURE.md` وملف نموذج مخصص (`*_MODEL.md`)، وهذا موثّق في `ARCHITECTURE_AUDIT.md` (F5) كدين توثيقي حقيقي لكنه غير مُصلح ضمن هذا الالتزام لتفادي اختلاق توثيق تحت ضغط الوقت لحزم لم تُبنَ ضمنه.

### 11. قرارات التصميم

- بدون شبكة، بدون مؤقتات، بدون عشوائية في التوقعات — قابلية اختبار حتمية كاملة دون اتصال.
- الحقن (Dependency Injection) فقط — لا شيء يصل إلى داخليات أي حزمة؛ كل كائن تحت الاختبار هو ما يُرجعه `createLateen()` فعليًا.

### 12. نقاط التوسعة

أي سيناريو تكامل مستقبلي يجب أن يُضاف كملف اختبار جديد يستهلك `createLateen()` فقط، دون إدخال أي محاكاة جديدة أو الوصول المباشر لداخليات أي محرك مُركَّب.

### 13. المحركات ذات الصلة

- انظر جميع المحركات المُركَّبة عبر `createLateen()` — راجع توثيق `sdk` (`docs/engines/sdk.md`، عند توفره).

---

# English

## Integration Tests Engine

### 1. Purpose

`@lateen-os/integration-tests` is an **end-to-end test-harness package**, not a composable engine. Its sole purpose is to verify that the real engines (CEO Engine, AI Brain, AI Runtime, Decision Engine, Intelligence Engine, Provider Hub) work together correctly when composed the one supported way: through `createLateen()` from `@lateen-os/sdk`. It implements no new business logic and changes no architecture — it only exercises what the engines already do through their real, already-implemented public APIs.

### 2. Responsibilities

- Five end-to-end scenarios that exercise real composition only via `createLateen()`, with no mocks, no fakes, no stubbed engines.
- Verify the full happy path: a mission submitted/dispatched through CEO, a plan generated by AI Brain (genuinely routing through the same Runtime agent registry), Decision Engine reasoning a proposal to an outcome, Intelligence Engine scoring an opportunity, and mission completion.
- Verify deterministic regression behaviors: AI Brain's permission-validation warning, Decision Engine's deterministic rejection of a weak recommendation against high risk, unknown-intent classification, rejection of a weak proposal against critical risk, and the terminal-state invariance of the mission state machine.
- Verify isolation across multiple sequential missions within one long-lived `LateenSystem`, across organizations.

### 3. Non-responsibilities

- No new business logic implementation.
- No architectural change to any engine.
- No mocks or fakes for real engines — the only hand-built objects are Decision Engine fixtures (`tests/fixtures.ts`), because Decision Engine's facade deliberately exposes no repository write path.
- No assumption that CEO and Brain form a single pipeline — they are independent siblings within `LateenSystem`; neither calls the other.

### 4. Public Runtime

**This package has no `createXRuntime()` of its own, and this is architecturally correct, not a gap** — `integration-tests` is not itself a composable engine; it verifies `sdk`'s `createLateen()` composition of other engines. There is not even a `src/` folder — the package consists of test files (`tests/*.test.ts`) and fixtures (`tests/fixtures.ts`) that consume `@lateen-os/sdk` directly.

### 5. Public Queries

There is no `queries/` folder — there is no domain state of this package's own to query; every query exercised is a query of the real engines consumed through `createLateen()`.

### 6. Typed Events

There is no event bus of this package's own. Scenarios are fully deterministic (no timers, no randomness in assertions) — Decision Engine's reasoner is a pure function of its input (recommendation strength minus risk penalty), so expectations are exact numbers, not ranges.

### 7. Dependencies

The only declared `@lateen-os/*` dependency is `@lateen-os/sdk` — through it alone this package reaches `createLateen()` and every engine composed underneath it.

### 8. Dependents

No other package was found depending on `@lateen-os/integration-tests` — expected for a leaf test package that exports no API for consumption.

### 9. Integration Points

There is no `relationship-management/` folder — the only integration is consuming `createLateen()` from `sdk`, which in turn composes CEO Engine, AI Brain, AI Runtime, Decision Engine, Intelligence Engine, and Provider Hub. `integration-tests` never integrates with any engine directly; every integration flows through the `LateenSystem` object `sdk` returns.

### 10. Architecture Notes

This package is the one documented exception to the "every package must export `createXRuntime()`" rule because it simply isn't an engine — it is the one harness that exercises real composition through the SDK. It also lacks an `ARCHITECTURE.md` and a dedicated model document (`*_MODEL.md`), recorded in `ARCHITECTURE_AUDIT.md` (F5) as genuine documentation debt, not fixed as part of this sprint to avoid fabricating documentation under time pressure for packages not built within it.

### 11. Design Decisions

- No network calls, no timers, no randomness in assertions — fully deterministic, fully offline testability.
- Dependency injection only — nothing reaches into any package's internals; every object under test is exactly what `createLateen()` actually returns.

### 12. Extension Points

Any future integration scenario must be added as a new test file consuming `createLateen()` only, without introducing new mocking or direct access to any composed engine's internals.

### 13. Related Engines

- See every engine composed through `createLateen()` — refer to the `sdk` package's own documentation (`docs/engines/sdk.md`, once available).
