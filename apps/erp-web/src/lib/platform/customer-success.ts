/** Customer Success adapter — calls `apps/backend`'s real `/api/v1/customer-success/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { CustomerSuccessRecord } from './types';

export async function listCustomerSuccessRecords(
  params: { limit?: number; offset?: number } = {},
): Promise<{ records: readonly CustomerSuccessRecord[]; total: number }> {
  const page = await apiGetPaged<CustomerSuccessRecord>('/api/v1/customer-success/records', params);
  return { records: page.data, total: page.meta.total };
}

export async function getCustomerSuccessRecord(id: string): Promise<CustomerSuccessRecord | null> {
  return apiGet<CustomerSuccessRecord | null>(`/api/v1/customer-success/records/${id}`);
}

export async function getCustomerSuccessSummary(): Promise<{
  recordCount: number;
  riskCount: number;
}> {
  const [records, risks] = await Promise.all([
    apiGetPaged<CustomerSuccessRecord>('/api/v1/customer-success/records', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/customer-success/risks', { limit: 1 }),
  ]);
  return { recordCount: records.meta.total, riskCount: risks.meta.total };
}
