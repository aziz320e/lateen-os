/** Sales adapter — calls `apps/backend`'s real `/api/v1/sales/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { SalesOpportunity } from './types';

export async function listOpportunities(
  params: { limit?: number; offset?: number } = {},
): Promise<{ opportunities: readonly SalesOpportunity[]; total: number }> {
  const page = await apiGetPaged<SalesOpportunity>('/api/v1/sales/opportunities', params);
  return { opportunities: page.data, total: page.meta.total };
}

export async function getOpportunity(id: string): Promise<SalesOpportunity | null> {
  return apiGet<SalesOpportunity | null>(`/api/v1/sales/opportunities/${id}`);
}

export async function getSalesSummary(): Promise<{ opportunityCount: number; quoteCount: number }> {
  const [opportunities, quotes] = await Promise.all([
    apiGetPaged<SalesOpportunity>('/api/v1/sales/opportunities', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/sales/quotes', { limit: 1 }),
  ]);
  return { opportunityCount: opportunities.meta.total, quoteCount: quotes.meta.total };
}
