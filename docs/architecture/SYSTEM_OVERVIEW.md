---
title: System Overview
title_ar: نظرة عامة على النظام
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/00_MASTER_PLAN.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/PLATFORM_CERTIFICATION.md
  - LAYERED_ARCHITECTURE.md
  - PACKAGE_MAP.md
related_engines:
  - all
related_commits:
  - "35"
---

# العربية

## نظرة عامة على النظام

### 1. ما هو Lateen OS

Lateen OS هو **نظام تشغيل أعمال أصيل الذكاء الاصطناعي (AI-native Business Operating System)** — ليس تطبيقًا واحدًا، بل منصة متعددة الطبقات من حزم TypeScript حقيقية وحتمية ومستقلة، تُشكّل معًا نموذجًا لمؤسسة كاملة: حمضها النووي التجاري (Business DNA)، ذاكرتها المؤسسية، استدلالها، قراراتها، فريق عملها الرقمي (AI Workforce)، وعملياتها التجارية (CRM، المبيعات، التسويق، المالية، الموارد البشرية، المخزون، المشاريع، نجاح العملاء، المستندات)، ملفوفة بطبقة ثقة (أمن، حوكمة، امتثال) وطبقة تشغيلية (تحليلات، مراقبة)، ومكشوفة للعالم الخارجي عبر بوابة API، وتُدار عبر لوحة إدارة، وقابلة للتوسّع عبر سوق تطبيقات.

المستودع يضم **39 حزمة حقيقية** تحت `packages/*` (راجع [PACKAGE_MAP](./PACKAGE_MAP.md) للقائمة الكاملة)، بالإضافة إلى `apps/*` (واجهات Next.js)، و`services/*` (أغلفة خدمات قابلة للنشر)، و`workflows/*`، و`extensions/*` (تكاملات طرف ثالث حقيقية).

### 2. المبدأ التأسيسي: الذكاء الاصطناعي يوصي، محرك القرار يقرر

المصدر المرجعي لهذا المبدأ هو `docs/handbook/00_MASTER_PLAN.md`: **الذكاء الاصطناعي يُنتج توصيات؛ محرك القرار (Decision Engine) هو الجهة الوحيدة المخوّلة لتحويل التوصية إلى قرار تنفيذي.** هذا الفصل بين "التفكير" و"القرار" هو ما يجعل النظام قابلًا للتدقيق، والحوكمة، والامتثال على مستوى المؤسسة. أي حزمة تحمل "AI" في اسمها (`ai-runtime`, `ai-brain`, `ai-security-engine`...) تُنتج توصيات أو تُحلل بيانات — لا تتخذ قرارات تنفيذية نيابة عن `decision-engine`.

### 3. البنية الطبقية

المنصة مبنية كطبقات متتالية تتجه فيها الاعتماديات دائمًا نحو الأسفل (انظر [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md) للتفصيل الكامل):

1. **الأساس (Foundation)** — `shared-kernel`، الطبقة صفر، بلا أي اعتمادية.
2. **تجريد نماذج اللغة** — `ai-provider-hub`، البوابة الوحيدة لأي استدعاء LLM.
3. **مكدّس الاستدلال (Reasoning Stack)** — `decision-engine` → `intelligence-engine` → `ai-runtime` → `ai-brain` → `ceo-engine`.
4. **التنسيق / العمل الرقمي** — `workflow-engine`، `multi-agent`، `ai-workforce`.
5. **البنية التحتية النطاقية** — `business-dna`، `institutional-memory`، `domain-graph`، `capability-engine`.
6. **محركات الأعمال** — `crm-engine`، `sales-engine`، `marketing-engine`، `communication-hub`، `finance-engine`، `hr-engine`، `inventory-engine`، `project-management-engine`، `customer-success-engine`، `document-management-engine`.
7. **طبقة الثقة** — `ai-security-engine`، `ai-governance-engine`، `ai-compliance-engine`.
8. **أفقي / تشغيلي** — `analytics-engine`، `observability-engine`.
9. **سطح المنصة** — `api-gateway`، `admin-console`، `marketplace` (`@lateen-os/marketplace-engine`).
10. **سطح المطوّر / البنية التحتية** — `sdk`، `kernel`، `extension-system`، `connector-base`، `integration-contracts`، `typescript-config`، `integration-tests`.

### 4. كيف تستهلك `apps/*`/`services/*`/`workflows/*`/`extensions/*` طبقة `packages/*`

`packages/*` هي طبقة المحركات (engines) — الحقيقة القانونية الوحيدة للمنطق التجاري والاستدلال. أما `apps/*` (تطبيقات Next.js، بما فيها `apps/marketplace` — واجهة توزيع الإضافات المميزة عن `packages/marketplace` الذي هو المحرك الخلفي)، و`services/*` (أغلفة نشر قابلة للتوزيع، مثل `@lateen-os/marketplace-service` و`@lateen-os/api-gateway-service`)، و`workflows/*`، و`extensions/*` (تكاملات Slack وStripe وShopify الحقيقية) فهي جميعًا **مستهلكات**، لا محركات — تستدعي السطح العام لمحرك أو أكثر عبر `createXRuntime()` (أو ما يعادلها) دون الوصول إلى أي مستودع أو وحدة داخلية. هذه الطبقات خارج نطاق انضباط بناء `packages/*` الموصوف في هذا المستند، لكنها تلتزم بنفس قاعدة "لا وصول إلا عبر السطح العام".

