---
title: Analytics Engine
title_ar: محرك التحليلات
version: 1.0.0
status: active
package: "@lateen-os/analytics-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
related_packages:
  - ai-compliance-engine
  - ai-governance-engine
  - ai-security-engine
  - ai-workforce
  - business-dna
  - communication-hub
  - crm-engine
  - decision-engine
  - domain-graph
  - institutional-memory
  - intelligence-engine
  - marketing-engine
  - sales-engine
  - workflow-engine
  - admin-console
  - api-gateway
  - customer-success-engine
  - document-management-engine
  - finance-engine
  - hr-engine
  - inventory-engine
  - marketplace
  - observability-engine
  - project-management-engine
---

# العربية

## محرك التحليلات (Analytics Engine)

### 1. الغرض

`analytics-engine` هو منصة التحليلات وذكاء الأعمال في Lateen OS — أوسع محرك من حيث عدد الاعتماديات على مستوى المنصة بأكملها (15 اعتمادية `@lateen-os/*`)، يُجمِّع مؤشرات الأداء الرئيسية ولوحات القيادة التنفيذية عبر الإيرادات، المبيعات، التسويق، الاتصال، سير العمل، الأمن، الحوكمة، والامتثال.

### 2. المسؤوليات

- محرك مؤشرات الأداء الرئيسية (`KpiEngine`) ومحرك المقاييس (`MetricsEngine`).
- لوحة القيادة التنفيذية (`DashboardEngine`).
- محرك الاتجاهات (`TrendEngine`) ومحرك التجميع (`AggregationEngine`).
- 8 محركات تحليلات فئوية، كل واحد مُركَّب مع منفذ استعلام حقيقي لحزمة شقيقة خاصة به: الإيرادات (مع `sales`/`crm`)، المبيعات (مع `sales`)، التسويق (مع `marketing`)، الاتصال (مع `communicationHub`)، سير العمل (مع `workflow`)، الأمن (مع `aiSecurity`)، الحوكمة (مع `aiGovernance`)، الامتثال (مع `aiCompliance`).
- محرك التقارير (`ReportEngine`).
- طبقة العلاقات الخاصة بالستة أشقاء المتبقين (الذاكرة المؤسسية، الرسم العلائقي، محرك القرار، محرك الذكاء، القوى العاملة، Business DNA)، طبقة الاستعلام، وناقل الأحداث.

### 3. خارج نطاق المسؤولية

- لا تُنشئ بيانات الأعمال الأصلية — تقرأ فقط عبر منافذ `Pick` ضيقة من كل حزمة شقيقة.
- لا تستدعي أي نموذج لغة كبير.
- لا تُنفِّذ أي منطق فرض سياسة (أمن/حوكمة/امتثال) — تعرض فقط بيانات تحليلية عنه.

### 4. وقت التشغيل العام

جذر التركيب الحقيقي هو `createAnalyticsRuntime(deps: AnalyticsRuntimeDeps = {})` في `runtime.ts`، ويُعيد `AnalyticsRuntime`:
`{ kpis, metrics, dashboards, trends, aggregation, revenueAnalytics, salesAnalytics, marketingAnalytics, communicationAnalytics, workflowAnalytics, securityAnalytics, governanceAnalytics, complianceAnalytics, reports, relationships, queries, events }`.

### 5. الاستعلامات العامة

`AnalyticsQueries`: `findDashboards`، `findKPIs`، `findMetrics`، `findReports`، `findRevenueAnalytics`، `findMarketingAnalytics`، `findSalesAnalytics`، `findWorkflowAnalytics`، `findSecurityAnalytics`، `findComplianceAnalytics`، `searchAnalytics` (11 طريقة).

### 6. الأحداث المكتوبة النوع

`ANALYTICS_EVENT_NAMES` (8 أحداث): `dashboard.created`/`updated`، `metric.calculated`، `kpi.updated`، `report.generated`، `trend.updated`، `aggregation.completed`، `analytics.snapshot.created`.

### 7. الاعتماديات

من `package.json`: `ai-compliance-engine`، `ai-governance-engine`، `ai-security-engine`، `ai-workforce`، `business-dna`، `communication-hub`، `crm-engine`، `decision-engine`، `domain-graph`، `institutional-memory`، `intelligence-engine`، `marketing-engine`، `sales-engine`، `shared-kernel`، `workflow-engine` (15 اعتمادية — أوسع محرك اعتماديات في المنصة).

### 8. الحزم المعتمِدة

