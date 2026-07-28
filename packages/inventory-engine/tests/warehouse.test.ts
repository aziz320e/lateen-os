import { describe, expect, it } from 'vitest';
import { canTransitionWarehouseEntity, computeRemainingCapacity, createWarehouseManagementEngine } from '../src/warehouse/engine.impl.js';
import { createBinRepository, createStorageLocationRepository, createWarehouseRepository, createZoneRepository } from '../src/warehouse/repository.impl.js';
import { BinNotFoundError, InvalidWarehouseTransitionError, StorageLocationNotFoundError, WarehouseNotFoundError, ZoneNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const warehouseRepository = createWarehouseRepository();
  const zoneRepository = createZoneRepository();
  const locationRepository = createStorageLocationRepository();
  const binRepository = createBinRepository();
  const engine = createWarehouseManagementEngine(warehouseRepository, zoneRepository, locationRepository, binRepository);
  return { warehouseRepository, zoneRepository, locationRepository, binRepository, engine };
}

describe('canTransitionWarehouseEntity (pure)', () => {
  it('allows active -> archived', () => {
    expect(canTransitionWarehouseEntity('active', 'archived')).toBe(true);
  });

  it('rejects archived -> active', () => {
    expect(canTransitionWarehouseEntity('archived', 'active')).toBe(false);
  });

  it('rejects active -> active (a no-op is not a transition)', () => {
    expect(canTransitionWarehouseEntity('active', 'active')).toBe(false);
  });
});

describe('computeRemainingCapacity (pure)', () => {
  it('computes remaining capacity', () => {
    expect(computeRemainingCapacity(100, 40)).toBe(60);
  });

  it('never goes negative', () => {
    expect(computeRemainingCapacity(10, 40)).toBe(0);
  });

  it('is undefined when no capacity is configured', () => {
    expect(computeRemainingCapacity(undefined, 40)).toBeUndefined();
  });
});

describe('WarehouseManagementEngine — warehouses', () => {
  it('createWarehouse() starts active', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    expect(warehouse.status).toBe('active');
  });

  it('updateWarehouse() updates name/address', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const updated = await engine.updateWarehouse(ORG, warehouse.id, { name: 'Updated', address: '123 Main St' });
    expect(updated.name).toBe('Updated');
    expect(updated.address).toBe('123 Main St');
  });

  it('rejects updating an archived warehouse', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    await engine.archiveWarehouse(ORG, warehouse.id);
    await expect(engine.updateWarehouse(ORG, warehouse.id, { name: 'x' })).rejects.toBeInstanceOf(InvalidWarehouseTransitionError);
  });

  it('archiveWarehouse()/restoreWarehouse() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const archived = await engine.archiveWarehouse(ORG, warehouse.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreWarehouse(ORG, warehouse.id);
    expect(restored.status).toBe('active');
  });

  it('rejects archiving an already-archived warehouse', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    await engine.archiveWarehouse(ORG, warehouse.id);
    await expect(engine.archiveWarehouse(ORG, warehouse.id)).rejects.toBeInstanceOf(InvalidWarehouseTransitionError);
  });

  it('rejects restoring a non-archived warehouse', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    await expect(engine.restoreWarehouse(ORG, warehouse.id)).rejects.toBeInstanceOf(InvalidWarehouseTransitionError);
  });

  it('throws WarehouseNotFoundError for an unknown warehouse', async () => {
    const { engine } = setup();
    await expect(engine.updateWarehouse(ORG, 'missing', {})).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('getWarehouse()/listWarehouses() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    expect(await engine.getWarehouse(ORG, warehouse.id)).toEqual(warehouse);
    expect(await engine.listWarehouses(ORG)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, warehouseRepository } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    expect(await warehouseRepository.findById('org-2', warehouse.id)).toBeNull();
  });
});

describe('WarehouseManagementEngine — zones', () => {
  it('createZone() starts active and validates the warehouse exists', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    expect(zone.status).toBe('active');
  });

  it('throws WarehouseNotFoundError for an unknown warehouse', async () => {
    const { engine } = setup();
    await expect(engine.createZone(ORG, { warehouseId: 'missing', code: 'Z1', name: 'Receiving' })).rejects.toBeInstanceOf(WarehouseNotFoundError);
  });

  it('archiveZone()/restoreZone() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    const archived = await engine.archiveZone(ORG, zone.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreZone(ORG, zone.id);
    expect(restored.status).toBe('active');
  });

  it('throws ZoneNotFoundError for an unknown zone', async () => {
    const { engine } = setup();
    await expect(engine.archiveZone(ORG, 'missing')).rejects.toBeInstanceOf(ZoneNotFoundError);
  });

  it('findZonesByWarehouse() filters correctly', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const other = await engine.createWarehouse(ORG, { code: 'WH2', name: 'Other Warehouse' });
    await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    await engine.createZone(ORG, { warehouseId: other.id, code: 'Z2', name: 'Shipping' });
    expect(await engine.findZonesByWarehouse(ORG, warehouse.id)).toHaveLength(1);
  });
});

