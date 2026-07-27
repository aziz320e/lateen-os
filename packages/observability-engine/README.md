# @lateen-os/observability-engine

Observability Platform — structured logging, metrics, distributed tracing, health, alerting, performance, audit timeline, and snapshots for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Observability Platform is the canonical runtime-visibility layer for Lateen OS: it owns Structured Logging, the Metrics Collector, Distributed Tracing, the Health Engine, the Alert Engine, the Performance Engine, the Audit Timeline, and the Snapshot Engine — and is the package that reads from AI Runtime, Workflow Engine, Communication Hub, AI Security Engine, AI Governance Engine, AI Compliance Engine, and Analytics Engine, exclusively through each package's public API. This package produces read-only visibility — it never writes back to any integrated engine.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every log, metric, trace, alert, and performance figure is a fixed computation over real data)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createObservabilityRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Structured Logging | `logging` | Six levels — trace/debug/info/warn/error/fatal — with structured fields, scopes, categories, and correlation ids |
| Metrics Collector | `metrics` | Counters (cumulative), gauges, histograms, timers, and moving averages |
| Distributed Tracing | `tracing` | Traces and nested spans, with parent/child linkage, duration, and status |
| Health Engine | `health` | Self-reported component health plus real AI Runtime and Workflow Engine dependency health |
| Alert Engine | `alerting` | Deterministic alerts — error threshold, warning threshold, inactivity, health degradation, workflow failures, security events |
| Performance Engine | `performance` | Execution time, queue latency, workflow duration, message throughput, runtime utilization — real AI Runtime, Workflow Engine, and Communication Hub integration |
| Audit Timeline | `audit-timeline` | Aggregates real audit events from Security, Governance, Compliance, Workflow, and Communication into one chronological view |
| Snapshot Engine | `snapshot` | Deterministic snapshots for runtime, workflows, communications, analytics, and security |
| Relationship Layer | `relationship-management` | One additional real signal per integrated package — see below |
| Query Layer | `queries` | Real, read-only `ObservabilityQueries` port — `findLogs` / `findMetrics` / `findTraces` / `findAlerts` / `findSnapshots` / `findHealth` / `findPerformance` / `searchObservability` |
| Event Bus | `events` | Typed `ObservabilityEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with all 7 required packages

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Integration is distributed across the module that naturally owns it:

- **AI Runtime** — Health Engine (`findRuntimeState`), Performance Engine (`findExecutionHistory`, `findTasks`, `findRuntimeState`), Snapshot Engine (`findRuntimeState`), Relationship Layer (`findAgent`)
- **Workflow Engine** — Health Engine (`findRunningWorkflows`), Alert Engine (`findRunningWorkflows`), Performance Engine (`findRunningWorkflows`), Audit Timeline (`findRunningWorkflows`), Snapshot Engine (`findRunningWorkflows`), Relationship Layer (`findWaitingTasks`)
- **Communication Hub** — Performance Engine (`findMessages`), Audit Timeline (`findTimeline`), Snapshot Engine (`findMessages`, `findTimeline`), Relationship Layer (`findNotifications`)
- **AI Security Engine** — Alert Engine (`findViolations`), Audit Timeline (`findViolations`), Snapshot Engine (`findViolations`, `findThreats`), Relationship Layer (`findPolicies`)
- **AI Governance Engine** — Audit Timeline (`findGovernanceEvents`), Relationship Layer (`findApprovals`)
- **AI Compliance Engine** — Audit Timeline (`findAudits`), Relationship Layer (`findFrameworks`)
- **Analytics Engine** — Snapshot Engine (`findKPIs`), Relationship Layer (`findDashboards`)

Every optional collaborator degrades to a documented no-op (`null`, `0`, or an empty collection) when not injected, so the Observability Platform is fully usable — and fully tested — completely offline.

## Event bus

`ObservabilityEventMap` declares the 7 required events, each genuinely published by the real service that causes it:

`log.created`, `metric.updated`, `trace.completed`, `alert.created`, `alert.resolved`, `health.changed`, `snapshot.created`.

## Usage

```typescript
import { createObservabilityRuntime } from '@lateen-os/observability-engine';

const runtime = createObservabilityRuntime();

await runtime.logging.info('org-1', 'Service started', { category: 'startup' });
const trace = await runtime.tracing.startTrace('org-1', 'process-order');
const span = await runtime.tracing.startSpan('org-1', trace.id, 'validate-order');
await runtime.tracing.endSpan('org-1', span.id);
await runtime.tracing.endTrace('org-1', trace.id);

const health = await runtime.health.checkComponentHealth('org-1', 'database', 'healthy');
```

Wiring in the real, integrated collaborators:

```typescript
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createRuntimeQueries } from '@lateen-os/ai-runtime';

const runtime = createObservabilityRuntime({
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
  aiSecurity: createSecurityRuntime(),
  aiGovernance: createGovernanceRuntime(),
  aiCompliance: createComplianceRuntime(),
  analyticsEngine: createAnalyticsRuntime().queries,
});

const runtimeHealth = await runtime.health.checkRuntimeHealth('org-1');
const timeline = await runtime.auditTimeline.aggregateTimeline('org-1');
const snapshot = await runtime.snapshots.computeSnapshot('org-1', 'security');
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('alert.created', (payload) => {
  console.log(`Alert ${payload.alertType} (${payload.severity}) triggered`);
});
```

## Structure

```
src/
├── shared/                     # IDs (reusing Workflow Engine's OrganizationId), primitives, id.ts helpers
├── logging/                       # Structured Logging — six levels, fields, scopes, correlation ids
├── metrics/                          # Metrics Collector — counters/gauges/histograms/timers/averages
├── tracing/                             # Distributed Tracing — traces and nested spans
├── health/                                 # Health Engine — real AI Runtime + Workflow Engine dependency health
├── alerting/                                  # Alert Engine — deterministic thresholds and dependency alerts
├── performance/                                  # Performance Engine — real AI Runtime + Workflow + Communication integration
├── audit-timeline/                                  # Real Security/Governance/Compliance/Workflow/Communication aggregation
├── snapshot/                                            # Snapshot Engine — runtime/workflows/communications/analytics/security
├── relationship-management/                                # AI Runtime / Workflow / Communication / Security / Governance / Compliance / Analytics
├── queries/                                                    # Real ObservabilityQueries read layer
├── events/                                                        # Typed ObservabilityEventMap
├── runtime.ts                                                        # createObservabilityRuntime() composition root
└── index.ts
```

See [OBSERVABILITY_MODEL.md](./OBSERVABILITY_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/ai-runtime` — optional Health/Performance/Snapshot/Relationship Layer collaborator
- `@lateen-os/workflow-engine` — `OrganizationId`; optional Health/Alert/Performance/Audit-Timeline/Snapshot/Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Performance/Audit-Timeline/Snapshot/Relationship Layer collaborator
- `@lateen-os/ai-security-engine` — optional Alert/Audit-Timeline/Snapshot/Relationship Layer collaborator
- `@lateen-os/ai-governance-engine` — optional Audit-Timeline/Relationship Layer collaborator
- `@lateen-os/ai-compliance-engine` — optional Audit-Timeline/Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Snapshot/Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/observability-engine build
pnpm --filter @lateen-os/observability-engine typecheck
pnpm --filter @lateen-os/observability-engine test
pnpm --filter @lateen-os/observability-engine lint
```
