/** Real, in-memory Inventory Stock repository. @module stock/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { StockLevelRepository } from './repository.js';
import type { StockLevel } from './types.js';

/** Creates a real, in-memory {@link StockLevelRepository}. */
export function createStockLevelRepository(seed?: readonly StockLevel[]): StockLevelRepository {
  const repo = createInMemoryRepository<StockLevel>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByItem(organizationId, itemId) {
      return repo.list(organizationId).filter((level) => level.itemId === itemId);
    },
    async findByWarehouse(organizationId, warehouseId) {
      return repo.list(organizationId).filter((level) => level.warehouseId === warehouseId);
    },
    async findByItemAndWarehouse(organizationId, itemId, warehouseId) {
      return repo.list(organizationId).find((level) => level.itemId === itemId && level.warehouseId === warehouseId) ?? null;
    },
  };
}
