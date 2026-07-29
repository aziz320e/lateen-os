---
title: Diagram Index
title_ar: فهرس الرسوم البيانية
version: 2.0.0
status: active
phase: "Documentation Sprint — Diagrams (post Commit 35)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
  - ../certification/RUNTIME_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
  - ../handbook/00_MASTER_PLAN.md
  - ../handbook/08_PROJECT_STATUS.md
  - ../handbook/09_COMMIT_HISTORY.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## فهرس الرسوم البيانية

جميع الرسوم البيانية في هذا المستودع مكتوبة بصيغة Mermaid ومضمّنة مباشرة داخل ملفات Markdown المصدر — لا صور ثنائية منفصلة. هذا يضمن أن الرسم البياني يبقى متزامنًا مع النص المحيط به ويمكن مراجعته عبر diff نصي عادي. هذا الفهرس يغطي مجموعتين: **رسوم `docs/handbook/`** (الموروثة من المرحلة 1 / Commit 1–25) و**رسوم `docs/diagrams/`** (15 مستندًا جديدًا، أُنتجت في مسار توثيقي مخصّص بعد شهادة Commit 35، تُغطّي معمارية المنصة بأكملها عبر 39 حزمة).

كل رسم في هذا المجلد **ثنائي اللغة** (عربي أولًا، ثم إنجليزي)، ومبني حصرًا على أدلة حقيقية من `docs/AI_PROJECT_CONTEXT.md` وتقارير `docs/certification/` والكود المصدري الفعلي لحزم `packages/*` — لا حزمة أو اعتمادية مُخترعة في أي رسم.

### رسوم `docs/diagrams/` (15 مستندًا)

| # | المستند | نوع الرسم | الموضوع |
| --- | --- | --- | --- |
| 1 | [SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md) | `flowchart` (سياق نظام C4) | Lateen OS كنظام واحد، مع `apps/*`, `extensions/*`, `services/*` |
| 2 | [CONTAINER.md](./CONTAINER.md) | `flowchart` (حاويات C4) | الطبقات العشر كحاويات |
| 3 | [COMPONENT.md](./COMPONENT.md) | `flowchart` (مكوّنات C4) | تكبير داخل `finance-engine` |
| 4 | [RUNTIME.md](./RUNTIME.md) | `flowchart` | نمط جذر التركيب `createFinanceRuntime()` |
| 5 | [DEPENDENCY.md](./DEPENDENCY.md) | `flowchart` (DAG) | رسم اعتماديات الطبقات + دائرة `ai-brain ⇄ multi-agent` المُعلَّمة |
| 6 | [PACKAGE.md](./PACKAGE.md) | `flowchart` | كل الحزم الـ39 مُصنَّفة حسب الطبقة |
| 7 | [INTEGRATION.md](./INTEGRATION.md) | `sequenceDiagram` | 3 أمثلة تكامل حقيقية عبر طبقة العلاقات |
| 8 | [EVENT_FLOW.md](./EVENT_FLOW.md) | `sequenceDiagram` | تدفق حدث `invoice.issued` الحقيقي في `finance-engine` |
| 9 | [RELATIONSHIP_FLOW.md](./RELATIONSHIP_FLOW.md) | `flowchart` | 8 تكاملات `marketplace` مع أشقائها وآلية التدهور |
| 10 | [COMPOSITION_ROOTS.md](./COMPOSITION_ROOTS.md) | `flowchart` | فئات جذر التركيب الثلاث عبر المنصة |
| 11 | [ERP_LAYER.md](./ERP_LAYER.md) | `flowchart` | طبقة الأعمال كمكافئ ERP |
| 12 | [AI_LAYER.md](./AI_LAYER.md) | `flowchart` | طبقة الاستدلال الحقيقية واعتمادياتها |
| 13 | [KNOWLEDGE_LAYER.md](./KNOWLEDGE_LAYER.md) | `flowchart` | `business-dna` → `domain-graph` → `institutional-memory` |
| 14 | [BUSINESS_LAYER.md](./BUSINESS_LAYER.md) | `flowchart` | نفس طبقة الأعمال بزاوية القدرة التجارية |
| 15 | [ENTERPRISE_LAYER.md](./ENTERPRISE_LAYER.md) | `flowchart` | الثقة + الأفقية + سطح المنصة تُغلِّف طبقة الأعمال |

### رسوم `docs/handbook/` (موروثة من المرحلة 1)

| الرسم | النوع | الموقع |
| --- | --- | --- |
| سير عمل التطوير | `flowchart` | [00_MASTER_PLAN.md](../handbook/00_MASTER_PLAN.md) — القسم 10 |
| الجدول الزمني لتطور المنصة | `timeline` | [09_COMMIT_HISTORY.md](../handbook/09_COMMIT_HISTORY.md) |
| توزيع الحزم حسب الفئة | `pie` | [08_PROJECT_STATUS.md](../handbook/08_PROJECT_STATUS.md) — القسم 14 |

### سياسة الإضافة

