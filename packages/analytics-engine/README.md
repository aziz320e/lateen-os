# @lateen-os/analytics-engine

Analytics & Business Intelligence Platform — KPIs, metrics, executive dashboards, revenue/sales/marketing/communication/workflow/security/governance/compliance analytics, trends, aggregation, and reporting for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Analytics Platform is the canonical business-intelligence layer for Lateen OS: it owns the KPI Engine, the Metrics Engine, the Executive Dashboard, the Trend Engine, the Aggregation Engine, the Report Engine, and 8 category analytics engines (Revenue, Sales, Marketing, Communication, Workflow, Security, Governance, Compliance) — and is the package that reads from CRM Engine, Sales Engine, Marketing Engine, Communication Hub, Business DNA, Institutional Memory, Domain Graph, Workflow Engine, AI Workforce, Decision Engine, Intelligence Engine, AI Security Engine, AI Governance Engine, and AI Compliance Engine, exclusively through each package's public API. This package produces read-only intelligence — it never writes back to any integrated engine.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every KPI, metric, trend, and analytics figure is a fixed formula over real data)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createAnalyticsRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| KPI Engine | `kpi` | 12 deterministic KPIs — revenue, pipeline value, conversion rate, win rate, average deal size, CAC, CLV, marketing ROI, campaign performance, response time, workflow completion, workforce utilization |
| Metrics Engine | `metrics` | Counters, gauges, ratios, percentages, trends, moving averages, rolling averages |
| Executive Dashboard | `dashboard` | 7 configurable dashboard types — CEO, Sales, Marketing, Operations, Security, Governance, Compliance |
| Revenue Analytics | `revenue-analytics` | MRR, ARR, monthly/quarterly/yearly revenue, growth, revenue by product, revenue by market — real Sales Engine + CRM Engine integration |
| Sales Analytics | `sales-analytics` | Pipeline value, conversion funnel, stage duration, close rate, sales velocity — real Sales Engine integration |
| Marketing Analytics | `marketing-analytics` | CPL, CAC, ROI, campaign effectiveness, attribution summary, lead source effectiveness — real Marketing Engine integration |
| Communication Analytics | `communication-analytics` | Message volume, response time, delivery rate, read rate, notification statistics — real Communication Hub integration |
| Workflow Analytics | `workflow-analytics` | Active/completed/failed workflows, average execution time, bottlenecks — real Workflow Engine integration |
| Security Analytics | `security-analytics` | Authentication/authorization failures, threat detections, blocked tools/providers, policy violations — real AI Security Engine integration |
| Governance Analytics | `governance-analytics` | Active policies, pending approvals, governance violations, risk distribution — real AI Governance Engine integration |
| Compliance Analytics | `compliance-analytics` | Compliance score, passed/failed controls, remediation progress, framework coverage — real AI Compliance Engine integration |
| Trend Engine | `trend` | Deterministic day/week/month/quarter/year bucketing and trend direction |
| Aggregation Engine | `aggregation` | Generic group-by, filter, rollup, drill-down, and comparison over any record set |
| Report Engine | `report` | Deterministic PDF/CSV/JSON report models — metadata only, no real file generation |
| Relationship Layer | `relationship-management` | Integrates Institutional Memory, Domain Graph, Decision Engine, Intelligence Engine, AI Workforce, and Business DNA — see below |
| Query Layer | `queries` | Real, read-only `AnalyticsQueries` port — `findDashboards` / `findKPIs` / `findMetrics` / `findReports` / `findRevenueAnalytics` / `findMarketingAnalytics` / `findSalesAnalytics` / `findWorkflowAnalytics` / `findSecurityAnalytics` / `findComplianceAnalytics` / `searchAnalytics` |
| Event Bus | `events` | Typed `AnalyticsEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with all 14 required packages

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Integration is distributed across the module that naturally owns it:

- **CRM Engine**, **Sales Engine** — Revenue Analytics (`findAccounts`, `findOpportunities`, `findQuotes`)
- **Sales Engine** — Sales Analytics (`findPipeline`, `findOpportunities`)
- **Marketing Engine** — Marketing Analytics (`findMetrics`, `findLeads`)
- **Communication Hub** — Communication Analytics (`findMessages`, `findNotifications`)
- **Workflow Engine** — Workflow Analytics (`findRunningWorkflows`, `findWaitingTasks`)
- **AI Security Engine** — Security Analytics (`findViolations`, `findThreats`)
- **AI Governance Engine** — Governance Analytics (`findPolicies`, `findApprovals`, `findGovernanceEvents`, `findRisks`)
- **AI Compliance Engine** — Compliance Analytics (`findComplianceStatus`, `findAssessments`, `findRemediations`, `findFrameworks`)
- **Institutional Memory**, **Domain Graph**, **Decision Engine**, **Intelligence Engine**, **AI Workforce**, **Business DNA** — the Relationship Layer (`relationship-management`)

Every optional collaborator degrades to a documented no-op (`null`, `0`, or an empty collection) when not injected, so the Analytics Platform is fully usable — and fully tested — completely offline.

## Event bus

`AnalyticsEventMap` declares the 8 required events, each genuinely published by the real service that causes it:

`dashboard.created`, `dashboard.updated`, `metric.calculated`, `kpi.updated`, `report.generated`, `trend.updated`, `aggregation.completed`, `analytics.snapshot.created`.

## Usage

```typescript
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';

