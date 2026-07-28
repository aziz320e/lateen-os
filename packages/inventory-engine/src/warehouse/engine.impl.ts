/**
 * Real Warehouse Management engine — warehouses, zones, storage
 * locations, and bins, each with a guarded
 * create/update/archive/restore lifecycle and a deterministic
 * remaining-capacity calculation.
 *
 * @module warehouse/engine.impl
 */
import {
  BinNotFoundError,
  InvalidWarehouseTransitionError,
  StorageLocationNotFoundError,
  WarehouseNotFoundError,
  ZoneNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { BinId, OrganizationId, StorageLocationId, WarehouseId, ZoneId } from '../shared/identifiers.js';
import type { BinRepository, StorageLocationRepository, WarehouseRepository, ZoneRepository } from './repository.js';
import type { Bin, StorageLocation, Warehouse, Zone } from './types.js';

/** Whether a warehouse/zone/location/bin may transition from one status to another via the ordinary lifecycle (not `restore()`). Shared across all four since they use the same 2-state model. */
export function canTransitionWarehouseEntity(from: 'active' | 'archived', to: 'active' | 'archived'): boolean {
  return from === 'active' && to === 'archived';
}

/** Pure: remaining capacity given a total capacity and amount used. `undefined` when no capacity limit was configured. Never negative. */
export function computeRemainingCapacity(capacity: number | undefined, used: number): number | undefined {
  if (capacity === undefined) return undefined;
  return Math.max(0, capacity - used);
}

export interface CreateWarehouseInput {
  readonly code: string;
  readonly name: string;
  readonly address?: string;
}

export interface UpdateWarehouseInput {
  readonly name?: string;
  readonly address?: string;
}

export interface CreateZoneInput {
  readonly warehouseId: WarehouseId;
  readonly code: string;
  readonly name: string;
}

export interface CreateStorageLocationInput {
  readonly warehouseId: WarehouseId;
  readonly zoneId?: ZoneId;
  readonly code: string;
  readonly name: string;
  readonly capacity?: number;
}

export interface UpdateStorageLocationInput {
  readonly name?: string;
  readonly capacity?: number;
}

export interface CreateBinInput {
  readonly locationId: StorageLocationId;
  readonly code: string;
  readonly capacity?: number;
}

export interface WarehouseManagementEngine {
  createWarehouse(organizationId: OrganizationId, input: CreateWarehouseInput): Promise<Warehouse>;
  updateWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId, input: UpdateWarehouseInput): Promise<Warehouse>;
  archiveWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<Warehouse>;
  restoreWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<Warehouse>;
  getWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<Warehouse | null>;
  listWarehouses(organizationId: OrganizationId): Promise<readonly Warehouse[]>;

  createZone(organizationId: OrganizationId, input: CreateZoneInput): Promise<Zone>;
  archiveZone(organizationId: OrganizationId, zoneId: ZoneId): Promise<Zone>;
  restoreZone(organizationId: OrganizationId, zoneId: ZoneId): Promise<Zone>;
  findZonesByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly Zone[]>;

  createStorageLocation(organizationId: OrganizationId, input: CreateStorageLocationInput): Promise<StorageLocation>;
  updateStorageLocation(organizationId: OrganizationId, locationId: StorageLocationId, input: UpdateStorageLocationInput): Promise<StorageLocation>;
  archiveStorageLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<StorageLocation>;
  restoreStorageLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<StorageLocation>;
  getStorageLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<StorageLocation | null>;
  findLocationsByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly StorageLocation[]>;
  findLocationsByZone(organizationId: OrganizationId, zoneId: ZoneId): Promise<readonly StorageLocation[]>;

  createBin(organizationId: OrganizationId, input: CreateBinInput): Promise<Bin>;
  archiveBin(organizationId: OrganizationId, binId: BinId): Promise<Bin>;
  restoreBin(organizationId: OrganizationId, binId: BinId): Promise<Bin>;
  getBin(organizationId: OrganizationId, binId: BinId): Promise<Bin | null>;
  findBinsByLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<readonly Bin[]>;
}

