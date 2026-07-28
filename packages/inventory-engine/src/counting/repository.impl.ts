/** Real, in-memory Inventory Counting repository. @module counting/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { InventoryCountRepository } from './repository.js';
import type { InventoryCount } from './types.js';

/** Creates a real, in-memory {@link InventoryCountRepository}. */
export function createInventoryCountRepository(seed?: readonly InventoryCount[]): InventoryCountRepository {
  const repo = createInMemoryRepository<InventoryCount>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByWarehouse(organizationId, warehouseId) {
      return repo.list(organizationId).filter((count) => count.warehouseId === warehouseId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((count) => count.status === status);
    },
  };
}
