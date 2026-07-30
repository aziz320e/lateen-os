/** Analytics adapter — calls `apps/backend`'s real `/api/v1/analytics/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { Dashboard } from './types';

export async function listDashboards(
  params: { limit?: number; offset?: number } = {},
): Promise<{ dashboards: readonly Dashboard[]; total: number }> {
  const page = await apiGetPaged<Dashboard>('/api/v1/analytics/dashboards', params);
  return { dashboards: page.data, total: page.meta.total };
}

export async function getDashboard(id: string): Promise<Dashboard | null> {
  return apiGet<Dashboard | null>(`/api/v1/analytics/dashboards/${id}`);
}

export async function getAnalyticsSummary(): Promise<{ dashboardCount: number; kpiCount: number }> {
  const [dashboards, kpis] = await Promise.all([
    apiGetPaged<Dashboard>('/api/v1/analytics/dashboards', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/analytics/kpis', { limit: 1 }),
  ]);
  return { dashboardCount: dashboards.meta.total, kpiCount: kpis.meta.total };
}
