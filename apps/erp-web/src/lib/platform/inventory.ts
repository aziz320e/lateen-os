/** Inventory adapter — calls `apps/backend`'s real `/api/v1/inventory/*` REST API exclusively through `src/lib/api/client.ts`. */
import { apiGet, apiGetPaged } from '../api/client';
import type { InventoryItem } from './types';

export async function listItems(
  params: { limit?: number; offset?: number } = {},
): Promise<{ items: readonly InventoryItem[]; total: number }> {
  const page = await apiGetPaged<InventoryItem>('/api/v1/inventory/items', params);
  return { items: page.data, total: page.meta.total };
}

export async function getItem(id: string): Promise<InventoryItem | null> {
  return apiGet<InventoryItem | null>(`/api/v1/inventory/items/${id}`);
}

export async function getInventorySummary(): Promise<{
  itemCount: number;
  warehouseCount: number;
}> {
  const [items, warehouses] = await Promise.all([
    apiGetPaged<InventoryItem>('/api/v1/inventory/items', { limit: 1 }),
    apiGetPaged<unknown>('/api/v1/inventory/warehouses', { limit: 1 }),
  ]);
  return { itemCount: items.meta.total, warehouseCount: warehouses.meta.total };
}
