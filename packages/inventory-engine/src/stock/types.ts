/** @module stock/types */
import type { InventoryItemId } from '../item/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { StockLevelId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';

export type { StockLevelId };

/** One item's stock position at one warehouse — the deterministic source of truth for on-hand/reserved/damaged quantities. */
export interface StockLevel extends TenantAuditableEntity<StockLevelId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantityOnHand: string;
  readonly reservedQuantity: string;
  readonly damagedQuantity: string;
  readonly minimumStock?: string;
  readonly maximumStock?: string;
  readonly reorderPoint?: string;
}
