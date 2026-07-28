/** Real, in-memory Stock Valuation repositories. @module valuation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import { compareAmounts } from '../shared/decimal.js';
import type { CostLayerRepository, ValuationRecordRepository, WeightedAverageCostRepository } from './repository.js';
import type { CostLayer, ValuationRecord, WeightedAverageCost } from './types.js';

/** Creates a real, in-memory {@link CostLayerRepository}. */
export function createCostLayerRepository(seed?: readonly CostLayer[]): CostLayerRepository {
  const repo = createInMemoryRepository<CostLayer>({ seed });
  return {
    ...repo,
    async findAvailableByItemAndWarehouse(organizationId, itemId, warehouseId) {
      return repo
        .list(organizationId)
        .filter((layer) => layer.itemId === itemId && layer.warehouseId === warehouseId && compareAmounts(layer.quantityRemaining, '0') > 0)
        .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : 0));
    },
  };
}

/** Creates a real, in-memory {@link WeightedAverageCostRepository}. */
export function createWeightedAverageCostRepository(seed?: readonly WeightedAverageCost[]): WeightedAverageCostRepository {
  const repo = createInMemoryRepository<WeightedAverageCost>({ seed });
  return {
    ...repo,
    async findByItemAndWarehouse(organizationId, itemId, warehouseId) {
      return repo.list(organizationId).find((record) => record.itemId === itemId && record.warehouseId === warehouseId) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link ValuationRecordRepository}. */
export function createValuationRecordRepository(seed?: readonly ValuationRecord[]): ValuationRecordRepository {
  const repo = createInMemoryRepository<ValuationRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByItem(organizationId, itemId) {
      return repo.list(organizationId).filter((record) => record.itemId === itemId);
    },
  };
}
