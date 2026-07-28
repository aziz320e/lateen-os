/** @module counting/types */
import type { InventoryItemId } from '../item/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { InventoryCountId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WarehouseId } from '../warehouse/types.js';

export type { InventoryCountId };

export type CountType = 'cycle' | 'full';

export type CountStatus = 'draft' | 'in_progress' | 'completed';

/** One item's expected-vs-counted line within an {@link InventoryCount}. */
export interface CountLine {
  readonly itemId: InventoryItemId;
  readonly systemQuantity: string;
  readonly countedQuantity?: string;
  readonly variance?: string;
}

/** A cycle or full physical inventory count for one warehouse. */
export interface InventoryCount extends TenantAuditableEntity<InventoryCountId> {
  readonly countType: CountType;
  readonly warehouseId: WarehouseId;
  readonly lines: readonly CountLine[];
  readonly status: CountStatus;
  readonly startedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
}
