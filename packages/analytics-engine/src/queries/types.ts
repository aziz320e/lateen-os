/** @module queries/types */
import type { Dashboard, DashboardType } from '../dashboard/types.js';
import type { KpiSnapshot, KpiType } from '../kpi/types.js';
import type { MetricSnapshot, MetricType } from '../metrics/types.js';
import type { AnalyticsReport, ReportFormat } from '../report/types.js';
import type { RevenueAnalyticsSnapshot } from '../revenue-analytics/types.js';
import type { MarketingAnalyticsSnapshot } from '../marketing-analytics/types.js';
import type { SalesAnalyticsSnapshot } from '../sales-analytics/types.js';
import type { WorkflowAnalyticsSnapshot } from '../workflow-analytics/types.js';
import type { SecurityAnalyticsSnapshot } from '../security-analytics/types.js';
import type { ComplianceAnalyticsSnapshot } from '../compliance-analytics/types.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindDashboardsQuery extends OrganizationScopedQuery {
  readonly dashboardType?: DashboardType;
}
export interface FindDashboardsResult {
  readonly dashboards: readonly Dashboard[];
  readonly total: number;
}

export interface FindKPIsQuery extends OrganizationScopedQuery {
  readonly kpiType?: KpiType;
}
export interface FindKPIsResult {
  readonly kpis: readonly KpiSnapshot[];
  readonly total: number;
}

export interface FindMetricsQuery extends OrganizationScopedQuery {
  readonly metricName?: string;
  readonly metricType?: MetricType;
}
export interface FindMetricsResult {
  readonly metrics: readonly MetricSnapshot[];
  readonly total: number;
}

export interface FindReportsQuery extends OrganizationScopedQuery {
  readonly format?: ReportFormat;
}
export interface FindReportsResult {
  readonly reports: readonly AnalyticsReport[];
  readonly total: number;
}

export type FindRevenueAnalyticsQuery = OrganizationScopedQuery;
export interface FindRevenueAnalyticsResult {
  readonly snapshots: readonly RevenueAnalyticsSnapshot[];
  readonly total: number;
}

export type FindMarketingAnalyticsQuery = OrganizationScopedQuery;
export interface FindMarketingAnalyticsResult {
  readonly snapshots: readonly MarketingAnalyticsSnapshot[];
  readonly total: number;
}

export type FindSalesAnalyticsQuery = OrganizationScopedQuery;
export interface FindSalesAnalyticsResult {
  readonly snapshots: readonly SalesAnalyticsSnapshot[];
  readonly total: number;
}

export type FindWorkflowAnalyticsQuery = OrganizationScopedQuery;
export interface FindWorkflowAnalyticsResult {
  readonly snapshots: readonly WorkflowAnalyticsSnapshot[];
  readonly total: number;
}

export type FindSecurityAnalyticsQuery = OrganizationScopedQuery;
export interface FindSecurityAnalyticsResult {
  readonly snapshots: readonly SecurityAnalyticsSnapshot[];
  readonly total: number;
}

export type FindComplianceAnalyticsQuery = OrganizationScopedQuery;
export interface FindComplianceAnalyticsResult {
  readonly snapshots: readonly ComplianceAnalyticsSnapshot[];
  readonly total: number;
}

export interface SearchAnalyticsQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchAnalyticsMatch {
  readonly recordType: 'dashboard' | 'kpi' | 'metric' | 'report';
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchAnalyticsResult {
  readonly matches: readonly SearchAnalyticsMatch[];
  readonly total: number;
}
