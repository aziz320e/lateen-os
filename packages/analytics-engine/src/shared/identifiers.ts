/**
 * Identifier types for the Analytics & Business Intelligence Platform
 * bounded context.
 *
 * Where a sibling package already owns a canonical id, it is reused
 * directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId, EmployeeId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Executive Dashboard identifier. */
export type DashboardId = Identifier;

/** KPI snapshot identifier. */
export type KpiSnapshotId = Identifier;

/** Metric snapshot identifier. */
export type MetricSnapshotId = Identifier;

/** Revenue analytics snapshot identifier. */
export type RevenueAnalyticsId = Identifier;

/** Sales analytics snapshot identifier. */
export type SalesAnalyticsId = Identifier;

/** Marketing analytics snapshot identifier. */
export type MarketingAnalyticsId = Identifier;

/** Communication analytics snapshot identifier. */
export type CommunicationAnalyticsId = Identifier;

/** Workflow analytics snapshot identifier. */
export type WorkflowAnalyticsId = Identifier;

/** Security analytics snapshot identifier. */
export type SecurityAnalyticsId = Identifier;

/** Governance analytics snapshot identifier. */
export type GovernanceAnalyticsId = Identifier;

/** Compliance analytics snapshot identifier. */
export type ComplianceAnalyticsId = Identifier;

/** Trend result identifier. */
export type TrendResultId = Identifier;

/** Aggregation result identifier. */
export type AggregationResultId = Identifier;

/** Analytics report identifier. */
export type AnalyticsReportId = Identifier;