/** Creates a real {@link WarehouseManagementEngine}. */
export function createWarehouseManagementEngine(
  warehouseRepository: WarehouseRepository,
  zoneRepository: ZoneRepository,
  locationRepository: StorageLocationRepository,
  binRepository: BinRepository,
  now: () => string = nowIso,
): WarehouseManagementEngine {
  async function requireWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<Warehouse> {
    const warehouse = await warehouseRepository.findById(organizationId, warehouseId);
    if (!warehouse) throw new WarehouseNotFoundError(warehouseId);
    return warehouse;
  }

  async function requireZone(organizationId: OrganizationId, zoneId: ZoneId): Promise<Zone> {
    const zone = await zoneRepository.findById(organizationId, zoneId);
    if (!zone) throw new ZoneNotFoundError(zoneId);
    return zone;
  }

  async function requireLocation(organizationId: OrganizationId, locationId: StorageLocationId): Promise<StorageLocation> {
    const location = await locationRepository.findById(organizationId, locationId);
    if (!location) throw new StorageLocationNotFoundError(locationId);
    return location;
  }

  async function requireBin(organizationId: OrganizationId, binId: BinId): Promise<Bin> {
    const bin = await binRepository.findById(organizationId, binId);
    if (!bin) throw new BinNotFoundError(binId);
    return bin;
  }

  return {
    async createWarehouse(organizationId, input) {
      const timestamp = now();
      const warehouse: Warehouse = {
        id: generateId('warehouse'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        address: input.address,
        status: 'active',
      };
      await warehouseRepository.save(warehouse);
      return warehouse;
    },

    async updateWarehouse(organizationId, warehouseId, input) {
      const warehouse = await requireWarehouse(organizationId, warehouseId);
      if (warehouse.status === 'archived') {
        throw new InvalidWarehouseTransitionError(warehouseId, warehouse.status, warehouse.status);
      }
      const updated: Warehouse = { ...warehouse, name: input.name ?? warehouse.name, address: input.address ?? warehouse.address, updatedAt: now() };
      await warehouseRepository.save(updated);
      return updated;
    },

    async archiveWarehouse(organizationId, warehouseId) {
      const warehouse = await requireWarehouse(organizationId, warehouseId);
      if (!canTransitionWarehouseEntity(warehouse.status, 'archived')) {
        throw new InvalidWarehouseTransitionError(warehouseId, warehouse.status, 'archived');
      }
      const updated: Warehouse = { ...warehouse, status: 'archived', updatedAt: now() };
      await warehouseRepository.save(updated);
      return updated;
    },

    async restoreWarehouse(organizationId, warehouseId) {
      const warehouse = await requireWarehouse(organizationId, warehouseId);
      if (warehouse.status !== 'archived') {
        throw new InvalidWarehouseTransitionError(warehouseId, warehouse.status, 'active');
      }
      const updated: Warehouse = { ...warehouse, status: 'active', updatedAt: now() };
      await warehouseRepository.save(updated);
      return updated;
    },

    async getWarehouse(organizationId, warehouseId) {
      return warehouseRepository.findById(organizationId, warehouseId);
    },

    async listWarehouses(organizationId) {
      return warehouseRepository.findAll(organizationId);
    },

    async createZone(organizationId, input) {
      await requireWarehouse(organizationId, input.warehouseId);
      const timestamp = now();
      const zone: Zone = {
        id: generateId('zone'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        warehouseId: input.warehouseId,
        code: input.code,
        name: input.name,
        status: 'active',
      };
      await zoneRepository.save(zone);
      return zone;
    },

    async archiveZone(organizationId, zoneId) {
      const zone = await requireZone(organizationId, zoneId);
      const updated: Zone = { ...zone, status: 'archived', updatedAt: now() };
      await zoneRepository.save(updated);
      return updated;
    },

    async restoreZone(organizationId, zoneId) {
      const zone = await requireZone(organizationId, zoneId);
      const updated: Zone = { ...zone, status: 'active', updatedAt: now() };
      await zoneRepository.save(updated);
      return updated;
    },

    async findZonesByWarehouse(organizationId, warehouseId) {
      return zoneRepository.findByWarehouse(organizationId, warehouseId);
    },

    async createStorageLocation(organizationId, input) {
      await requireWarehouse(organizationId, input.warehouseId);
      if (input.zoneId) await requireZone(organizationId, input.zoneId);
      const timestamp = now();
      const location: StorageLocation = {
        id: generateId('storage-location'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        warehouseId: input.warehouseId,
        zoneId: input.zoneId,
        code: input.code,
        name: input.name,
        capacity: input.capacity,
        status: 'active',
      };
      await locationRepository.save(location);
      return location;
    },

    async updateStorageLocation(organizationId, locationId, input) {
      const location = await requireLocation(organizationId, locationId);
      const updated: StorageLocation = {
        ...location,
        name: input.name ?? location.name,
        capacity: input.capacity ?? location.capacity,
        updatedAt: now(),
      };
      await locationRepository.save(updated);
      return updated;
    },

    async archiveStorageLocation(organizationId, locationId) {
      const location = await requireLocation(organizationId, locationId);
      const updated: StorageLocation = { ...location, status: 'archived', updatedAt: now() };
      await locationRepository.save(updated);
      return updated;
    },

    async restoreStorageLocation(organizationId, locationId) {
      const location = await requireLocation(organizationId, locationId);
      const updated: StorageLocation = { ...location, status: 'active', updatedAt: now() };
      await locationRepository.save(updated);
      return updated;
    },

    async getStorageLocation(organizationId, locationId) {
      return locationRepository.findById(organizationId, locationId);
    },

    async findLocationsByWarehouse(organizationId, warehouseId) {
      return locationRepository.findByWarehouse(organizationId, warehouseId);
    },

    async findLocationsByZone(organizationId, zoneId) {
      return locationRepository.findByZone(organizationId, zoneId);
    },

    async createBin(organizationId, input) {
      await requireLocation(organizationId, input.locationId);
      const timestamp = now();
      const bin: Bin = {
        id: generateId('bin'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        locationId: input.locationId,
        code: input.code,
        capacity: input.capacity,
        status: 'active',
      };
      await binRepository.save(bin);
      return bin;
    },

    async archiveBin(organizationId, binId) {
      const bin = await requireBin(organizationId, binId);
      const updated: Bin = { ...bin, status: 'archived', updatedAt: now() };
      await binRepository.save(updated);
      return updated;
    },

    async restoreBin(organizationId, binId) {
      const bin = await requireBin(organizationId, binId);
      const updated: Bin = { ...bin, status: 'active', updatedAt: now() };
      await binRepository.save(updated);
      return updated;
    },

    async getBin(organizationId, binId) {
      return binRepository.findById(organizationId, binId);
    },

    async findBinsByLocation(organizationId, locationId) {
      return binRepository.findByLocation(organizationId, locationId);
    },
  };
}
