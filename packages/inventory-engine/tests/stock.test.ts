import { describe, expect, it } from 'vitest';
import {
  computeAvailableQuantity,
  createInventoryStockEngine,
  isAboveMaximum,
  isBelowMinimum,
  isBelowReorderPoint,
} from '../src/stock/engine.impl.js';
import { createStockLevelRepository } from '../src/stock/repository.impl.js';
import { InsufficientStockError, StockLevelNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const ITEM = 'item-1';
const WAREHOUSE = 'warehouse-1';

function setup() {
  const repository = createStockLevelRepository();
  const engine = createInventoryStockEngine(repository);
  return { repository, engine };
}

describe('computeAvailableQuantity (pure)', () => {
  it('subtracts reserved and damaged from on-hand', () => {
    expect(computeAvailableQuantity({ quantityOnHand: '100.00', reservedQuantity: '20.00', damagedQuantity: '5.00' })).toBe('75.00');
  });

  it('is the full on-hand quantity when nothing is reserved or damaged', () => {
    expect(computeAvailableQuantity({ quantityOnHand: '100.00', reservedQuantity: '0.00', damagedQuantity: '0.00' })).toBe('100.00');
  });
});

describe('isBelowReorderPoint (pure)', () => {
  it('is true at or below the reorder point', () => {
    expect(isBelowReorderPoint('10.00', '10.00')).toBe(true);
    expect(isBelowReorderPoint('5.00', '10.00')).toBe(true);
  });

  it('is false above the reorder point', () => {
    expect(isBelowReorderPoint('15.00', '10.00')).toBe(false);
  });

  it('is false when no reorder point is configured', () => {
    expect(isBelowReorderPoint('0.00', undefined)).toBe(false);
  });
});

describe('isBelowMinimum (pure)', () => {
  it('is true strictly below the minimum', () => {
    expect(isBelowMinimum('5.00', '10.00')).toBe(true);
  });

  it('is false at or above the minimum', () => {
    expect(isBelowMinimum('10.00', '10.00')).toBe(false);
    expect(isBelowMinimum('15.00', '10.00')).toBe(false);
  });

  it('is false when no minimum is configured', () => {
    expect(isBelowMinimum('0.00', undefined)).toBe(false);
  });
});

describe('isAboveMaximum (pure)', () => {
  it('is true strictly above the maximum', () => {
    expect(isAboveMaximum('110.00', '100.00')).toBe(true);
  });

  it('is false at or below the maximum', () => {
    expect(isAboveMaximum('100.00', '100.00')).toBe(false);
  });

  it('is false when no maximum is configured', () => {
    expect(isAboveMaximum('1000.00', undefined)).toBe(false);
  });
});

describe('InventoryStockEngine — getOrCreate', () => {
  it('creates a zeroed stock level on first use', async () => {
    const { engine } = setup();
    const level = await engine.getOrCreate(ORG, ITEM, WAREHOUSE);
    expect(level.quantityOnHand).toBe('0.00');
    expect(level.reservedQuantity).toBe('0.00');
    expect(level.damagedQuantity).toBe('0.00');
  });

  it('returns the same record on subsequent calls', async () => {
    const { engine } = setup();
    const first = await engine.getOrCreate(ORG, ITEM, WAREHOUSE);
    const second = await engine.getOrCreate(ORG, ITEM, WAREHOUSE);
    expect(second.id).toBe(first.id);
  });
});

describe('InventoryStockEngine — setThresholds', () => {
  it('sets minimum/maximum/reorder point', async () => {
    const { engine } = setup();
    const level = await engine.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00', maximumStock: '100.00', reorderPoint: '20.00' });
    expect(level.minimumStock).toBe('10.00');
    expect(level.maximumStock).toBe('100.00');
    expect(level.reorderPoint).toBe('20.00');
  });

  it('preserves existing thresholds not included in the patch', async () => {
    const { engine } = setup();
    await engine.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    const updated = await engine.setThresholds(ORG, ITEM, WAREHOUSE, { maximumStock: '100.00' });
    expect(updated.minimumStock).toBe('10.00');
    expect(updated.maximumStock).toBe('100.00');
  });
});

describe('InventoryStockEngine — increaseOnHand/decreaseOnHand', () => {
  it('increaseOnHand() increases quantityOnHand, auto-creating the level', async () => {
    const { engine } = setup();
    const level = await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    expect(level.quantityOnHand).toBe('50.00');
  });

  it('decreaseOnHand() decreases quantityOnHand', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    const level = await engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '20.00');
    expect(level.quantityOnHand).toBe('30.00');
  });

  it('decreaseOnHand() throws InsufficientStockError when exceeding on-hand quantity', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    await expect(engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '20.00')).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('decreaseOnHand() throws StockLevelNotFoundError when no level exists yet', async () => {
    const { engine } = setup();
    await expect(engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '10.00')).rejects.toBeInstanceOf(StockLevelNotFoundError);
  });
});

