/** @module events/inventory-events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type InventoryItemCreatedEvent = DomainEvent<
  'inventory.item.created',
  { readonly organizationId: string; readonly itemId: string; readonly sku: string }
>;

export type InventoryReceivedEvent = DomainEvent<
  'inventory.received',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryIssuedEvent = DomainEvent<
  'inventory.issued',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryTransferredEvent = DomainEvent<
  'inventory.transferred',
  { readonly organizationId: string; readonly itemId: string; readonly fromWarehouseId: string; readonly toWarehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryAdjustedEvent = DomainEvent<
  'inventory.adjusted',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryReservedEvent = DomainEvent<
  'inventory.reserved',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryReleasedEvent = DomainEvent<
  'inventory.released',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly quantity: string; readonly movementId: string }
>;

export type InventoryCountCompletedEvent = DomainEvent<
  'inventory.count.completed',
  { readonly organizationId: string; readonly countId: string; readonly varianceCount: number }
>;

export type InventoryShortageDetectedEvent = DomainEvent<
  'inventory.shortage.detected',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly available: string }
>;

export type InventoryReorderRecommendedEvent = DomainEvent<
  'inventory.reorder.recommended',
  { readonly organizationId: string; readonly itemId: string; readonly warehouseId: string; readonly suggestedQuantity: string }
>;

/** Canonical event names for external subscribers. */
export const INVENTORY_EVENT_NAMES = {
  ItemCreated: 'inventory.item.created',
  Received: 'inventory.received',
  Issued: 'inventory.issued',
  Transferred: 'inventory.transferred',
  Adjusted: 'inventory.adjusted',
  Reserved: 'inventory.reserved',
  Released: 'inventory.released',
  CountCompleted: 'inventory.count.completed',
  ShortageDetected: 'inventory.shortage.detected',
  ReorderRecommended: 'inventory.reorder.recommended',
} as const;

/** Union of all Inventory Engine domain events. */
export type InventoryDomainEvent =
  | InventoryItemCreatedEvent
  | InventoryReceivedEvent
  | InventoryIssuedEvent
  | InventoryTransferredEvent
  | InventoryAdjustedEvent
  | InventoryReservedEvent
  | InventoryReleasedEvent
  | InventoryCountCompletedEvent
  | InventoryShortageDetectedEvent
  | InventoryReorderRecommendedEvent;
