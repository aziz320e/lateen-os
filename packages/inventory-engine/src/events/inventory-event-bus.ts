/**
 * Real, typed event bus for the Inventory Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/inventory-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type InventoryEventMap = {
  'inventory.item.created': { readonly organizationId: string; readonly itemId: string; readonly sku: string };
  'inventory.received': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.issued': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.transferred': { readonly organizationId: string; readonly itemId: string; readonly fromWarehouseId: string; readonly toWarehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.adjusted': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.reserved': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.released': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string };
  'inventory.count.completed': { readonly organizationId: string; readonly countId: string; readonly varianceCount: number };
  'inventory.shortage.detected': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly available: string };
  'inventory.reorder.recommended': { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly suggestedQuantity: string };
};

export type InventoryEventBus = EventBus<InventoryEventMap>;

/** Creates an in-memory {@link InventoryEventBus}. */
export function createInventoryEventBus(): InventoryEventBus {
  return createEventBus<InventoryEventMap>();
}