### 5. لماذا هذا يهم

الفصل الصارم بين المحركات (packages) والمستهلكات (apps/services/workflows/extensions)، إلى جانب مبدأ "التوصية مقابل القرار"، هو ما يمنح Lateen OS قابلية التدقيق (كل قرار له مسار استدلال قابل للتفسير)، والحوكمة (كل قرار حسّاس يمر عبر `ai-governance-engine`)، والامتثال (كل إطار امتثال يُدار مركزيًا عبر `ai-compliance-engine`) في آن واحد — دون الحاجة لإعادة بناء الأساس عند إضافة نطاق عمل جديد.

---

# English

## System Overview

### 1. What Lateen OS Is

Lateen OS is an **AI-native Business Operating System** — not a single application, but a layered platform of real, deterministic, independent TypeScript packages that together model an entire enterprise: its business DNA, its institutional memory, its reasoning, its decisions, its digital workforce (AI Workforce), and its business-domain operations (CRM, sales, marketing, finance, HR, inventory, projects, customer success, documents), wrapped in a trust layer (security, governance, compliance) and an operational layer (analytics, observability), and finally exposed to the outside world through an API Gateway, administered through an Admin Console, and extensible through a Marketplace.

The repository holds **39 real packages** under `packages/*` (see [PACKAGE_MAP](./PACKAGE_MAP.md) for the full list), plus `apps/*` (Next.js frontends), `services/*` (deployable service wrappers), `workflows/*`, and `extensions/*` (real third-party connector integrations).

### 2. The Founding Principle: AI Recommends, the Decision Engine Decides

The canonical source for this principle is `docs/handbook/00_MASTER_PLAN.md`: **AI produces recommendations; the Decision Engine is the only party authorized to turn a recommendation into an executed decision.** This separation of "thinking" from "deciding" is what makes the platform auditable, governable, and compliant at enterprise scale. Any package with "AI" in its name (`ai-runtime`, `ai-brain`, `ai-security-engine`, ...) produces recommendations or analyzes data — it never executes a decision on `decision-engine`'s behalf.

### 3. The Layered Structure

The platform is built as successive layers where dependencies always flow downward (full detail in [LAYERED_ARCHITECTURE](./LAYERED_ARCHITECTURE.md)):

1. **Foundation** — `shared-kernel`, Layer Zero, depends on nothing.
2. **LLM abstraction** — `ai-provider-hub`, the sole gateway for any LLM call.
3. **Reasoning stack** — `decision-engine` → `intelligence-engine` → `ai-runtime` → `ai-brain` → `ceo-engine`.
4. **Coordination / digital labor** — `workflow-engine`, `multi-agent`, `ai-workforce`.
5. **Domain infrastructure** — `business-dna`, `institutional-memory`, `domain-graph`, `capability-engine`.
6. **Business engines** — `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`.
7. **Trust layer** — `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`.
8. **Horizontal / operational** — `analytics-engine`, `observability-engine`.
9. **Platform surface** — `api-gateway`, `admin-console`, `marketplace` (`@lateen-os/marketplace-engine`).
10. **Developer surface / platform infra** — `sdk`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests`.

### 4. How `apps/*`/`services/*`/`workflows/*`/`extensions/*` Consume `packages/*`

`packages/*` is the engine layer — the single legal source of truth for business logic and reasoning. `apps/*` (Next.js frontends, including `apps/marketplace` — the extension-distribution UI, distinct from the backend engine at `packages/marketplace`), `services/*` (deployable wrappers such as `@lateen-os/marketplace-service` and `@lateen-os/api-gateway-service`), `workflows/*`, and `extensions/*` (real Slack, Stripe, Shopify integrations) are all **consumers**, never engines — they call a package's public surface via `createXRuntime()` (or its documented equivalent), never a repository or internal module. These layers are out of scope for the `packages/*` construction discipline described in this document, but they follow the same "public-surface-only" access rule.

### 5. Why This Matters

The strict separation between engines (`packages/*`) and consumers (`apps/services/workflows/extensions`), combined with the "recommend vs. decide" principle, is what gives Lateen OS auditability (every decision has an explainable reasoning trail), governance (every sensitive decision flows through `ai-governance-engine`), and compliance (every compliance framework is managed centrally through `ai-compliance-engine`) simultaneously — without needing to rebuild the foundation each time a new business domain is added.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/00_MASTER_PLAN.md](../handbook/00_MASTER_PLAN.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/PLATFORM_CERTIFICATION.md](../certification/PLATFORM_CERTIFICATION.md)
- [LAYERED_ARCHITECTURE.md](./LAYERED_ARCHITECTURE.md)
- [PACKAGE_MAP.md](./PACKAGE_MAP.md)

## Related Engines

All 39 `packages/*` engines.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