`admin-console`، `api-gateway`، `customer-success-engine`، `document-management-engine`، `finance-engine`، `hr-engine`، `inventory-engine`، `marketplace`، `observability-engine`، `project-management-engine`.

### 9. نقاط التكامل

`relationship-management/types.ts` يُعرِّف 6 متعاونين يخصّ هذه الطبقة تحديدًا: `institutionalMemory: Pick<KnowledgeRuntimeQueries,'findKnowledge'>`، `domainGraph: Pick<DomainGraphQueries,'graphStatistics'>`، `decisionEngine: Pick<DecisionQueries,'findPendingApprovals'>`، `intelligenceEngine: Pick<IntelligenceQueries,'findBusinessOpportunities'>`، `aiWorkforce: Pick<WorkforceQueries,'findWorkers'>`، `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`. تعليق الكود يوثِّق صراحةً أن الثماني محركات الفئوية الأخرى (إيرادات/مبيعات/تسويق/اتصال/سير عمل/أمن/حوكمة/امتثال) تدمج مع أشقائها **مباشرة** (وليس عبر هذه الطبقة)، وأن `institutionalMemory` مُنمَّط عمدًا كـ `KnowledgeRuntimeQueries` وليس `MemoryQueries` لأن الأول هو ما يُعيده فعليًا `createInstitutionalMemoryRuntime().queries`.

### 10. ملاحظات معمارية

نمط تكامل مزدوج مقصود وموثَّق: طبقة علاقات مركزية لستة أشقاء، وثماني تكاملات فئوية مباشرة داخل كل محرك تحليلات فرعي. أعلى محرك اعتماديات في المنصة (15) وأدنى عدد حزم تابعة (1 فقط ضمن نطاق المرحلة الأولى الأصلي) — أي أنه "ورقة" في الرسم البياني حسب `08_PROJECT_STATUS.md` §17.

### 11. قرارات التصميم

- ساعة حقن (`now`) افتراضية `nowIso`، وناقل أحداث افتراضي `createAnalyticsEventBus()`.
- كل محرك تحليلات فئوي يمتلك مستودعه الخاص المستقل (13 مستودعًا إجمالًا)، ولا يُشارك مستودعًا مع محرك آخر.

### 12. نقاط التوسعة

أي حزمة عمل جديدة تحتاج تحليلات عنها تُدمَج عبر إضافة محرك تحليلات فئوي جديد مخصص لها (باتباع نمط الثمانية الموجودة) — لا تعديل للمحركات الفئوية الحالية لخدمة نطاق جديد.

