/** @module valuation/repository */
import type { InventoryItemId } from '../item/types.js';
import type { Repository } from '../shared/repository.js';
import type { CostLayerId, OrganizationId, ValuationRecordId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { CostLayer, ValuationRecord, WeightedAverageCost } from './types.js';

export interface CostLayerRepository extends Repository<CostLayer, CostLayerId> {
  /** Layers with remaining quantity for (item, warehouse), oldest `receivedAt` first — the FIFO consumption order. */
  findAvailableByItemAndWarehouse(organizationId: OrganizationId, itemId: InventoryItemId, warehouseId: WarehouseId): Promise<readonly CostLayer[]>;
}

export interface WeightedAverageCostRepository extends Repository<WeightedAverageCost, ValuationRecordId> {
  findByItemAndWarehouse(organizationId: OrganizationId, itemId: InventoryItemId, warehouseId: WarehouseId): Promise<WeightedAverageCost | null>;
}

export interface ValuationRecordRepository extends Repository<ValuationRecord, ValuationRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly ValuationRecord[]>;
  findByItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<readonly ValuationRecord[]>;
}
