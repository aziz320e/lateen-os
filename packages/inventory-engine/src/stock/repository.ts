/** @module stock/repository */
import type { InventoryItemId } from '../item/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, StockLevelId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { StockLevel } from './types.js';

export interface StockLevelRepository extends Repository<StockLevel, StockLevelId> {
  findAll(organizationId: OrganizationId): Promise<readonly StockLevel[]>;
  findByItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<readonly StockLevel[]>;
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly StockLevel[]>;
  findByItemAndWarehouse(organizationId: OrganizationId, itemId: InventoryItemId, warehouseId: WarehouseId): Promise<StockLevel | null>;
}
