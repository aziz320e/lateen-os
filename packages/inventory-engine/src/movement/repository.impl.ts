/** Real, in-memory Inventory Movements repository. @module movement/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { MovementRecordRepository } from './repository.js';
import type { MovementRecord } from './types.js';

/** Creates a real, in-memory {@link MovementRecordRepository}. */
export function createMovementRecordRepository(seed?: readonly MovementRecord[]): MovementRecordRepository {
  const repo = createInMemoryRepository<MovementRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByItem(organizationId, itemId) {
      return repo.list(organizationId).filter((movement) => movement.itemId === itemId);
    },
    async findByWarehouse(organizationId, warehouseId) {
      return repo.list(organizationId).filter((movement) => movement.warehouseId === warehouseId || movement.fromWarehouseId === warehouseId || movement.toWarehouseId === warehouseId);
    },
    async findByType(organizationId, movementType) {
      return repo.list(organizationId).filter((movement) => movement.movementType === movementType);
    },
  };
}