عند إضافة رسم بياني جديد لأي مستند تحت `docs/diagrams/` أو `docs/handbook/`، يُضاف صف جديد هنا يشير إلى موقعه بدلًا من تكرار الرسم في هذا الملف — مصدر الحقيقة الوحيد لكل رسم هو المستند الذي يحتويه. للتفاصيل الكاملة لكل حزمة على حدة، راجع `docs/architecture/PACKAGE_CATALOG.md`.

---

# English

## Diagram Index

Every diagram in this repository is written in Mermaid and embedded directly inside its source Markdown file — there are no separate binary images. This keeps each diagram synchronized with the text around it and reviewable through an ordinary text diff. This index covers two groups: **`docs/handbook/` diagrams** (inherited from Phase 1 / Commit 1–25) and **`docs/diagrams/` diagrams** (15 new documents, produced in a dedicated documentation track after the Commit 35 certification, covering the platform's entire architecture across 39 packages).

Every diagram in this folder is **bilingual** (Arabic first, then English), and built exclusively on real evidence from `docs/AI_PROJECT_CONTEXT.md`, the `docs/certification/` reports, and the actual `packages/*` source code — no invented package or dependency appears in any diagram.

### `docs/diagrams/` diagrams (15 documents)

| # | Document | Diagram type | Subject |
| --- | --- | --- | --- |
| 1 | [SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md) | `flowchart` (C4 System Context) | Lateen OS as one system, with `apps/*`, `extensions/*`, `services/*` |
| 2 | [CONTAINER.md](./CONTAINER.md) | `flowchart` (C4 Container) | The ten layers as containers |
| 3 | [COMPONENT.md](./COMPONENT.md) | `flowchart` (C4 Component) | Zoom into `finance-engine` |
| 4 | [RUNTIME.md](./RUNTIME.md) | `flowchart` | The composition-root pattern, `createFinanceRuntime()` |
| 5 | [DEPENDENCY.md](./DEPENDENCY.md) | `flowchart` (DAG) | Layer dependency graph + the flagged `ai-brain ⇄ multi-agent` cycle |
| 6 | [PACKAGE.md](./PACKAGE.md) | `flowchart` | All 39 packages classified by layer |
| 7 | [INTEGRATION.md](./INTEGRATION.md) | `sequenceDiagram` | 3 real integration examples via the Relationship Layer |
| 8 | [EVENT_FLOW.md](./EVENT_FLOW.md) | `sequenceDiagram` | The real `invoice.issued` event flow in `finance-engine` |
| 9 | [RELATIONSHIP_FLOW.md](./RELATIONSHIP_FLOW.md) | `flowchart` | `marketplace`'s 8 sibling integrations and its degrade mechanism |
| 10 | [COMPOSITION_ROOTS.md](./COMPOSITION_ROOTS.md) | `flowchart` | The three composition-root categories across the platform |
| 11 | [ERP_LAYER.md](./ERP_LAYER.md) | `flowchart` | The business layer as an ERP-equivalent |
| 12 | [AI_LAYER.md](./AI_LAYER.md) | `flowchart` | The real reasoning-stack layer and its dependencies |
| 13 | [KNOWLEDGE_LAYER.md](./KNOWLEDGE_LAYER.md) | `flowchart` | `business-dna` → `domain-graph` → `institutional-memory` |
| 14 | [BUSINESS_LAYER.md](./BUSINESS_LAYER.md) | `flowchart` | The same business layer, framed by business capability |
| 15 | [ENTERPRISE_LAYER.md](./ENTERPRISE_LAYER.md) | `flowchart` | Trust + Horizontal + Platform Surface wrapping the business layer |

### `docs/handbook/` diagrams (inherited from Phase 1)

| Diagram | Type | Location |
| --- | --- | --- |
| Development Workflow | `flowchart` | [00_MASTER_PLAN.md](../handbook/00_MASTER_PLAN.md) — Section 10 |
| Platform Foundation Timeline | `timeline` | [09_COMMIT_HISTORY.md](../handbook/09_COMMIT_HISTORY.md) |
| Package Distribution by Category | `pie` | [08_PROJECT_STATUS.md](../handbook/08_PROJECT_STATUS.md) — Section 14 |

### Contribution Policy

When a new diagram is added to any document under `docs/diagrams/` or `docs/handbook/`, add a new row here pointing to its location instead of duplicating the diagram in this file — the single source of truth for each diagram is the document that contains it. For full per-package detail, see `docs/architecture/PACKAGE_CATALOG.md`.

---

## Related Documents

- [AI_PROJECT_CONTEXT](../AI_PROJECT_CONTEXT.md)
- [ARCHITECTURE_AUDIT](../certification/ARCHITECTURE_AUDIT.md)
- [DEPENDENCY_AUDIT](../certification/DEPENDENCY_AUDIT.md)
- [RUNTIME_AUDIT](../certification/RUNTIME_AUDIT.md)
- [INTEGRATION_AUDIT](../certification/INTEGRATION_AUDIT.md)
- [00_MASTER_PLAN](../handbook/00_MASTER_PLAN.md)
- [08_PROJECT_STATUS](../handbook/08_PROJECT_STATUS.md)
- [09_COMMIT_HISTORY](../handbook/09_COMMIT_HISTORY.md)

## Related Engines

All 39 `packages/*`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (Enterprise Platform Certification & Stabilization) and the subsequent documentation sprint.