### 13. المحركات ذات الصلة

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [ai-workforce](./ai-workforce.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [crm-engine](./crm-engine.md) · [decision-engine](./decision-engine.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [intelligence-engine](./intelligence-engine.md) · [marketing-engine](./marketing-engine.md) · [sales-engine](./sales-engine.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [api-gateway](./api-gateway.md) · [customer-success-engine](./customer-success-engine.md) · [document-management-engine](./document-management-engine.md) · [finance-engine](./finance-engine.md) · [hr-engine](./hr-engine.md) · [inventory-engine](./inventory-engine.md) · [marketplace](./marketplace.md) · [observability-engine](./observability-engine.md) · [project-management-engine](./project-management-engine.md)

---

# English

## Analytics Engine

### 1. Purpose

`analytics-engine` is Lateen OS's analytics and business-intelligence platform — the widest-dependency engine on the entire platform (15 `@lateen-os/*` dependencies), aggregating KPIs and executive dashboards across revenue, sales, marketing, communication, workflow, security, governance, and compliance.

### 2. Responsibilities

- The KPI engine (`KpiEngine`) and the metrics engine (`MetricsEngine`).
- The executive dashboard (`DashboardEngine`).
- The trend engine (`TrendEngine`) and the aggregation engine (`AggregationEngine`).
- 8 category analytics engines, each composed with a real query port of its own sibling package: revenue (with `sales`/`crm`), sales (with `sales`), marketing (with `marketing`), communication (with `communicationHub`), workflow (with `workflow`), security (with `aiSecurity`), governance (with `aiGovernance`), compliance (with `aiCompliance`).
- The report engine (`ReportEngine`).
- The Relationship Layer for the remaining six siblings (Institutional Memory, Domain Graph, Decision Engine, Intelligence Engine, AI Workforce, Business DNA), the query layer, and the event bus.

### 3. Non-responsibilities

- Does not originate business data — it only reads through narrow `Pick` ports from each sibling package.
- Never calls an LLM.
- Does not enforce any policy logic (security/governance/compliance) itself — it only surfaces analytical data about it.

### 4. Public Runtime

The real composition root is `createAnalyticsRuntime(deps: AnalyticsRuntimeDeps = {})` in `runtime.ts`, returning `AnalyticsRuntime`:
`{ kpis, metrics, dashboards, trends, aggregation, revenueAnalytics, salesAnalytics, marketingAnalytics, communicationAnalytics, workflowAnalytics, securityAnalytics, governanceAnalytics, complianceAnalytics, reports, relationships, queries, events }`.

### 5. Public Queries

`AnalyticsQueries`: `findDashboards`, `findKPIs`, `findMetrics`, `findReports`, `findRevenueAnalytics`, `findMarketingAnalytics`, `findSalesAnalytics`, `findWorkflowAnalytics`, `findSecurityAnalytics`, `findComplianceAnalytics`, `searchAnalytics` (11 methods).

### 6. Typed Events

`ANALYTICS_EVENT_NAMES` (8 events): `dashboard.created`/`updated`, `metric.calculated`, `kpi.updated`, `report.generated`, `trend.updated`, `aggregation.completed`, `analytics.snapshot.created`.

### 7. Dependencies

From `package.json`: `ai-compliance-engine`, `ai-governance-engine`, `ai-security-engine`, `ai-workforce`, `business-dna`, `communication-hub`, `crm-engine`, `decision-engine`, `domain-graph`, `institutional-memory`, `intelligence-engine`, `marketing-engine`, `sales-engine`, `shared-kernel`, `workflow-engine` (15 dependencies — the widest-dependency engine on the platform).

### 8. Dependents

`admin-console`, `api-gateway`, `customer-success-engine`, `document-management-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `marketplace`, `observability-engine`, `project-management-engine`.

### 9. Integration Points

`relationship-management/types.ts` defines 6 collaborators specific to this layer: `institutionalMemory: Pick<KnowledgeRuntimeQueries,'findKnowledge'>`, `domainGraph: Pick<DomainGraphQueries,'graphStatistics'>`, `decisionEngine: Pick<DecisionQueries,'findPendingApprovals'>`, `intelligenceEngine: Pick<IntelligenceQueries,'findBusinessOpportunities'>`, `aiWorkforce: Pick<WorkforceQueries,'findWorkers'>`, `businessDna: Pick<BusinessDnaRuntime,'businessProfile'>`. The code comment explicitly documents that the other 8 category engines (revenue/sales/marketing/communication/workflow/security/governance/compliance) integrate their own siblings **directly** (not through this layer), and that `institutionalMemory` is deliberately typed as `KnowledgeRuntimeQueries` rather than `MemoryQueries` because the former is what `createInstitutionalMemoryRuntime().queries` actually returns.

### 10. Architecture Notes

A deliberate, documented dual integration pattern: one centralized Relationship Layer for six siblings, plus 8 direct category-level integrations inside each sub-engine. The platform's widest-dependency engine (15) with the fewest dependents (1, within the original Phase-1 scope) — a "leaf" in the graph per `08_PROJECT_STATUS.md` §17.

### 11. Design Decisions

- An injectable clock (`now`), defaulting to `nowIso`, and a default event bus, `createAnalyticsEventBus()`.
- Each category analytics engine owns its own independent repository (13 repositories total), never sharing one with another engine.

### 12. Extension Points

Any new business-capability package needing analytics about itself is integrated by adding a new dedicated category analytics engine (following the pattern of the existing 8) — never by modifying the existing category engines to serve a new domain.

### 13. Related Engines

[ai-compliance-engine](./ai-compliance-engine.md) · [ai-governance-engine](./ai-governance-engine.md) · [ai-security-engine](./ai-security-engine.md) · [ai-workforce](./ai-workforce.md) · [business-dna](./business-dna.md) · [communication-hub](./communication-hub.md) · [crm-engine](./crm-engine.md) · [decision-engine](./decision-engine.md) · [domain-graph](./domain-graph.md) · [institutional-memory](./institutional-memory.md) · [intelligence-engine](./intelligence-engine.md) · [marketing-engine](./marketing-engine.md) · [sales-engine](./sales-engine.md) · [workflow-engine](./workflow-engine.md) · [admin-console](./admin-console.md) · [api-gateway](./api-gateway.md) · [customer-success-engine](./customer-success-engine.md) · [document-management-engine](./document-management-engine.md) · [finance-engine](./finance-engine.md) · [hr-engine](./hr-engine.md) · [inventory-engine](./inventory-engine.md) · [marketplace](./marketplace.md) · [observability-engine](./observability-engine.md) · [project-management-engine](./project-management-engine.md)
