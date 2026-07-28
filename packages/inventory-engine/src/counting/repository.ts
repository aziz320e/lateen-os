/** @module counting/repository */
import type { Repository } from '../shared/repository.js';
import type { InventoryCountId, OrganizationId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { CountStatus, InventoryCount } from './types.js';

export interface InventoryCountRepository extends Repository<InventoryCount, InventoryCountId> {
  findAll(organizationId: OrganizationId): Promise<readonly InventoryCount[]>;
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly InventoryCount[]>;
  findByStatus(organizationId: OrganizationId, status: CountStatus): Promise<readonly InventoryCount[]>;
}
