/** Real, in-memory Warehouse Management repositories. @module warehouse/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BinRepository, StorageLocationRepository, WarehouseRepository, ZoneRepository } from './repository.js';
import type { Bin, StorageLocation, Warehouse, Zone } from './types.js';

/** Creates a real, in-memory {@link WarehouseRepository}. */
export function createWarehouseRepository(seed?: readonly Warehouse[]): WarehouseRepository {
  const repo = createInMemoryRepository<Warehouse>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link ZoneRepository}. */
export function createZoneRepository(seed?: readonly Zone[]): ZoneRepository {
  const repo = createInMemoryRepository<Zone>({ seed });
  return {
    ...repo,
    async findByWarehouse(organizationId, warehouseId) {
      return repo.list(organizationId).filter((zone) => zone.warehouseId === warehouseId);
    },
  };
}

/** Creates a real, in-memory {@link StorageLocationRepository}. */
export function createStorageLocationRepository(seed?: readonly StorageLocation[]): StorageLocationRepository {
  const repo = createInMemoryRepository<StorageLocation>({ seed });
  return {
    ...repo,
    async findByWarehouse(organizationId, warehouseId) {
      return repo.list(organizationId).filter((location) => location.warehouseId === warehouseId);
    },
    async findByZone(organizationId, zoneId) {
      return repo.list(organizationId).filter((location) => location.zoneId === zoneId);
    },
  };
}

/** Creates a real, in-memory {@link BinRepository}. */
export function createBinRepository(seed?: readonly Bin[]): BinRepository {
  const repo = createInMemoryRepository<Bin>({ seed });
  return {
    ...repo,
    async findByLocation(organizationId, locationId) {
      return repo.list(organizationId).filter((bin) => bin.locationId === locationId);
    },
  };
}
