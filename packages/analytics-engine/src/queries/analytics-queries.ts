/** @module queries/analytics-queries */
import type {
  FindComplianceAnalyticsQuery,
  FindComplianceAnalyticsResult,
  FindDashboardsQuery,
  FindDashboardsResult,
  FindKPIsQuery,
  FindKPIsResult,
  FindMarketingAnalyticsQuery,
  FindMarketingAnalyticsResult,
  FindMetricsQuery,
  FindMetricsResult,
  FindReportsQuery,
  FindReportsResult,
  FindRevenueAnalyticsQuery,
  FindRevenueAnalyticsResult,
  FindSalesAnalyticsQuery,
  FindSalesAnalyticsResult,
  FindSecurityAnalyticsQuery,
  FindSecurityAnalyticsResult,
  FindWorkflowAnalyticsQuery,
  FindWorkflowAnalyticsResult,
  SearchAnalyticsQuery,
  SearchAnalyticsResult,
} from './types.js';

/** Real, read-only Analytics Platform query port. */
export interface AnalyticsQueries {
  findDashboards(query: FindDashboardsQuery): Promise<FindDashboardsResult>;
  findKPIs(query: FindKPIsQuery): Promise<FindKPIsResult>;
  findMetrics(query: FindMetricsQuery): Promise<FindMetricsResult>;
  findReports(query: FindReportsQuery): Promise<FindReportsResult>;
  findRevenueAnalytics(query: FindRevenueAnalyticsQuery): Promise<FindRevenueAnalyticsResult>;
  findMarketingAnalytics(query: FindMarketingAnalyticsQuery): Promise<FindMarketingAnalyticsResult>;
  findSalesAnalytics(query: FindSalesAnalyticsQuery): Promise<FindSalesAnalyticsResult>;
  findWorkflowAnalytics(query: FindWorkflowAnalyticsQuery): Promise<FindWorkflowAnalyticsResult>;
  findSecurityAnalytics(query: FindSecurityAnalyticsQuery): Promise<FindSecurityAnalyticsResult>;
  findComplianceAnalytics(query: FindComplianceAnalyticsQuery): Promise<FindComplianceAnalyticsResult>;
  searchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsResult>;
}
