---
title: Relationship Model
title_ar: نموذج العلاقات
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
  - DEPENDENCY_MODEL.md
  - PACKAGE_CATALOG.md
related_engines:
  - ai-governance-engine
  - finance-engine
related_commits:
  - "35"
---

# العربية

## نموذج العلاقات

### 1. اتفاقية `relationship-management/`

وحدة `relationship-management/` (موجودة في 18 من 39 حزمة) هي القائمة الوحيدة الشاملة والمركزية لكل تكامل مع سيبلينج تقوم به الحزمة، بطريقة واحدة بالضبط لكل متعاون — مثل `getCustomerContext()` لـCRM، `notifyAdminEvent()` لـCommunication Hub. كل طريقة:

- تأخذ فقط البيانات البسيطة التي تحتاجها (عادة `organizationId` بالإضافة إلى كائن مدخلات صغير)، أبدًا كيانًا كاملًا من السيبلينج.
- تستدعي بالضبط طريقة عامة واحدة مسمّاة على شريحة السيبلينج المُحقنة — أبدًا وصول ديناميكي، أبدًا انعكاس (reflection).
- تُرجع `null`/`[]` عندما لا يكون ذلك المتعاون الواحد مُحقنًا.

واجهة `RelationshipManagementDeps` تُصنّف كل شريحة متعاون بأضيق نوع ممكن — `Pick<SiblingRuntime, 'الطرق المُستدعاة فعليًا فقط'>` — أبدًا نوع Runtime الكامل للسيبلينج.

### 2. مثال حقيقي مُتحقَّق منه: `ai-governance-engine`

`packages/ai-governance-engine/src/relationship-management/types.ts` (محقّق مباشرة):

```ts
export interface RelationshipManagementDeps {
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent' | 'findRuntimeState'>;
  readonly aiBrain?: { readonly queries: Pick<BrainQueries, 'explainPlan'> };
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
}
```

ست شرائح متعاون، كل واحدة منها مُضيَّقة إلى طريقة أو طريقتين فقط — لا سطح Runtime كامل لأي سيبلينج.

### 3. الحالة الخاصة الموثّقة: `ai-runtime`

بما أن `ai-runtime` لا يملك كائن Runtime موحدًا (انحراف مُصرَّح به، انظر [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md))، فإن كل حزمة تتكامل معه تُصنّف الاعتمادية مباشرة مقابل نوع منفذ الاستعلام الخاص به — `Pick<RuntimeQueries, 'findAgent'>` — نمط موثّق ومتكرر. تحقّقنا منه مباشرة عبر `grep` في أربع حزم:

| الحزمة | التصنيف الفعلي |
| --- | --- |
| `api-gateway` | `Pick<RuntimeQueries, 'findAgent'>` |
| `marketplace` | `Pick<RuntimeQueries, 'findAgent'>` |
| `observability-engine` | `Pick<RuntimeQueries, 'findAgent'>` |
| `ai-governance-engine` | `Pick<RuntimeQueries, 'findAgent' \| 'findRuntimeState'>` (أوسع بطريقة واحدة إضافية، لا يزال ضمن نفس النمط) |

### 4. التغطية الحقيقية (18 من 39)

| الحزمة | السيبلينجز المُدمَجون (محقّقون مباشرة من `relationship-management/types.ts`) |
| --- | --- |
| `admin-console` | api-gateway, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, business-dna, communication-hub, institutional-memory, observability-engine |
| `ai-compliance-engine` | ai-security-engine, business-dna, communication-hub, workflow-engine |
| `ai-governance-engine` | ai-brain, ai-runtime, ai-security-engine, business-dna, communication-hub, workflow-engine |
| `ai-security-engine` | business-dna, communication-hub, workflow-engine, ai-brain |
| `analytics-engine` | business-dna, decision-engine, domain-graph, intelligence-engine, institutional-memory, ai-workforce |
| `api-gateway` | ai-runtime, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, communication-hub, crm-engine, customer-success-engine, finance-engine, hr-engine, inventory-engine, marketing-engine, observability-engine, project-management-engine, sales-engine, workflow-engine |
| `communication-hub` | business-dna, crm-engine, institutional-memory, marketing-engine, sales-engine, ai-workforce, workflow-engine |
| `crm-engine` | domain-graph, institutional-memory |
| `customer-success-engine` | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, project-management-engine, sales-engine |
| `document-management-engine` | analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, institutional-memory, project-management-engine, workflow-engine |
| `finance-engine` | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, sales-engine, workflow-engine |
| `hr-engine` | ai-workforce, analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, workflow-engine |
| `inventory-engine` | analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, sales-engine, workflow-engine |
| `marketing-engine` | business-dna, crm-engine, domain-graph, institutional-memory, sales-engine |
| `marketplace` | admin-console, ai-runtime, analytics-engine, api-gateway, communication-hub, institutional-memory, observability-engine, workflow-engine |
| `observability-engine` | ai-runtime, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, communication-hub, workflow-engine |
| `project-management-engine` | analytics-engine, business-dna, communication-hub, crm-engine, finance-engine, hr-engine, institutional-memory, inventory-engine, workflow-engine |
| `sales-engine` | business-dna, crm-engine, institutional-memory |

### 5. الحزم التسعة بلا طبقة علاقات مركزية رغم تكامل حقيقي (موثّق، غير مُصحَّح)

