/**
 * @lateen-os/analytics-engine — Analytics & Business Intelligence Platform
 *
 * KPIs, metrics, executive dashboards, revenue/sales/marketing/
 * communication/workflow/security/governance/compliance analytics,
 * trends, aggregation, and reporting for Lateen OS. Real, deterministic,
 * offline implementation — see `runtime.ts`'s `createAnalyticsRuntime()`
 * for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as kpi from './kpi/index.js';
export * as metrics from './metrics/index.js';
export * as dashboard from './dashboard/index.js';
export * as trend from './trend/index.js';
export * as aggregation from './aggregation/index.js';
export * as revenueAnalytics from './revenue-analytics/index.js';
export * as salesAnalytics from './sales-analytics/index.js';
export * as marketingAnalytics from './marketing-analytics/index.js';
export * as communicationAnalytics from './communication-analytics/index.js';
export * as workflowAnalytics from './workflow-analytics/index.js';
export * as securityAnalytics from './security-analytics/index.js';
export * as governanceAnalytics from './governance-analytics/index.js';
export * as complianceAnalytics from './compliance-analytics/index.js';
export * as report from './report/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createAnalyticsRuntime,
  type AnalyticsRuntime,
  type AnalyticsRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { KpiSnapshot, KpiType, KpiUnit, KpiSnapshotId } from './kpi/types.js';
export type { MetricSnapshot, MetricType, MetricSnapshotId } from './metrics/types.js';
export type { Dashboard, DashboardType, DashboardWidget, DashboardId } from './dashboard/types.js';
export type { TrendResult, TrendGranularity, TrendDirection, TrendDataPoint, TrendBucket, TrendResultId } from './trend/types.js';
export type { AggregationResult, GroupComparison, DrillDownNode, AggregationResultId } from './aggregation/types.js';
export type { RevenueAnalyticsSnapshot, RevenueAnalyticsId } from './revenue-analytics/types.js';
export type { SalesAnalyticsSnapshot, SalesAnalyticsId } from './sales-analytics/types.js';
export type { MarketingAnalyticsSnapshot, MarketingAnalyticsId } from './marketing-analytics/types.js';
export type { CommunicationAnalyticsSnapshot, NotificationStatistics, CommunicationAnalyticsId } from './communication-analytics/types.js';
export type { WorkflowAnalyticsSnapshot, WorkflowAnalyticsId } from './workflow-analytics/types.js';
export type { SecurityAnalyticsSnapshot, SecurityAnalyticsId } from './security-analytics/types.js';
export type { GovernanceAnalyticsSnapshot, GovernanceAnalyticsId } from './governance-analytics/types.js';
export type { ComplianceAnalyticsSnapshot, RemediationProgressSummary, ComplianceAnalyticsId } from './compliance-analytics/types.js';
export type { AnalyticsReport, ReportFormat, ReportSection, PdfReportMetadata, CsvReportMetadata, JsonReportMetadata, AnalyticsReportId } from './report/types.js';

/** Real lifecycle/service ports. */
export {
  type KpiEngine,
  type RecordKpiInput,
  calculateConversionRate,
  calculateWinRate,
  calculateAverageDealSize,
  calculateCustomerAcquisitionCost,
  calculateCustomerLifetimeValue,
  calculateMarketingRoi,
  calculateAverageResponseTimeMinutes,
  calculateWorkflowCompletionRate,
  calculateWorkforceUtilization,
} from './kpi/engine.impl.js';
export {
  type MetricsEngine,
  computeRatio,
  computePercentage,
  computeMovingAverage,
  computeRollingAverage,
  computeTrendChange,
} from './metrics/engine.impl.js';
export { type DashboardEngine, type CreateDashboardInput, type UpdateDashboardInput } from './dashboard/engine.impl.js';
export {
  type TrendEngine,
  type ComputeTrendInput,
  bucketKeyForGranularity,
  computeTrendBuckets,
  computeTrendDirection,
  isoWeekKey,
} from './trend/engine.impl.js';
export {
  type AggregationEngine,
  type AggregateInput,
  groupBy,
  filterRecords,
  rollup,
  drillDown,
  compareGroups,
} from './aggregation/engine.impl.js';
export {
  type RevenueAnalyticsEngine,
  type RevenueAnalyticsDeps,
  type ComputeRevenueSnapshotInput,
  computeGrowthPercentage,
  sumRevenueInPeriod,
} from './revenue-analytics/engine.impl.js';
export {
  type SalesAnalyticsEngine,
  type SalesAnalyticsDeps,
  type ComputeSalesSnapshotInput,
  computeCloseRate,
  computeSalesVelocity,
  computeAverageStageDurationDays,
} from './sales-analytics/engine.impl.js';
export { type MarketingAnalyticsEngine, type MarketingAnalyticsDeps, average } from './marketing-analytics/engine.impl.js';
export {
  type CommunicationAnalyticsEngine,
  type CommunicationAnalyticsDeps,
  computeAverageResponseTimeMinutes,
  computeDeliveryRate,
  computeReadRate,
} from './communication-analytics/engine.impl.js';
export {
  type WorkflowAnalyticsEngine,
  type WorkflowAnalyticsDeps,
  computeAverageExecutionTimeMinutes,
} from './workflow-analytics/engine.impl.js';
export { type SecurityAnalyticsEngine, type SecurityAnalyticsDeps } from './security-analytics/engine.impl.js';
export { type GovernanceAnalyticsEngine, type GovernanceAnalyticsDeps } from './governance-analytics/engine.impl.js';
export { type ComplianceAnalyticsEngine, type ComplianceAnalyticsDeps } from './compliance-analytics/engine.impl.js';
export {
  type ReportEngine,
  type GenerateReportInput,
  computePdfPageCount,
  computeCsvDimensions,
} from './report/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { KpiSnapshotRepository } from './kpi/repository.js';
export type { MetricSnapshotRepository } from './metrics/repository.js';
export type { DashboardRepository } from './dashboard/repository.js';
export type { TrendResultRepository } from './trend/repository.js';
export type { AggregationResultRepository } from './aggregation/repository.js';
export type { RevenueAnalyticsRepository } from './revenue-analytics/repository.js';
export type { SalesAnalyticsRepository } from './sales-analytics/repository.js';
export type { MarketingAnalyticsRepository } from './marketing-analytics/repository.js';
export type { CommunicationAnalyticsRepository } from './communication-analytics/repository.js';
export type { WorkflowAnalyticsRepository } from './workflow-analytics/repository.js';
export type { SecurityAnalyticsRepository } from './security-analytics/repository.js';
export type { GovernanceAnalyticsRepository } from './governance-analytics/repository.js';
export type { ComplianceAnalyticsRepository } from './compliance-analytics/repository.js';
export type { AnalyticsReportRepository } from './report/repository.js';

/** Relationship Layer (Institutional Memory / Domain Graph / Decision Engine / Intelligence Engine / AI Workforce / Business DNA integration). */
export { type RelationshipManagement, type RelationshipManagementDeps, type WorkforceUtilizationContext } from './relationship-management/index.js';

/** Query layer. */
export type { AnalyticsQueries } from './queries/analytics-queries.js';

/** Typed event bus. */
export type { AnalyticsDomainEvent } from './events/analytics-events.js';
export { ANALYTICS_EVENT_NAMES } from './events/analytics-events.js';
