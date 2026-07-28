/** @module procurement/types */
import type { InventoryItemId } from '../item/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PurchaseRequestId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';

export type { PurchaseRequestId };

export type PurchaseRequestStatus = 'suggested' | 'acknowledged' | 'dismissed';

/**
 * A deterministic procurement recommendation — data only, never a
 * multi-step approval workflow (that belongs to Workflow Engine, if a
 * caller chooses to raise one via the Relationship Layer).
 */
export interface PurchaseRequest extends TenantAuditableEntity<PurchaseRequestId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantity: string;
  readonly status: PurchaseRequestStatus;
}

/** A computed (non-persisted) reorder recommendation for one (item, warehouse). */
export interface ReorderSuggestion {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly availableQuantity: string;
  readonly reorderPoint: string;
  readonly suggestedQuantity: string;
}

/** A computed (non-persisted) shortage detection for one (item, warehouse). */
export interface ShortageDetection {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly availableQuantity: string;
  readonly minimumStock: string;
}
