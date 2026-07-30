/**
 * CRM adapter — calls `apps/backend`'s real `/api/v1/crm/*` REST API
 * (built in Task 4) exclusively through `src/lib/api/client.ts`. No
 * `@lateen-os/crm-engine` import, no runtime construction, no
 * repository access — every number here is what the backend's real
 * `crm-engine` runtime reports right now.
 */
import { apiGet, apiGetPaged } from '../api/client';
import type { Customer, Lead } from './types';

export async function listCustomers(
  params: { limit?: number; offset?: number } = {},
): Promise<{ customers: readonly Customer[]; total: number }> {
  const page = await apiGetPaged<Customer>('/api/v1/crm/customers', params);
  return { customers: page.data, total: page.meta.total };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return apiGet<Customer | null>(`/api/v1/crm/customers/${id}`);
}

export async function listLeads(
  params: { limit?: number; offset?: number } = {},
): Promise<{ leads: readonly Lead[]; total: number }> {
  const page = await apiGetPaged<Lead>('/api/v1/crm/leads', params);
  return { leads: page.data, total: page.meta.total };
}

export async function getCrmSummary(): Promise<{
  customerCount: number;
  leadCount: number;
  opportunityCount: number;
}> {
  const [customers, leads, opportunities] = await Promise.all([
    apiGetPaged<Customer>('/api/v1/crm/customers', { limit: 1 }),
    apiGetPaged<Lead>('/api/v1/crm/leads', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/crm/opportunities', { limit: 1 }),
  ]);
  return {
    customerCount: customers.meta.total,
    leadCount: leads.meta.total,
    opportunityCount: opportunities.meta.total,
  };
}
