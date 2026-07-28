/** @module movement/repository */
import type { InventoryItemId } from '../item/types.js';
import type { Repository } from '../shared/repository.js';
import type { MovementRecordId, OrganizationId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { MovementRecord, MovementType } from './types.js';

export interface MovementRecordRepository extends Repository<MovementRecord, MovementRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly MovementRecord[]>;
  findByItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<readonly MovementRecord[]>;
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly MovementRecord[]>;
  findByType(organizationId: OrganizationId, movementType: MovementType): Promise<readonly MovementRecord[]>;
}
