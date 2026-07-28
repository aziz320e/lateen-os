/** @module valuation/types */
import type { InventoryItemId } from '../item/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CostLayerId, ValuationRecordId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WarehouseId } from '../warehouse/types.js';

export type { CostLayerId, ValuationRecordId };

/** The two deterministic costing methods Stock Valuation supports. */
export type ValuationMethod = 'fifo' | 'weighted_average';

/** One FIFO receipt layer — consumed oldest-first on issue. */
export interface CostLayer extends TenantAuditableEntity<CostLayerId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantityRemaining: string;
  readonly unitCost: string;
  readonly receivedAt: ISODateTime;
}

/** The running weighted-average cost for one (item, warehouse). One record per pair — every receipt updates it in place. */
export interface WeightedAverageCost extends TenantAuditableEntity<ValuationRecordId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly averageCost: string;
  readonly totalQuantity: string;
}

/** A persisted snapshot of one issue's deterministic valuation. */
export interface ValuationRecord extends TenantAuditableEntity<ValuationRecordId> {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly method: ValuationMethod;
  readonly quantity: string;
  readonly unitCost: string;
  readonly totalValue: string;
  readonly computedAt: ISODateTime;
}