describe('InventoryStockEngine — increaseReserved/decreaseReserved', () => {
  it('increaseReserved() increases reservedQuantity when available', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    const level = await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '20.00');
    expect(level.reservedQuantity).toBe('20.00');
  });

  it('increaseReserved() throws InsufficientStockError when exceeding available quantity', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    await expect(engine.increaseReserved(ORG, ITEM, WAREHOUSE, '20.00')).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('increaseReserved() accounts for damaged quantity too', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    await engine.increaseDamaged(ORG, ITEM, WAREHOUSE, '5.00');
    await expect(engine.increaseReserved(ORG, ITEM, WAREHOUSE, '6.00')).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('decreaseReserved() decreases reservedQuantity', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '20.00');
    const level = await engine.decreaseReserved(ORG, ITEM, WAREHOUSE, '5.00');
    expect(level.reservedQuantity).toBe('15.00');
  });

  it('decreaseReserved() never goes below 0', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '10.00');
    const level = await engine.decreaseReserved(ORG, ITEM, WAREHOUSE, '999.00');
    expect(level.reservedQuantity).toBe('0.00');
  });
});

describe('InventoryStockEngine — increaseDamaged/decreaseDamaged', () => {
  it('increaseDamaged() increases damagedQuantity', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    const level = await engine.increaseDamaged(ORG, ITEM, WAREHOUSE, '5.00');
    expect(level.damagedQuantity).toBe('5.00');
  });

  it('decreaseDamaged() decreases damagedQuantity, never below 0', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await engine.increaseDamaged(ORG, ITEM, WAREHOUSE, '5.00');
    const level = await engine.decreaseDamaged(ORG, ITEM, WAREHOUSE, '999.00');
    expect(level.damagedQuantity).toBe('0.00');
  });
});

describe('InventoryStockEngine — listBelowReorderPoint/listBelowMinimum', () => {
  it('listBelowReorderPoint() finds only levels at/below their reorder point', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await engine.setThresholds(ORG, ITEM, WAREHOUSE, { reorderPoint: '10.00' });
    await engine.increaseOnHand(ORG, 'item-2', WAREHOUSE, '50.00');
    await engine.setThresholds(ORG, 'item-2', WAREHOUSE, { reorderPoint: '10.00' });
    const results = await engine.listBelowReorderPoint(ORG);
    expect(results).toHaveLength(1);
    expect(results[0]?.itemId).toBe(ITEM);
  });

  it('listBelowMinimum() finds only levels below their minimum', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await engine.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    const results = await engine.listBelowMinimum(ORG);
    expect(results).toHaveLength(1);
  });
});

describe('InventoryStockEngine — multiple warehouses are tracked independently', () => {
  it('the same item at two warehouses has independent stock levels', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await engine.increaseOnHand(ORG, ITEM, 'warehouse-2', '50.00');
    const levelA = await engine.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    const levelB = await engine.getByItemAndWarehouse(ORG, ITEM, 'warehouse-2');
    expect(levelA?.quantityOnHand).toBe('100.00');
    expect(levelB?.quantityOnHand).toBe('50.00');
  });
});

describe('InventoryStockEngine — sequential increase/decrease combinations', () => {
  it('supports repeated increase and decrease cycles', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '30.00');
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    const level = await engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    expect(level.quantityOnHand).toBe('75.00');
  });

  it('reserved and damaged quantities accumulate correctly together', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '10.00');
    await engine.increaseDamaged(ORG, ITEM, WAREHOUSE, '5.00');
    const level = await engine.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(computeAvailableQuantity(level!)).toBe('85.00');
  });
});

describe('InventoryStockEngine — reserving and issuing together respects available quantity', () => {
  it('a reservation reduces what can subsequently be issued', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '40.00');
    await expect(engine.increaseReserved(ORG, ITEM, WAREHOUSE, '20.00')).rejects.toThrow();
  });

  it('decreaseOnHand() succeeds even when quantity is reserved (issuing does not check reservations)', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await engine.increaseReserved(ORG, ITEM, WAREHOUSE, '40.00');
    const level = await engine.decreaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    expect(level.quantityOnHand).toBe('40.00');
  });
});

describe('InventoryStockEngine — isAboveMaximum integration with thresholds', () => {
  it('setThresholds() plus increaseOnHand() together allow detecting an overstock', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '150.00');
    await engine.setThresholds(ORG, ITEM, WAREHOUSE, { maximumStock: '100.00' });
    const level = await engine.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(isAboveMaximum(level!.quantityOnHand, level!.maximumStock)).toBe(true);
  });
});

describe('InventoryStockEngine — get/list/findByItem/findByWarehouse/org scoping', () => {
  it('get() returns null for an unknown stock level id', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('getByItemAndWarehouse() returns null before any activity', async () => {
    const { engine } = setup();
    expect(await engine.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE)).toBeNull();
  });

  it('list()/findByItem()/findByWarehouse() round-trip', async () => {
    const { engine } = setup();
    await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.findByItem(ORG, ITEM)).toHaveLength(1);
    expect(await engine.findByWarehouse(ORG, WAREHOUSE)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const level = await engine.increaseOnHand(ORG, ITEM, WAREHOUSE, '10.00');
    expect(await repository.findById('org-2', level.id)).toBeNull();
  });
});