const runtime = createAnalyticsRuntime();

const dashboard = await runtime.dashboards.create('org-1', {
  dashboardType: 'ceo',
  name: 'CEO Overview',
  widgets: [{ label: 'Revenue', kpiType: 'revenue' }],
});

const kpi = await runtime.kpis.recordRevenue('org-1', { value: 125_000 });
const trend = await runtime.trends.computeTrend('org-1', {
  granularity: 'month',
  points: [{ timestamp: '2026-01-15T00:00:00.000Z', value: 100 }, { timestamp: '2026-02-15T00:00:00.000Z', value: 140 }],
});
```

Wiring in the real, integrated collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';

const sales = createSalesRuntime();

const runtime = createAnalyticsRuntime({
  sales,
  crm: createCrmRuntime(),
  marketing: createMarketingRuntime(),
  communicationHub: createCommunicationRuntime(),
  workflow: createWorkflowRuntime(),
  aiSecurity: createSecurityRuntime(),
  aiGovernance: createGovernanceRuntime(),
  aiCompliance: createComplianceRuntime(),
});

const revenueSnapshot = await runtime.revenueAnalytics.computeSnapshot('org-1');
const salesSnapshot = await runtime.salesAnalytics.computeSnapshot('org-1');
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('kpi.updated', (payload) => {
  console.log(`KPI ${payload.kpiType} updated to ${payload.value}`);
});
```

## Structure

```
src/
├── shared/                     # IDs (reusing Business DNA's), primitives, id.ts helpers
├── kpi/                           # KPI Engine — 12 deterministic KPIs
├── metrics/                         # Metrics Engine — counters/gauges/ratios/percentages/averages
├── dashboard/                          # Executive Dashboard — 7 configurable dashboard types
├── trend/                                 # Trend Engine — day/week/month/quarter/year bucketing
├── aggregation/                              # Aggregation Engine — group-by/filter/rollup/drill-down
├── revenue-analytics/                           # Real CRM Engine + Sales Engine integration
├── sales-analytics/                                # Real Sales Engine integration
├── marketing-analytics/                               # Real Marketing Engine integration
├── communication-analytics/                              # Real Communication Hub integration
├── workflow-analytics/                                      # Real Workflow Engine integration
├── security-analytics/                                         # Real AI Security Engine integration
├── governance-analytics/                                          # Real AI Governance Engine integration
├── compliance-analytics/                                             # Real AI Compliance Engine integration
├── report/                                                              # Report Engine — PDF/CSV/JSON models
├── relationship-management/                                               # Institutional Memory / Domain Graph / Decision Engine / Intelligence Engine / AI Workforce / Business DNA
├── queries/                                                                   # Real AnalyticsQueries read layer
├── events/                                                                       # Typed AnalyticsEventMap
├── runtime.ts                                                                       # createAnalyticsRuntime() composition root
└── index.ts
```

See [ANALYTICS_MODEL.md](./ANALYTICS_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId`; optional Revenue Analytics and Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Revenue Analytics collaborator
- `@lateen-os/sales-engine` — optional Revenue Analytics and Sales Analytics collaborator
- `@lateen-os/marketing-engine` — optional Marketing Analytics collaborator
- `@lateen-os/communication-hub` — optional Communication Analytics collaborator
- `@lateen-os/workflow-engine` — optional Workflow Analytics collaborator
- `@lateen-os/ai-security-engine` — optional Security Analytics collaborator
- `@lateen-os/ai-governance-engine` — optional Governance Analytics collaborator
- `@lateen-os/ai-compliance-engine` — optional Compliance Analytics collaborator
- `@lateen-os/institutional-memory`, `@lateen-os/domain-graph`, `@lateen-os/decision-engine`, `@lateen-os/intelligence-engine`, `@lateen-os/ai-workforce` — optional Relationship Layer collaborators

## Verification

```bash
pnpm --filter @lateen-os/analytics-engine build
pnpm --filter @lateen-os/analytics-engine typecheck
pnpm --filter @lateen-os/analytics-engine test
pnpm --filter @lateen-os/analytics-engine lint
```
