/** Enterprise Analytics domain contracts — aggregation only, no business data ownership. */

export type AnalyticsDomain =
  | 'executive'
  | 'sales'
  | 'finance'
  | 'operations'
  | 'production'
  | 'projects'
  | 'customers'
  | 'products'
  | 'marketplace'
  | 'extensions'
  | 'ai-workforce'
  | 'ai-runtime'
  | 'workflow'
  | 'missions'
  | 'knowledge'
  | 'search'
  | 'connectors'
  | 'infrastructure';

export type MetricId =
  | 'revenue'
  | 'profit'
  | 'gross-margin'
  | 'pipeline'
  | 'conversion'
  | 'machine-utilization'
  | 'production-time'
  | 'downtime'
  | 'quality-score'
  | 'customer-satisfaction'
  | 'workflow-success'
  | 'mission-success'
  | 'worker-productivity'
  | 'ai-cost'
  | 'ai-tokens'
  | 'knowledge-growth'
  | 'search-usage'
  | 'marketplace-downloads'
  | 'connector-health';

export type DashboardId =
  | 'ceo'
  | 'finance'
  | 'operations'
  | 'sales'
  | 'production'
  | 'warehouse'
  | 'customer-success'
  | 'ai-operations'
  | 'platform-health'
  | 'marketplace';

export type ChartType =
  | 'kpi-card'
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'heatmap'
  | 'treemap'
  | 'scatter'
  | 'timeline'
  | 'gantt'
  | 'geo-map'
  | 'table';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type AlertType = 'threshold' | 'trend' | 'anomaly' | 'sla' | 'kpi';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface AnalyticsRequest {
  readonly organizationId: string;
  readonly domain?: AnalyticsDomain;
  readonly dashboardId?: DashboardId;
  readonly period?: ReportPeriod;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly correlationId?: string;
}

export interface KpiValue {
  readonly id: MetricId;
  readonly label: string;
  readonly value: number | string;
  readonly unit?: string;
  readonly change?: number;
  readonly trend?: 'up' | 'down' | 'flat';
}

export interface ChartSeries {
  readonly name: string;
  readonly data: readonly { readonly x: string; readonly y: number }[];
}

export interface ChartData {
  readonly type: ChartType;
  readonly title: string;
  readonly series: readonly ChartSeries[];
}

export interface DashboardData {
  readonly id: DashboardId;
  readonly name: string;
  readonly domain: AnalyticsDomain;
  readonly kpis: readonly KpiValue[];
  readonly charts: readonly ChartData[];
  readonly generatedAt: string;
}

export interface MetricSnapshot {
  readonly id: MetricId;
  readonly domain: AnalyticsDomain;
  readonly value: number;
  readonly unit: string;
  readonly timestamp: string;
}

export interface ReportDefinition {
  readonly id: string;
  readonly name: string;
  readonly period: ReportPeriod;
  readonly domain: AnalyticsDomain;
  readonly metrics: readonly MetricId[];
}

export interface AlertDefinition {
  readonly id: string;
  readonly type: AlertType;
  readonly metricId: MetricId;
  readonly threshold?: number;
  readonly message: string;
  readonly status: 'active' | 'triggered' | 'resolved';
}

export interface ExportJob {
  readonly id: string;
  readonly format: ExportFormat;
  readonly dashboardId?: DashboardId;
  readonly status: 'pending' | 'completed' | 'failed';
  readonly downloadUrl?: string;
  readonly createdAt: string;
}

export interface AnalyticsPipelineResult {
  readonly steps: readonly { readonly step: PipelineStepId; readonly durationMs: number }[];
  readonly dashboard?: DashboardData;
  readonly metrics: readonly MetricSnapshot[];
  readonly latencyMs: number;
  readonly correlationId: string;
}

export const ANALYTICS_DOMAINS: readonly AnalyticsDomain[] = [
  'executive', 'sales', 'finance', 'operations', 'production', 'projects',
  'customers', 'products', 'marketplace', 'extensions', 'ai-workforce',
  'ai-runtime', 'workflow', 'missions', 'knowledge', 'search', 'connectors', 'infrastructure',
];

export const METRIC_IDS: readonly MetricId[] = [
  'revenue', 'profit', 'gross-margin', 'pipeline', 'conversion',
  'machine-utilization', 'production-time', 'downtime', 'quality-score',
  'customer-satisfaction', 'workflow-success', 'mission-success', 'worker-productivity',
  'ai-cost', 'ai-tokens', 'knowledge-growth', 'search-usage', 'marketplace-downloads', 'connector-health',
];

export const DASHBOARD_IDS: readonly DashboardId[] = [
  'ceo', 'finance', 'operations', 'sales', 'production', 'warehouse',
  'customer-success', 'ai-operations', 'platform-health', 'marketplace',
];

export const PIPELINE_STEPS = [
  'collect',
  'normalize',
  'aggregate',
  'calculate-metrics',
  'generate-kpis',
  'prepare-dashboard',
  'return',
] as const;

export type PipelineStepId = (typeof PIPELINE_STEPS)[number];

export const CHART_TYPES: readonly ChartType[] = [
  'kpi-card', 'line', 'bar', 'area', 'pie', 'heatmap', 'treemap',
  'scatter', 'timeline', 'gantt', 'geo-map', 'table',
];
