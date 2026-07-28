/** @module warehouse/repository */
import type { Repository } from '../shared/repository.js';
import type { BinId, OrganizationId, StorageLocationId, WarehouseId, ZoneId } from '../shared/identifiers.js';
import type { Bin, StorageLocation, Warehouse, Zone } from './types.js';

export interface WarehouseRepository extends Repository<Warehouse, WarehouseId> {
  findAll(organizationId: OrganizationId): Promise<readonly Warehouse[]>;
}

export interface ZoneRepository extends Repository<Zone, ZoneId> {
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly Zone[]>;
}

export interface StorageLocationRepository extends Repository<StorageLocation, StorageLocationId> {
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly StorageLocation[]>;
  findByZone(organizationId: OrganizationId, zoneId: ZoneId): Promise<readonly StorageLocation[]>;
}

export interface BinRepository extends Repository<Bin, BinId> {
  findByLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<readonly Bin[]>;
}
