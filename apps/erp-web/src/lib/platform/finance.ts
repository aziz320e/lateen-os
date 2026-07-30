/** Finance adapter — calls `apps/backend`'s real `/api/v1/finance/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { ARInvoice } from './types';

export async function listInvoices(
  params: { limit?: number; offset?: number } = {},
): Promise<{ invoices: readonly ARInvoice[]; total: number }> {
  const page = await apiGetPaged<ARInvoice>('/api/v1/finance/ar/invoices', params);
  return { invoices: page.data, total: page.meta.total };
}

export async function getInvoice(id: string): Promise<ARInvoice | null> {
  return apiGet<ARInvoice | null>(`/api/v1/finance/ar/invoices/${id}`);
}

export async function getFinanceSummary(): Promise<{
  accountCount: number;
  invoiceCount: number;
  billCount: number;
}> {
  const [accounts, invoices, bills] = await Promise.all([
    apiGetPaged<unknown>('/api/v1/finance/accounts', { limit: 1 }),
    apiGetPaged<ARInvoice>('/api/v1/finance/ar/invoices', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/finance/ap/bills', { limit: 1 }),
  ]);
  return {
    accountCount: accounts.meta.total,
    invoiceCount: invoices.meta.total,
    billCount: bills.meta.total,
  };
}
