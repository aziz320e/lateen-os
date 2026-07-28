/** @module movement/types */
import type { InventoryItemId } from '../item/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MovementRecordId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WarehouseId } from '../warehouse/types.js';

export type { MovementRecordId };

/** The seven movement types Inventory Movements supports. */
export type MovementType = 'receive' | 'issue' | 'transfer' | 'adjustment' | 'return' | 'reservation' | 'release';

/**
 * One immutable movement history entry. Every stock-affecting
 * operation creates exactly one of these — there is no update or
 * delete on the engine's public surface.
 */
export interface MovementRecord extends TenantAuditableEntity<MovementRecordId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly movementType: MovementType;
  /** Signed for `adjustment` (negative reduces on-hand); unsigned magnitude for every other type. */
  readonly quantity: string;
  readonly fromWarehouseId?: WarehouseId;
  readonly toWarehouseId?: WarehouseId;
  readonly reason?: string;
  readonly referenceId?: string;
  readonly occurredAt: ISODateTime;
}
