/**
 * Persistence adapter — Inventory Engine (Warehouse). Reads via
 * `queries.findWarehouses()`. Unlike the other adapters, there is no
 * `warehouse.created` event in `inventory-engine`'s real event map (its
 * events are all stock-movement events — received/issued/reserved/
 * released/adjusted/transferred), so this adapter has no `subscribe()`
 * — `mirrorWarehouses()` is called at seed time and can be re-run for
 * reconciliation, but there is nothing to subscribe to for real-time
 * capture without inventing an event that does not exist.
 */
import type { PrismaClient } from '@prisma/client';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';

export async function mirrorWarehouses(
  prisma: PrismaClient,
  runtime: InventoryRuntime,
  organizationId: string,
): Promise<void> {
  const { warehouses } = await runtime.queries.findWarehouses({ organizationId });
  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { id: warehouse.id },
      create: {
        id: warehouse.id,
        organizationId,
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address ?? null,
      },
      update: {
        name: warehouse.name,
        address: warehouse.address ?? null,
      },
    });
  }
}
