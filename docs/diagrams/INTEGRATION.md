---
title: Cross-Package Integration Examples
title_ar: أمثلة التكامل بين الحزم
version: 1.0.0
status: active
phase: "Documentation Sprint — Diagrams (post Commit 35)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/INTEGRATION_AUDIT.md
  - ../../packages/marketplace/ARCHITECTURE.md
  - ../../packages/api-gateway/GATEWAY_MODEL.md
  - ./RELATIONSHIP_FLOW.md
related_engines:
  - marketplace
  - api-gateway
  - workflow-engine
  - ai-runtime
  - crm-engine
related_commits:
  - "35"
---

# العربية

## كيف تتكامل الحزم فعليًا — عبر طبقة العلاقات (Relationship Layer) فقط

القاعدة غير القابلة للتفاوض (`AI_PROJECT_CONTEXT.md` §4، البند 4): **التكامل بين الحزم يمر فقط عبر سطح Runtime العام لحزمة الشقيق**، أبدًا عبر مستودع (repository)، أبدًا عبر وحدة داخلية. الأمثلة الثلاثة أدناه حقيقية ومُتحقَّق منها مباشرة من الكود ومن `INTEGRATION_AUDIT.md`.

### مثال 1 — `api-gateway` يوجّه طلبًا إلى `crm-engine` عبر Runtime Dispatcher

`packages/api-gateway/src/dispatcher/invoker-map.ts`'s `buildInvokerMap()` يربط كل مفتاح `${targetService}:${targetOperation}` بدالة واحدة ثابتة. عندما يُسجَّل `Route` بـ `targetService: 'crm-engine'` و`targetOperation: 'getCustomerContext'`، فإن الاستدعاء الفعلي عند التوجيه هو `relationships.getCustomerContext()` — التي بدورها تستدعي `CrmRuntime.customers.get()` الحقيقية. **لا انعكاس (reflection)، لا استدعاء ديناميكي بالاسم** — جدول ثابت يُفحص وقت الترجمة.

```mermaid
sequenceDiagram
    participant Client
    participant GW as api-gateway Dispatcher
    participant REL as api-gateway relationship-management
    participant CRM as crm-engine (CrmRuntime)

    Client->>GW: طلب على Route (targetService=crm-engine, targetOperation=getCustomerContext)
    GW->>GW: buildInvokerMap() lookup: "crm-engine:getCustomerContext"
    GW->>REL: relationships.getCustomerContext(organizationId, customerId)
    REL->>CRM: crm.customers.get(organizationId, customerId)
    CRM-->>REL: Customer | null
    REL-->>GW: Customer | null
    GW-->>Client: استجابة الـ Route
```

### مثال 2 — `marketplace` يرفع سير عمل موافقة حقيقيًا عبر `workflow-engine`

`packages/marketplace/src/relationship-management/service.impl.ts`'s `raiseExtensionApprovalWorkflow()` تستدعي `workflow.defineWorkflow()` (بذاكرة تخزين مؤقت idempotent لكل `(organizationId, requestType)`) ثم `workflow.startWorkflow()` — وكلاهما استدعاءان حقيقيان على `WorkflowRuntime` العام لحزمة `workflow-engine`، لا أكثر.

```mermaid
sequenceDiagram
    participant EXT as marketplace extension-registry
    participant REL as marketplace relationship-management
    participant WF as workflow-engine (WorkflowRuntime)

    EXT->>REL: raiseExtensionApprovalWorkflow(organizationId, { requestType })
    alt لم يُحقن workflow-engine
        REL-->>EXT: null
    else حُقن workflow-engine
        REL->>WF: defineWorkflow(...) [إن لم يكن معرَّفًا مسبقًا]
        WF-->>REL: WorkflowDefinition
        REL->>WF: startWorkflow({ definitionId, variables })
        WF-->>REL: WorkflowInstance
        REL-->>EXT: { workflowDefinitionId, workflowInstanceId }
    end
```

### مثال 3 — `marketplace` يستعلم عن وكيل حقيقي من `ai-runtime` (حالة خاصة موثّقة)

`ai-runtime` لا يُصدّر `createXRuntime()` موحّدًا (انظر `RUNTIME_AUDIT.md` F3)، لذلك تُكتب اعتمادية `aiRuntime` في `RelationshipManagementDeps` مباشرة كـ `Pick<RuntimeQueries, 'findAgent'>` بدلًا من نوع Runtime كامل — نفس النمط الموثّق المتكرر في كل حزمة تتكامل مع `ai-runtime` عبر المنصة بأكملها.

