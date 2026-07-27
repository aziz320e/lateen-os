/** @module events/analytics-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type DashboardCreatedEvent = DomainEvent<
  'dashboard.created',
  { readonly organizationId: string; readonly dashboardId: string; readonly dashboardType: string }
>;

export type DashboardUpdatedEvent = DomainEvent<'dashboard.updated', { readonly organizationId: string; readonly dashboardId: string }>;

export type MetricCalculatedEvent = DomainEvent<
  'metric.calculated',
  { readonly organizationId: string; readonly metricSnapshotId: string; readonly metricName: string; readonly metricType: string }
>;

export type KpiUpdatedEvent = DomainEvent<
  'kpi.updated',
  { readonly organizationId: string; readonly kpiSnapshotId: string; readonly kpiType: string; readonly value: number }
>;

export type ReportGeneratedEvent = DomainEvent<
  'report.generated',
  { readonly organizationId: string; readonly reportId: string; readonly format: string }
>;

export type TrendUpdatedEvent = DomainEvent<
  'trend.updated',
  { readonly organizationId: string; readonly trendResultId: string; readonly granularity: string }
>;

export type AggregationCompletedEvent = DomainEvent<
  'aggregation.completed',
  { readonly organizationId: string; readonly aggregationResultId: string; readonly groupCount: number }
>;

export type AnalyticsSnapshotCreatedEvent = DomainEvent<
  'analytics.snapshot.created',
  { readonly organizationId: string; readonly snapshotId: string; readonly category: string }
>;

/** Canonical event names for external subscribers. */
export const ANALYTICS_EVENT_NAMES = {
  DashboardCreated: 'dashboard.created',
  DashboardUpdated: 'dashboard.updated',
  MetricCalculated: 'metric.calculated',
  KpiUpdated: 'kpi.updated',
  ReportGenerated: 'report.generated',
  TrendUpdated: 'trend.updated',
  AggregationCompleted: 'aggregation.completed',
  AnalyticsSnapshotCreated: 'analytics.snapshot.created',
} as const;

/** Union of all Analytics Platform domain events. */
export type AnalyticsDomainEvent =
  | DashboardCreatedEvent
  | DashboardUpdatedEvent
  | MetricCalculatedEvent
  | KpiUpdatedEvent
  | ReportGeneratedEvent
  | TrendUpdatedEvent
  | AggregationCompletedEvent
  | AnalyticsSnapshotCreatedEvent;
