# Analytics Model

> Real, implemented model for the Analytics & Business Intelligence Platform — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## KPI Engine

`kpi/engine.impl.ts`'s `createKpiEngine()` implements the 12 required KPIs as one `record*` method each (`recordRevenue`, `recordPipelineValue`, `recordConversionRate`, `recordWinRate`, `recordAverageDealSize`, `recordCustomerAcquisitionCost`, `recordCustomerLifetimeValue`, `recordMarketingRoi`, `recordCampaignPerformance`, `recordResponseTime`, `recordWorkflowCompletion`, `recordWorkforceUtilization`), each persisting a `KpiSnapshot` and publishing `kpi.updated`. The KPI Engine itself is integration-free — every category analytics engine gathers real data from its sibling package and calls the relevant `record*` method with the computed value. Pure calculators (`calculateConversionRate`, `calculateWinRate`, `calculateAverageDealSize`, `calculateCustomerAcquisitionCost`, `calculateCustomerLifetimeValue`, `calculateMarketingRoi`, `calculateAverageResponseTimeMinutes`, `calculateWorkflowCompletionRate`, `calculateWorkforceUtilization`) are exported independently for direct testing and reuse.

---

## Metrics Engine

`metrics/engine.impl.ts`'s `createMetricsEngine()` implements the 7 required metric primitives:

- **Counter** — `recordCounter()` is cumulative: it reads the most recently recorded counter value for the metric name and adds the given delta, mirroring a real monotonic counter.
- **Gauge** — `recordGauge()` simply records the given absolute value.
- **Ratio** / **Percentage** — `computeRatio()` / `computePercentage()` (pure), `0` on a zero denominator.
- **Trend** — `computeTrendChange()` (pure): percentage change from a previous to a current value.
- **Moving average** — `computeMovingAverage()` (pure): a fixed-width window over the *last* N values.
- **Rolling average** — `computeRollingAverage()` (pure): an expanding-window (cumulative) average over every value given.

---

## Executive Dashboard

`dashboard/engine.impl.ts`'s `createDashboardEngine()` implements deterministic, configurable dashboards across the 7 required types (`ceo`, `sales`, `marketing`, `operations`, `security`, `governance`, `compliance`). A `Dashboard` is a named set of `DashboardWidget`s, each referencing a `kpiType` or `metricName` plus free-form `config` — the platform does not prescribe widget rendering, only the deterministic reference data behind each widget.

---

## Revenue Analytics

`revenue-analytics/engine.impl.ts`'s `createRevenueAnalyticsEngine()` composes the real, optional Sales Engine and CRM Engine query ports:

- **MRR** — a proxy: the sum of closed-won deal amounts closing within the calendar month containing `asOf` (this package has no subscription/recurrence model, so there is no true MRR signal available from Sales Engine).
- **ARR** — `MRR × 12`.
- **Monthly / quarterly / yearly revenue** — the same closed-won deals, bucketed by the Trend Engine's pure `bucketKeyForGranularity()` at `'month'` / `'quarter'` / `'year'` granularity.
- **Growth** — percentage change between the current period's monthly revenue and `previousAsOf`'s monthly revenue, when supplied.
- **Revenue by product** — real Sales Engine Quotes (`findQuotes({ opportunityId })`) linked to won opportunities, summed per line item's `productId`.
- **Revenue by market** — grouped by the CRM Account's `industry` field via `accountId` (the closest real, available market-segmentation signal in CRM Engine — Sales Opportunity has no direct market reference), falling back to `'unknown'`.

---

## Sales Analytics

`sales-analytics/engine.impl.ts`'s `createSalesAnalyticsEngine()` composes the real, optional Sales Engine query port:

- **Pipeline value** — sum of open (non-won, non-lost) opportunity amounts from `findPipeline()`.
- **Conversion funnel** — opportunity count per pipeline stage.
- **Stage duration** — average days each currently-open opportunity has spent since its last update, per stage (`computeAverageStageDurationDays()`, pure) — a "time in stage so far" proxy, since Sales Engine does not track per-transition timestamps.
- **Close rate** — `computeCloseRate()` (pure): won / (won + lost) as a percentage.
- **Sales velocity** — `computeSalesVelocity()` (pure): the classic formula, `(dealCount × averageDealSize × winRate) / averageSalesCycleDays`.

---

## Marketing Analytics

`marketing-analytics/engine.impl.ts`'s `createMarketingAnalyticsEngine()` composes the real, optional Marketing Engine query port. Marketing Engine's own Metrics module already computes CPL/CAC/ROI per campaign (`findMetrics()`), so this engine **aggregates those real, per-campaign figures** (via `average()`, pure) rather than recomputing them:

- **CPL / CAC / ROI** — the mean of every campaign's already-computed figures.
- **Campaign effectiveness** — each campaign's real ROI, keyed by campaign id.
- **Attribution summary** — each campaign's real conversion count, keyed by campaign id (a proxy — Marketing Engine's touchpoint-level attribution isn't exposed through the query layer).
- **Lead source effectiveness** — real leads (`findLeads()`) grouped by `source`, averaging each lead's real, Marketing-Engine-computed `score`.

---

## Communication Analytics

`communication-analytics/engine.impl.ts`'s `createCommunicationAnalyticsEngine()` composes the real, optional Communication Hub query port:

- **Message volume** — total message count from `findMessages()`.
- **Response time** — `computeAverageResponseTimeMinutes()` (pure): average minutes between consecutive, chronologically-sorted `sentAt` timestamps within each conversation — a proxy for response latency using only real, available timestamps.
- **Delivery rate** / **read rate** — `computeDeliveryRate()` / `computeReadRate()` (pure): percentage of dispatched (`sent`/`delivered`/`read`/`failed`) messages reaching `delivered`-or-later, or `read`, respectively.
- **Notification statistics** — total, sent, and read counts from `findNotifications()`.

