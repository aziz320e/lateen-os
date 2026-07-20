export interface KpiValue {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface ChartSeries {
  name: string;
  data: { x: string; y: number }[];
}

export interface ChartData {
  type: string;
  title: string;
  series: ChartSeries[];
}

export interface DashboardData {
  id: string;
  name: string;
  domain: string;
  kpis: KpiValue[];
  charts: ChartData[];
  generatedAt: string;
}

export interface AlertDefinition {
  id: string;
  type: string;
  metricId: string;
  threshold?: number;
  message: string;
  status: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  period: string;
  domain: string;
  metrics: string[];
}

export interface ExportJob {
  id: string;
  format: string;
  dashboardId?: string;
  status: string;
  downloadUrl?: string;
  createdAt: string;
}

export async function fetchDashboards(): Promise<{ id: string; name: string }[]> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to load dashboards');
  return res.json();
}

export async function fetchDashboard(id: string): Promise<DashboardData> {
  const res = await fetch(`/api/dashboard/${id}`);
  if (!res.ok) throw new Error('Dashboard not found');
  return res.json();
}

export async function fetchMetrics(organizationId = 'org-1'): Promise<unknown[]> {
  const res = await fetch(`/api/metrics?organizationId=${organizationId}`);
  if (!res.ok) throw new Error('Failed to load metrics');
  return res.json();
}

export async function fetchReports(): Promise<ReportDefinition[]> {
  const res = await fetch('/api/reports');
  if (!res.ok) throw new Error('Failed to load reports');
  return res.json();
}

export async function fetchAlerts(): Promise<AlertDefinition[]> {
  const res = await fetch('/api/alerts');
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

export async function fetchExports(organizationId = 'org-1'): Promise<ExportJob[]> {
  const res = await fetch(`/api/exports?organizationId=${organizationId}`);
  if (!res.ok) throw new Error('Failed to load exports');
  return res.json();
}

export async function createExport(format: string, dashboardId?: string): Promise<ExportJob> {
  const res = await fetch('/api/exports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: 'org-1', format, dashboardId }),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.json();
}

export async function runAnalytics(dashboardId: string) {
  const res = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId: 'org-1', dashboardId }),
  });
  if (!res.ok) throw new Error('Analytics failed');
  return res.json();
}
