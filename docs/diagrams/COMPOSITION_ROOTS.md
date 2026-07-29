---
title: Composition-Root Categories
title_ar: فئات جذر التركيب
version: 1.0.0
status: active
phase: "Documentation Sprint — Diagrams (post Commit 35)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/RUNTIME_AUDIT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ./RUNTIME.md
related_engines:
  - ai-brain
  - ai-provider-hub
  - ceo-engine
  - extension-system
  - ai-runtime
  - decision-engine
  - intelligence-engine
related_commits:
  - "35"
---

# العربية

## ثلاث فئات حقيقية لجذر التركيب عبر 39 حزمة

`docs/certification/RUNTIME_AUDIT.md` يُصنّف كل حزمة من 39 حسب شكل جذر تركيبها الفعلي. هذا الرسم يقارن الفئات الثلاث ذات الصلة (باستثناء الحزم البنيوية التي لا تحتاج جذرًا إطلاقًا: `capability-engine`, `kernel`, `sdk`, `shared-kernel`, `typescript-config`, `connector-base`, `integration-contracts`, `integration-tests`).

```mermaid
flowchart TB
  subgraph CAT1["الفئة 1 — مطابقة تمامًا: createXRuntime() (24 حزمة)"]
    C1A["finance-engine → createFinanceRuntime()"]
    C1B["marketplace → createMarketplaceRuntime()"]
    C1C["crm-engine, sales-engine, admin-console,\napi-gateway, ...20 أخرى"]
  end

  subgraph CAT2["الفئة 2 — مسمّاة بشكل مختلف، نفس الوظيفة (4 حزم)"]
    C2A["ai-brain → createBrainSystem()"]
    C2B["ai-provider-hub → createAiProviderHub()"]
    C2C["ceo-engine → createCEOEngine()"]
    C2D["extension-system → createExtensionSystem()"]
  end

  subgraph CAT3["الفئة 3 — انحراف مُصرَّح به: لا جذر تركيب موحّد (3 حزم)"]
    C3A["ai-runtime → مصانع على مستوى الوحدة\n(createReasoner, createConversationRuntimeService, ...)\n+ createRuntimeQueries()"]
    C3B["decision-engine → createScorer وما شابه\n+ طبقة استعلام موحّدة"]
    C3C["intelligence-engine → مصانع متعددة مماثلة"]
  end

  CAT1 -->|"معيار الامتداد المستقبلي\n(AI_PROJECT_CONTEXT.md §10)"| NEW["أي حزمة جديدة يجب أن تتبع هذا الشكل"]
  CAT2 -.->|"دَين تقني مسجَّل\n(لم يُعَد التسمية تفاديًا لكسر التوافق)"| DEBT["KNOWN_TECHNICAL_DEBT.md #5"]
  CAT3 -.->|"موثّق ومقصود صراحة\n(08_PROJECT_STATUS.md §21)"| SANCTIONED["لا يُصلَح — مستهلَك جزئيًا بواسطة ai-brain بشكل أساسي"]
```

### الفرق الجوهري بين الفئة 2 والفئة 3

- **الفئة 2** ترجع كائنًا واحدًا يجمّع كل خدمات/استعلامات/أحداث الحزمة — تمامًا كـ `createXRuntime()` وظيفيًا، فقط باسم مختلف يسبق توحيد اصطلاح التسمية في العصر الثاني.
- **الفئة 3** لا ترجع كائنًا موحّدًا إطلاقًا بتصميم متعمَّد — الفكرة أن يُركِّب المستهلك (غالبًا `ai-brain`) أجزاءً مختارة من هذه الحزم الثلاث بنفسه، بدلًا من فرض غلاف Runtime واحد عليها. محاولة "إصلاح" هذا بفرض غلاف Runtime تُعتبر مخالفة توجيه صريح في `AI_PROJECT_CONTEXT.md` §2.

---

# English

## Three real composition-root categories across 39 packages

`docs/certification/RUNTIME_AUDIT.md` classifies every one of the 39 packages by the actual shape of its composition root. This diagram contrasts the three categories that matter here (excluding structural packages that need no root at all: `capability-engine`, `kernel`, `sdk`, `shared-kernel`, `typescript-config`, `connector-base`, `integration-contracts`, `integration-tests`).

```mermaid
flowchart TB
  subgraph CAT1["Category 1 — Conforms exactly: createXRuntime() (24 packages)"]
    C1A["finance-engine → createFinanceRuntime()"]
    C1B["marketplace → createMarketplaceRuntime()"]
    C1C["crm-engine, sales-engine, admin-console,\napi-gateway, ...20 others"]
  end

  subgraph CAT2["Category 2 — Differently named, same function (4 packages)"]
    C2A["ai-brain → createBrainSystem()"]
    C2B["ai-provider-hub → createAiProviderHub()"]
    C2C["ceo-engine → createCEOEngine()"]
    C2D["extension-system → createExtensionSystem()"]
  end

  subgraph CAT3["Category 3 — Sanctioned deviation: no unified runtime (3 packages)"]
    C3A["ai-runtime → module-level factories\n(createReasoner, createConversationRuntimeService, ...)\n+ createRuntimeQueries()"]
    C3B["decision-engine → createScorer and similar\n+ a unified query layer"]
    C3C["intelligence-engine → multiple similar factories"]
  end

  CAT1 -->|"the standard for future extension\n(AI_PROJECT_CONTEXT.md §10)"| NEW["Any new package must follow this shape"]
  CAT2 -.->|"recorded technical debt\n(not renamed, to avoid a breaking change)"| DEBT["KNOWN_TECHNICAL_DEBT.md #5"]
  CAT3 -.->|"documented and deliberately intentional\n(08_PROJECT_STATUS.md §21)"| SANCTIONED["not to be fixed — chiefly partially composed by ai-brain"]
```

### The essential difference between Category 2 and Category 3

- **Category 2** returns a single object that aggregates all of that package's services/queries/events — functionally identical to `createXRuntime()`, just under a name that predates the Era-2 naming convention.
- **Category 3** deliberately returns no unified object at all — the intent is that a consumer (chiefly `ai-brain`) composes selected pieces of these three packages itself, rather than a Runtime wrapper being imposed on them. Attempting to "fix" this by forcing a Runtime wrapper is explicitly against the guidance in `AI_PROJECT_CONTEXT.md` §2.

---

## Related Documents

- [AI_PROJECT_CONTEXT](../AI_PROJECT_CONTEXT.md)
- [RUNTIME_AUDIT](../certification/RUNTIME_AUDIT.md)
- [ARCHITECTURE_AUDIT](../certification/ARCHITECTURE_AUDIT.md)
- [RUNTIME](./RUNTIME.md)

## Related Engines

`ai-brain`, `ai-provider-hub`, `ceo-engine`, `extension-system` (Category 2); `ai-runtime`, `decision-engine`, `intelligence-engine` (Category 3).

## Related Commits

Commit 35 (`d9616a0` and the certification/documentation sprint that followed it).