`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph` — تدمج مع سيبلينجز حقيقيين مباشرة من داخل ملفات `*.impl.ts` لكل نطاق فرعي (أو، في حالة `ai-workforce`، من وحدة `collaboration/` — محقّقة مباشرة، الاسم مختلف لكن الغرض واحد)، بدلًا من مركزتها في `relationship-management/`. لا يمثّل هذا خرقًا للحدود (كل نداء سيبلينج لا يزال يمر عبر سطح Runtime العام للسيبلينج)، لكنه يجعل تدقيق سطح التكامل الكامل لهذه التسع أصعب من غيرها — راجع `docs/certification/ARCHITECTURE_AUDIT.md` F4.

---

# English

## Relationship Model

### 1. The `relationship-management/` Convention

A `relationship-management/` module (present in 18 of 39 packages) is the single, centralized, exhaustive list of every sibling integration a package performs, with exactly one method per collaborator — e.g. `getCustomerContext()` for CRM, `notifyAdminEvent()` for Communication Hub. Each method:

- Takes only the plain data it needs (usually `organizationId` plus a small input object), never a whole aggregate from the sibling.
- Calls exactly one named, public method on the injected sibling slice — never dynamic property access, never reflection.
- Returns `null`/`[]` when that one collaborator was not injected.

A `RelationshipManagementDeps` interface types each collaborator slice as narrowly as possible — `Pick<SiblingRuntime, 'onlyTheMethodsActuallyCalled'>` — never the sibling's whole Runtime type.

### 2. A Real, Verified Example: `ai-governance-engine`

`packages/ai-governance-engine/src/relationship-management/types.ts` (verified directly):

```ts
export interface RelationshipManagementDeps {
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiRuntime?: Pick<RuntimeQueries, 'findAgent' | 'findRuntimeState'>;
  readonly aiBrain?: { readonly queries: Pick<BrainQueries, 'explainPlan'> };
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
}
```

Six collaborator slices, each narrowed to one or two methods only — never a sibling's whole runtime surface.

### 3. The Documented Special Case: `ai-runtime`

Since `ai-runtime` has no unified runtime object (a sanctioned deviation — see [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md)), every package that integrates with it types the dependency directly against its own query-port type — `Pick<RuntimeQueries, 'findAgent'>` — a documented, repeated pattern. Verified directly via grep across four packages:

| Package | Real Typing |
| --- | --- |
| `api-gateway` | `Pick<RuntimeQueries, 'findAgent'>` |
| `marketplace` | `Pick<RuntimeQueries, 'findAgent'>` |
| `observability-engine` | `Pick<RuntimeQueries, 'findAgent'>` |
| `ai-governance-engine` | `Pick<RuntimeQueries, 'findAgent' \| 'findRuntimeState'>` (one method wider, still the same pattern) |

### 4. Real Coverage (18 of 39)

| Package | Integrated Siblings (verified directly from `relationship-management/types.ts`) |
| --- | --- |
| `admin-console` | api-gateway, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, business-dna, communication-hub, institutional-memory, observability-engine |
| `ai-compliance-engine` | ai-security-engine, business-dna, communication-hub, workflow-engine |
| `ai-governance-engine` | ai-brain, ai-runtime, ai-security-engine, business-dna, communication-hub, workflow-engine |
| `ai-security-engine` | business-dna, communication-hub, workflow-engine, ai-brain |
| `analytics-engine` | business-dna, decision-engine, domain-graph, intelligence-engine, institutional-memory, ai-workforce |
| `api-gateway` | ai-runtime, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, communication-hub, crm-engine, customer-success-engine, finance-engine, hr-engine, inventory-engine, marketing-engine, observability-engine, project-management-engine, sales-engine, workflow-engine |
| `communication-hub` | business-dna, crm-engine, institutional-memory, marketing-engine, sales-engine, ai-workforce, workflow-engine |
| `crm-engine` | domain-graph, institutional-memory |
| `customer-success-engine` | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, project-management-engine, sales-engine |
| `document-management-engine` | analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, institutional-memory, project-management-engine, workflow-engine |
| `finance-engine` | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, sales-engine, workflow-engine |
| `hr-engine` | ai-workforce, analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, workflow-engine |
| `inventory-engine` | analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, sales-engine, workflow-engine |
| `marketing-engine` | business-dna, crm-engine, domain-graph, institutional-memory, sales-engine |
| `marketplace` | admin-console, ai-runtime, analytics-engine, api-gateway, communication-hub, institutional-memory, observability-engine, workflow-engine |
| `observability-engine` | ai-runtime, ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, communication-hub, workflow-engine |
| `project-management-engine` | analytics-engine, business-dna, communication-hub, crm-engine, finance-engine, hr-engine, institutional-memory, inventory-engine, workflow-engine |
| `sales-engine` | business-dna, crm-engine, institutional-memory |

### 5. The Nine Packages Without a Centralized Relationship Layer Despite Real Integration (Documented, Not Fixed)

`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph` — integrate with real siblings directly from within each subdomain's `*.impl.ts` file (or, for `ai-workforce`, from a `collaboration/` module — verified directly, a different name for the same purpose), instead of centralizing it in `relationship-management/`. This is not a boundary violation (every sibling call still goes through the sibling's own public runtime surface), but it makes these nine packages' full integration surface harder to audit at a glance — see `docs/certification/ARCHITECTURE_AUDIT.md` F4.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/ARCHITECTURE_AUDIT.md](../certification/ARCHITECTURE_AUDIT.md)
- [../certification/INTEGRATION_AUDIT.md](../certification/INTEGRATION_AUDIT.md)
- [DEPENDENCY_MODEL.md](./DEPENDENCY_MODEL.md)
- [PACKAGE_CATALOG.md](./PACKAGE_CATALOG.md)

## Related Engines

`ai-governance-engine`, `finance-engine` (worked examples); the relationship-layer convention applies to 18 of 39 `packages/*`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
