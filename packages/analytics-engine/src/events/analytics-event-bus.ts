/**
 * Real, typed event bus for the Analytics Platform runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/analytics-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type AnalyticsEventMap = {
  'dashboard.created': { readonly organizationId: string; readonly dashboardId: string; readonly dashboardType: string };
  'dashboard.updated': { readonly organizationId: string; readonly dashboardId: string };
  'metric.calculated': { readonly organizationId: string; readonly metricSnapshotId: string; readonly metricName: string; readonly metricType: string };
  'kpi.updated': { readonly organizationId: string; readonly kpiSnapshotId: string; readonly kpiType: string; readonly value: number };
  'report.generated': { readonly organizationId: string; readonly reportId: string; readonly format: string };
  'trend.updated': { readonly organizationId: string; readonly trendResultId: string; readonly granularity: string };
  'aggregation.completed': { readonly organizationId: string; readonly aggregationResultId: string; readonly groupCount: number };
  'analytics.snapshot.created': { readonly organizationId: string; readonly snapshotId: string; readonly category: string };
};

export type AnalyticsEventBus = EventBus<AnalyticsEventMap>;

/** Creates an in-memory {@link AnalyticsEventBus}. */
export function createAnalyticsEventBus(): AnalyticsEventBus {
  return createEventBus<AnalyticsEventMap>();
}