```mermaid
sequenceDiagram
    participant EXT as marketplace extension-registry
    participant REL as marketplace relationship-management
    participant AIR as ai-runtime RuntimeQueries

    EXT->>REL: getAgentContext(organizationId, runtimeAgentId)
    alt لم تُحقن RuntimeQueries
        REL-->>EXT: null
    else حُقنت
        REL->>AIR: findAgent({ organizationId, runtimeAgentId })
        AIR-->>REL: { agents: Agent[] }
        REL-->>EXT: agents[0] ?? null
    end
```

---

# English

## How packages actually integrate — through the Relationship Layer only

The non-negotiable rule (`AI_PROJECT_CONTEXT.md` §4, item 4): **cross-package integration happens only through a sibling's public runtime surface**, never a repository, never an internal module. The three examples below are real and directly verified against the source and `INTEGRATION_AUDIT.md`.

### Example 1 — `api-gateway` routes a request into `crm-engine` via the Runtime Dispatcher

`packages/api-gateway/src/dispatcher/invoker-map.ts`'s `buildInvokerMap()` binds each `${targetService}:${targetOperation}` key to one fixed function. When a `Route` is registered with `targetService: 'crm-engine'` and `targetOperation: 'getCustomerContext'`, the real call made on dispatch is `relationships.getCustomerContext()` — which in turn calls the real `CrmRuntime.customers.get()`. **No reflection, no string-based dynamic invocation** — a compile-time-checked, fixed table.

```mermaid
sequenceDiagram
    participant Client
    participant GW as api-gateway Dispatcher
    participant REL as api-gateway relationship-management
    participant CRM as crm-engine (CrmRuntime)

    Client->>GW: Request on Route (targetService=crm-engine, targetOperation=getCustomerContext)
    GW->>GW: buildInvokerMap() lookup: "crm-engine:getCustomerContext"
    GW->>REL: relationships.getCustomerContext(organizationId, customerId)
    REL->>CRM: crm.customers.get(organizationId, customerId)
    CRM-->>REL: Customer | null
    REL-->>GW: Customer | null
    GW-->>Client: Route response
```

### Example 2 — `marketplace` genuinely raises an approval workflow via `workflow-engine`

`packages/marketplace/src/relationship-management/service.impl.ts`'s `raiseExtensionApprovalWorkflow()` calls `workflow.defineWorkflow()` (idempotently cached per `(organizationId, requestType)`) then `workflow.startWorkflow()` — both real calls on `workflow-engine`'s public `WorkflowRuntime`, nothing more.

```mermaid
sequenceDiagram
    participant EXT as marketplace extension-registry
    participant REL as marketplace relationship-management
    participant WF as workflow-engine (WorkflowRuntime)

    EXT->>REL: raiseExtensionApprovalWorkflow(organizationId, { requestType })
    alt workflow-engine not injected
        REL-->>EXT: null
    else workflow-engine injected
        REL->>WF: defineWorkflow(...) [if not already defined]
        WF-->>REL: WorkflowDefinition
        REL->>WF: startWorkflow({ definitionId, variables })
        WF-->>REL: WorkflowInstance
        REL-->>EXT: { workflowDefinitionId, workflowInstanceId }
    end
```

### Example 3 — `marketplace` queries a real agent from `ai-runtime` (a documented special case)

`ai-runtime` exposes no unified `createXRuntime()` (see `RUNTIME_AUDIT.md` F3), so the `aiRuntime` dependency in `RelationshipManagementDeps` is typed directly as `Pick<RuntimeQueries, 'findAgent'>` rather than a full Runtime type — the same documented, repeated pattern used by every package across the platform that integrates with `ai-runtime`.

```mermaid
sequenceDiagram
    participant EXT as marketplace extension-registry
    participant REL as marketplace relationship-management
    participant AIR as ai-runtime RuntimeQueries

    EXT->>REL: getAgentContext(organizationId, runtimeAgentId)
    alt RuntimeQueries not injected
        REL-->>EXT: null
    else injected
        REL->>AIR: findAgent({ organizationId, runtimeAgentId })
        AIR-->>REL: { agents: Agent[] }
        REL-->>EXT: agents[0] ?? null
    end
```

---

## Related Documents

- [AI_PROJECT_CONTEXT](../AI_PROJECT_CONTEXT.md)
- [INTEGRATION_AUDIT](../certification/INTEGRATION_AUDIT.md)
- [marketplace ARCHITECTURE](../../packages/marketplace/ARCHITECTURE.md)
- [api-gateway GATEWAY_MODEL](../../packages/api-gateway/GATEWAY_MODEL.md)
- [RELATIONSHIP_FLOW](./RELATIONSHIP_FLOW.md)

## Related Engines

`api-gateway`, `crm-engine`, `marketplace`, `workflow-engine`, `ai-runtime`.

## Related Commits

Commit 35 (`d9616a0` and the certification/documentation sprint that followed it).