describe('WarehouseManagementEngine — storage locations', () => {
  it('createStorageLocation() validates the warehouse (and zone, if given) exist', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, zoneId: zone.id, code: 'A1', name: 'Aisle 1', capacity: 100 });
    expect(location.status).toBe('active');
    expect(location.capacity).toBe(100);
  });

  it('throws ZoneNotFoundError for an unknown zone', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    await expect(engine.createStorageLocation(ORG, { warehouseId: warehouse.id, zoneId: 'missing', code: 'A1', name: 'Aisle 1' })).rejects.toBeInstanceOf(
      ZoneNotFoundError,
    );
  });

  it('updateStorageLocation() updates name/capacity', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1', capacity: 100 });
    const updated = await engine.updateStorageLocation(ORG, location.id, { name: 'Aisle 1 Updated', capacity: 200 });
    expect(updated.name).toBe('Aisle 1 Updated');
    expect(updated.capacity).toBe(200);
  });

  it('archiveStorageLocation()/restoreStorageLocation() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    const archived = await engine.archiveStorageLocation(ORG, location.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreStorageLocation(ORG, location.id);
    expect(restored.status).toBe('active');
  });

  it('throws StorageLocationNotFoundError for an unknown location', async () => {
    const { engine } = setup();
    await expect(engine.updateStorageLocation(ORG, 'missing', {})).rejects.toBeInstanceOf(StorageLocationNotFoundError);
  });

  it('getStorageLocation()/findLocationsByWarehouse()/findLocationsByZone() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, zoneId: zone.id, code: 'A1', name: 'Aisle 1' });
    expect(await engine.getStorageLocation(ORG, location.id)).toEqual(location);
    expect(await engine.findLocationsByWarehouse(ORG, warehouse.id)).toHaveLength(1);
    expect(await engine.findLocationsByZone(ORG, zone.id)).toHaveLength(1);
  });
});

describe('WarehouseManagementEngine — full hierarchy composition', () => {
  it('supports warehouse -> zone -> storage location -> bin end to end', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Bulk Storage' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, zoneId: zone.id, code: 'A1', name: 'Aisle 1', capacity: 500 });
    const bin = await engine.createBin(ORG, { locationId: location.id, code: 'BIN-1', capacity: 50 });
    expect(bin.locationId).toBe(location.id);
    expect(location.zoneId).toBe(zone.id);
    expect(location.warehouseId).toBe(warehouse.id);
    expect(zone.warehouseId).toBe(warehouse.id);
  });

  it('a storage location may omit a zone', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    expect(location.zoneId).toBeUndefined();
  });
});

describe('WarehouseManagementEngine — org scoping across the hierarchy', () => {
  it('zones/locations/bins are organization-scoped', async () => {
    const { engine, zoneRepository, locationRepository, binRepository } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const zone = await engine.createZone(ORG, { warehouseId: warehouse.id, code: 'Z1', name: 'Receiving' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    const bin = await engine.createBin(ORG, { locationId: location.id, code: 'BIN-1' });
    expect(await zoneRepository.findById('org-2', zone.id)).toBeNull();
    expect(await locationRepository.findById('org-2', location.id)).toBeNull();
    expect(await binRepository.findById('org-2', bin.id)).toBeNull();
  });
});

describe('WarehouseManagementEngine — updateStorageLocation preserves fields not in the patch', () => {
  it('preserves capacity when only name is updated', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1', capacity: 100 });
    const updated = await engine.updateStorageLocation(ORG, location.id, { name: 'Aisle 1 Updated' });
    expect(updated.capacity).toBe(100);
  });
});

describe('WarehouseManagementEngine — multiple warehouses are independent', () => {
  it('archiving one warehouse does not affect another', async () => {
    const { engine } = setup();
    const warehouseA = await engine.createWarehouse(ORG, { code: 'WH1', name: 'A' });
    const warehouseB = await engine.createWarehouse(ORG, { code: 'WH2', name: 'B' });
    await engine.archiveWarehouse(ORG, warehouseA.id);
    const stillB = await engine.getWarehouse(ORG, warehouseB.id);
    expect(stillB?.status).toBe('active');
  });
});

describe('WarehouseManagementEngine — bins', () => {
  it('createBin() validates the location exists', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    const bin = await engine.createBin(ORG, { locationId: location.id, code: 'BIN-1', capacity: 50 });
    expect(bin.status).toBe('active');
    expect(bin.capacity).toBe(50);
  });

  it('throws StorageLocationNotFoundError for an unknown location', async () => {
    const { engine } = setup();
    await expect(engine.createBin(ORG, { locationId: 'missing', code: 'BIN-1' })).rejects.toBeInstanceOf(StorageLocationNotFoundError);
  });

  it('archiveBin()/restoreBin() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    const bin = await engine.createBin(ORG, { locationId: location.id, code: 'BIN-1' });
    const archived = await engine.archiveBin(ORG, bin.id);
    expect(archived.status).toBe('archived');
    const restored = await engine.restoreBin(ORG, bin.id);
    expect(restored.status).toBe('active');
  });

  it('throws BinNotFoundError for an unknown bin', async () => {
    const { engine } = setup();
    await expect(engine.archiveBin(ORG, 'missing')).rejects.toBeInstanceOf(BinNotFoundError);
  });

  it('getBin()/findBinsByLocation() round-trip', async () => {
    const { engine } = setup();
    const warehouse = await engine.createWarehouse(ORG, { code: 'WH1', name: 'Main Warehouse' });
    const location = await engine.createStorageLocation(ORG, { warehouseId: warehouse.id, code: 'A1', name: 'Aisle 1' });
    const bin = await engine.createBin(ORG, { locationId: location.id, code: 'BIN-1' });
    expect(await engine.getBin(ORG, bin.id)).toEqual(bin);
    expect(await engine.findBinsByLocation(ORG, location.id)).toHaveLength(1);
  });
});