---

## Workflow Analytics

`workflow-analytics/engine.impl.ts`'s `createWorkflowAnalyticsEngine()` composes the real, optional Workflow Engine query port:

- **Active / completed / failed workflows** — real instance counts from `findRunningWorkflows()`, filtered by status.
- **Average execution time** — `computeAverageExecutionTimeMinutes()` (pure): minutes between `startedAt` and `completedAt` across completed instances.
- **Bottlenecks** — real waiting step instances from `findWaitingTasks()`, counted per `stepId` — the steps with the highest counts are the workflow's bottlenecks.

---

## Security Analytics

`security-analytics/engine.impl.ts`'s `createSecurityAnalyticsEngine()` composes the real, optional AI Security Engine query port **and event bus**:

- **Authentication / authorization failures** and **policy violations** — derived from the shared, immutable `findViolations()` stream, filtered by `AuditCategory` — mirroring AI Security Engine's own "one shared audit sink" design.
- **Threat detections** — the real total from `findThreats()`.
- **Blocked tools / providers** — a deliberate exception to the "query, don't subscribe" rule used everywhere else in this package: AI Security Engine's Tool Security and Provider Security modules publish `tool.blocked` / `provider.blocked` but never write them to the shared audit sink (they are transient, real-time signals, not persisted records), so there is no query capable of recovering them after the fact. This engine instead subscribes to the real, injected AI Security Engine event bus **once, at construction time**, and accumulates real, running per-organization counters from the genuine event stream — the same pattern the Metrics Engine's counters use, applied to a live external event source instead of caller-supplied deltas. Because the subscription happens at construction, the engine must be created *before* the blocking actions it observes.

---

## Governance Analytics

`governance-analytics/engine.impl.ts`'s `createGovernanceAnalyticsEngine()` composes the real, optional AI Governance Engine query port:

- **Active policies** — `findPolicies({ status: 'active' }).total`.
- **Pending approvals** — `findApprovals({ status: 'pending' }).total`.
- **Governance violations** — a proxy over `findGovernanceEvents({ outcome: 'rejected' }).total`; AI Governance Engine does not persist a separate violations feed, only publishing `governance.violation.detected` at rule-evaluation time, so rejected governance decisions are the closest real, queryable signal.
- **Risk distribution** — real risks from `findRisks()`, counted per `riskLevel`.

---

## Compliance Analytics

`compliance-analytics/engine.impl.ts`'s `createComplianceAnalyticsEngine()` composes the real, optional AI Compliance Engine query port:

- **Compliance score** — the mean of every framework's latest score from `findComplianceStatus()`.
- **Passed / failed controls** — summed `passedControlIds.length` / `failedControlIds.length` across every real assessment from `findAssessments()`.
- **Remediation progress** — total, completed, and percent-complete from real `findRemediations()`.
- **Framework coverage** — the percentage of frameworks with `status: 'active'` from `findFrameworks()`.

---

## Trend Engine

`trend/engine.impl.ts`'s `createTrendEngine()` implements deterministic bucketing at all 5 required granularities:

- **`bucketKeyForGranularity()`** (pure) — `day` (`YYYY-MM-DD`), `week` (real ISO-8601 week numbering via `isoWeekKey()`), `month` (`YYYY-MM`), `quarter` (`YYYY-Qn`), `year` (`YYYY`).
- **`computeTrendBuckets()`** (pure) — groups a set of timestamped observations into sorted buckets, each with a total, average, and count.
- **`computeTrendDirection()`** (pure) — compares the first and last bucket's totals: `up` / `down` / `flat`, plus a percentage change.

---

## Aggregation Engine

`aggregation/engine.impl.ts`'s `createAggregationEngine()` implements the 5 required aggregation operations, all pure and generic over `<T>` so they can operate directly on real sibling-package records:

- **`groupBy()`** — groups records by a caller-supplied key function.
- **`filterRecords()`** — a thin, explicit wrapper kept alongside `groupBy`/`rollup` for a uniform vocabulary.
- **`rollup()`** — sums a caller-supplied value function per group.
- **`drillDown()`** — recursively groups by a sequence of key functions, one level per function, producing a nested tree.
- **`compareGroups()`** — percentage change per group key between a current and a previous group-totals map.

The stateful `aggregate()` method persists a summarized `AggregationResult` (group totals and counts) and publishes `aggregation.completed`.

---

## Report Engine

`report/engine.impl.ts`'s `createReportEngine()` implements the 3 required report models — **metadata only, no real file is ever generated**:

- **PDF model** — `computePdfPageCount()` (pure): a fixed rows-per-page density (40 rows/page).
- **CSV model** — `computeCsvDimensions()` (pure): total row count and the widest column set across every section.
- **JSON model** — a byte-size estimate via `JSON.stringify(sections).length`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates the 6 packages not owned by a category analytics engine, each exclusively through its public API:

- **`getInstitutionalMemoryContext()`** — real Institutional Memory `findKnowledge()` (the real, constructible `KnowledgeRuntimeQueries` port returned by `createInstitutionalMemoryRuntime().queries`).
- **`getDomainGraphContext()`** — real Domain Graph `graphStatistics()`.
- **`getDecisionContext()`** — real Decision Engine `findPendingApprovals()`.
- **`getIntelligenceContext()`** — real Intelligence Engine `findBusinessOpportunities()`.
- **`getWorkforceUtilizationContext()`** — real AI Workforce `findWorkers()`, computing busy/active worker counts and a utilization percentage — this is the real data source behind the KPI Engine's `workforce_utilization` KPI.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.

Every method degrades to a documented `null` when its collaborator was not injected, so the Analytics Platform remains fully usable — and fully tested — completely offline.
