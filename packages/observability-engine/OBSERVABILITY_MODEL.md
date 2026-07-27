# Observability Model

> Real, implemented model for the Observability Platform — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Structured Logging

`logging/engine.impl.ts`'s `createLoggingEngine()` implements the 6 required levels — `trace`, `debug`, `info`, `warn`, `error`, `fatal` — as one convenience method each, all delegating to a single internal `log()` that persists a `LogEntry` and publishes `log.created`. Every entry may carry a `category` (logical subsystem), a `scope` (narrower than category), a `correlationId` (ties entries from one logical operation together), and arbitrary structured `fields`. This module has no sibling-package integration — every other module that needs "what happened recently" composes it directly (same-package, not a repository).

---

## Metrics Collector

`metrics/engine.impl.ts`'s `createMetricsEngine()` implements the 4 required metric primitives:

- **Counter** — `recordCounter()` is cumulative: it reads the most recently recorded sample for the metric name and adds the given delta, mirroring a real monotonic counter.
- **Gauge** — `recordGauge()` simply records the given absolute value.
- **Histogram** — `recordHistogram()` records one observation; `computeHistogramStats()` (pure) summarizes count/sum/average/min/max over any set of observations.
- **Timer** — `recordTimer()` records a duration in milliseconds.
- **Moving average** — `computeMovingAverage()` (pure): a fixed-width window over the *last* N values.

---

## Distributed Tracing

`tracing/engine.impl.ts`'s `createTracingEngine()` implements traces and nested spans: `startTrace()` / `endTrace()` persist a `Trace` (status `running` → `completed`/`failed`, with a computed `durationMs`, publishing `trace.completed`); `startSpan()` / `endSpan()` persist a `Span`, optionally nested under a `parentSpanId`, with its own computed `durationMs`. Traces and spans are independently repository-backed and queryable (`findSpansByTrace()`).

---

## Health Engine

`health/engine.impl.ts`'s `createHealthEngine()` composes the real, optional AI Runtime and Workflow Engine query ports:

- **Component health** — `checkComponentHealth()`: a generic, deterministic self-report (any subsystem can report its own `healthy`/`degraded`/`unhealthy` status).
- **Runtime health** — `checkRuntimeHealth()`: derived from real AI Runtime `findRuntimeState()` — `state === 'terminated'` is `unhealthy`; a queued-task backlog more than 3× the active session count is `degraded`; otherwise `healthy`.
- **Dependency health** — `checkWorkflowDependencyHealth()`: derived from real Workflow Engine `findRunningWorkflows()` — a failed-instance ratio above 50% is `unhealthy`, above 20% is `degraded`, otherwise `healthy`.

Every check publishes `health.changed` **only when the status actually changed** from the previously recorded check for that component (favoring the most-recently-inserted check on a timestamp tie) — mirroring how a real health monitor only alerts on a state transition, not on every poll.

---

## Alert Engine

`alerting/engine.impl.ts`'s `createAlertEngine()` implements the 6 required deterministic alert types, composing the real, optional Logging/Health engines (same package) and the real, optional Workflow Engine / AI Security Engine query ports:

- **Error threshold** / **warning threshold** — real log entries (from Structured Logging) at `error`/`fatal` or `warn` level, counted and compared against a caller-supplied threshold.
- **Inactivity** — the time since the most recent real log entry, compared against a caller-supplied threshold; an organization with no log entries at all is immediately alertable.
- **Health degradation** — the latest real health check per component (from the Health Engine); any component not `healthy` raises one alert per component, `critical` for `unhealthy` and `warning` for `degraded`.
- **Workflow failures** — real failed workflow instances from Workflow Engine `findRunningWorkflows({ status: 'failed' })`.
- **Security events** — real security violations from AI Security Engine `findViolations()`, compared against a caller-supplied threshold.

Alerts are created `open` and publish `alert.created`; `resolve()` transitions to `resolved` and publishes `alert.resolved`.

---

## Performance Engine

`performance/engine.impl.ts`'s `createPerformanceEngine()` implements the 5 required performance metrics, composing the real, optional AI Runtime, Workflow Engine, and Communication Hub query ports:

- **Execution time** — the mean `completedAt - createdAt` across real AI Runtime execution results (`findExecutionHistory()`). Like Workflow Engine's `findHistory()`, this query only returns results when scoped to a specific `planId` or `taskId` — there is no real "every execution result in the organization" query — so `recordExecutionTime()` accepts an optional `{ planId, taskId }` scope mirroring that real constraint, rather than pretending an org-wide query exists.
- **Queue latency** — the mean `updatedAt - createdAt` across real, `assigned` (dequeued) AI Runtime tasks (`findTasks({ status: 'assigned' })`) — AI Runtime's task queue genuinely sets `updatedAt` at the moment a task is dequeued, so this is a real signal, not a synthetic one.
- **Workflow duration** — the mean `completedAt - startedAt` across real, completed Workflow Engine instances (`findRunningWorkflows({ status: 'completed' })`).
- **Message throughput** — real Communication Hub message count (`findMessages()`) divided by a caller-supplied period in minutes.
- **Runtime utilization** — real AI Runtime `findRuntimeState()`'s `activeSessionCount / (activeSessionCount + queuedTaskCount)`, as a percentage.

---

## Audit Timeline

`audit-timeline/engine.impl.ts`'s `createAuditTimelineEngine()` composes the real, optional query ports of all 5 required sources:

- **Security** — real audit events from `findViolations()`.
- **Governance** — real decisions from `findGovernanceEvents()`.
- **Compliance** — real compliance audits from `findAudits()`.
- **Workflow** — real workflow instances from `findRunningWorkflows()`.
- **Communication** — real, already-timeline-shaped entries from `findTimeline()`.

`aggregateTimeline()` pulls from every injected source, persists each as an `AuditTimelineEntry`, and returns them sorted most-recent-first.

---

## Snapshot Engine

`snapshot/engine.impl.ts`'s `createSnapshotEngine()` implements the 5 required snapshot categories, composing the real, optional AI Runtime, Workflow Engine, Communication Hub, Analytics Engine, and AI Security Engine query ports:

- **Runtime** — real AI Runtime state (`findRuntimeState()`).
- **Workflows** — real active/completed/failed instance counts (`findRunningWorkflows()`).
- **Communications** — real message and timeline-entry counts (`findMessages()`, `findTimeline()`).
- **Analytics** — real recorded KPI-snapshot count (`findKPIs()`).
- **Security** — real violation and threat counts (`findViolations()`, `findThreats()`).

Each `computeSnapshot()` call persists a new `ObservabilitySnapshot` and publishes `snapshot.created` with the computed category.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 7 packages, each through one additional, real, distinct signal not already used by a narrower module — so every integration point is exercised without duplicating logic:

- **`getAiRuntimeContext()`** — real AI Runtime `findAgent()` agent count.
- **`getWorkflowContext()`** — real Workflow Engine `findWaitingTasks()` waiting-task count.
- **`getCommunicationContext()`** — real Communication Hub `findNotifications()` notification count.
- **`getSecurityContext()`** — real AI Security Engine `findPolicies()` policy count.
- **`getGovernanceContext()`** — real AI Governance Engine `findApprovals({ status: 'pending' })` pending-approval count.
- **`getComplianceContext()`** — real AI Compliance Engine `findFrameworks({ status: 'active' })` active-framework count.
- **`getAnalyticsContext()`** — real Analytics Engine `findDashboards()` dashboard count.

Every method degrades to a documented `null` when its collaborator was not injected, so the Observability Platform remains fully usable — and fully tested — completely offline.
