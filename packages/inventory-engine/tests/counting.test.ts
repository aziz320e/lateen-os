import { describe, expect, it } from 'vitest';
import { canTransitionCount, computeVariance, createInventoryCountingEngine } from '../src/counting/engine.impl.js';
import { createInventoryCountRepository } from '../src/counting/repository.impl.js';
import { createInventoryEventBus } from '../src/events/index.js';
import { createInventoryMovementEngine } from '../src/movement/engine.impl.js';
import { createMovementRecordRepository } from '../src/movement/repository.impl.js';
import { createInventoryStockEngine } from '../src/stock/engine.impl.js';
import { createStockLevelRepository } from '../src/stock/repository.impl.js';
import { CountLineNotFoundError, InvalidCountTransitionError, InventoryCountNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const ITEM = 'item-1';
const ITEM_2 = 'item-2';
const WAREHOUSE = 'warehouse-1';

function setup(eventBus = createInventoryEventBus()) {
  const stockLevelRepository = createStockLevelRepository();
  const stock = createInventoryStockEngine(stockLevelRepository);
  const movementRepository = createMovementRecordRepository();
  const movements = createInventoryMovementEngine(movementRepository, stock, eventBus);
  const countRepository = createInventoryCountRepository();
  const engine = createInventoryCountingEngine(countRepository, stock, movements, eventBus);
  return { stock, movements, countRepository, engine, eventBus };
}

describe('computeVariance (pure)', () => {
  it('is positive when counted exceeds system quantity', () => {
    expect(computeVariance('100.00', '110.00')).toBe('10.00');
  });

  it('is negative when counted is below system quantity', () => {
    expect(computeVariance('100.00', '90.00')).toBe('-10.00');
  });

  it('is 0.00 when they match', () => {
    expect(computeVariance('100.00', '100.00')).toBe('0.00');
  });
});

describe('canTransitionCount (pure)', () => {
  it('allows draft -> in_progress -> completed', () => {
    expect(canTransitionCount('draft', 'in_progress')).toBe(true);
    expect(canTransitionCount('in_progress', 'completed')).toBe(true);
  });

  it('rejects draft -> completed directly', () => {
    expect(canTransitionCount('draft', 'completed')).toBe(false);
  });

  it('rejects any transition out of completed', () => {
    expect(canTransitionCount('completed', 'draft')).toBe(false);
  });
});

describe('InventoryCountingEngine — createCount', () => {
  it('snapshots system quantity for each item', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    expect(count.status).toBe('draft');
    expect(count.lines[0]?.systemQuantity).toBe('100.00');
    expect(count.lines[0]?.countedQuantity).toBeUndefined();
  });

  it('supports multiple items and both count types', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await stock.increaseOnHand(ORG, ITEM_2, WAREHOUSE, '50.00');
    const cycleCount = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    const fullCount = await engine.createCount(ORG, { countType: 'full', warehouseId: WAREHOUSE, itemIds: [ITEM, ITEM_2] });
    expect(cycleCount.countType).toBe('cycle');
    expect(fullCount.countType).toBe('full');
    expect(fullCount.lines).toHaveLength(2);
  });

  it('defaults system quantity to 0.00 for an item with no prior stock activity', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    expect(count.lines[0]?.systemQuantity).toBe('0.00');
  });
});

describe('InventoryCountingEngine — startCount', () => {
  it('moves draft -> in_progress and stamps startedAt', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    const started = await engine.startCount(ORG, count.id);
    expect(started.status).toBe('in_progress');
    expect(started.startedAt).toBeDefined();
  });

  it('rejects starting an already-started count', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await expect(engine.startCount(ORG, count.id)).rejects.toBeInstanceOf(InvalidCountTransitionError);
  });

  it('throws InventoryCountNotFoundError for an unknown count', async () => {
    const { engine } = setup();
    await expect(engine.startCount(ORG, 'missing')).rejects.toBeInstanceOf(InventoryCountNotFoundError);
  });
});

describe('InventoryCountingEngine — recordCount', () => {
  it('records a counted quantity and computes variance', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    const updated = await engine.recordCount(ORG, count.id, ITEM, '95.00');
    expect(updated.lines[0]?.countedQuantity).toBe('95.00');
    expect(updated.lines[0]?.variance).toBe('-5.00');
  });

  it('rejects recording a count on a draft (not-yet-started) count', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await expect(engine.recordCount(ORG, count.id, ITEM, '95.00')).rejects.toBeInstanceOf(InvalidCountTransitionError);
  });

  it('throws CountLineNotFoundError for an item not part of the count', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await expect(engine.recordCount(ORG, count.id, ITEM_2, '10.00')).rejects.toBeInstanceOf(CountLineNotFoundError);
  });

  it('allows recording counts for multiple lines independently', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await stock.increaseOnHand(ORG, ITEM_2, WAREHOUSE, '50.00');
    const count = await engine.createCount(ORG, { countType: 'full', warehouseId: WAREHOUSE, itemIds: [ITEM, ITEM_2] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '95.00');
    const updated = await engine.recordCount(ORG, count.id, ITEM_2, '55.00');
    expect(updated.lines.find((l) => l.itemId === ITEM)?.countedQuantity).toBe('95.00');
    expect(updated.lines.find((l) => l.itemId === ITEM_2)?.countedQuantity).toBe('55.00');
  });
});

describe('InventoryCountingEngine — completeCount', () => {
  it('reconciles a negative variance via a real stock adjustment', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '95.00');
    await engine.completeCount(ORG, count.id);
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('95.00');
  });

  it('reconciles a positive variance via a real stock adjustment', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '110.00');
    await engine.completeCount(ORG, count.id);
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('110.00');
  });

  it('does not adjust stock for a line with 0 variance', async () => {
    const { engine, stock, movements } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '100.00');
    await engine.completeCount(ORG, count.id);
    expect(await movements.findByType(ORG, 'adjustment')).toHaveLength(0);
  });

  it('does not adjust stock for a line that was never counted', async () => {
    const { engine, stock, movements } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.completeCount(ORG, count.id);
    expect(await movements.findByType(ORG, 'adjustment')).toHaveLength(0);
  });

  it('publishes inventory.count.completed with the number of variant lines', async () => {
    const eventBus = createInventoryEventBus();
    const { engine, stock } = setup(eventBus);
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await stock.increaseOnHand(ORG, ITEM_2, WAREHOUSE, '50.00');
    const count = await engine.createCount(ORG, { countType: 'full', warehouseId: WAREHOUSE, itemIds: [ITEM, ITEM_2] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '95.00');
    await engine.recordCount(ORG, count.id, ITEM_2, '50.00');
    let seen: unknown;
    eventBus.subscribe('inventory.count.completed', (payload) => (seen = payload));
    await engine.completeCount(ORG, count.id);
    expect(seen).toEqual({ organizationId: ORG, countId: count.id, varianceCount: 1 });
  });

  it('stamps completedAt and moves status to completed', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    const completed = await engine.completeCount(ORG, count.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('rejects completing a draft (not-yet-started) count', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await expect(engine.completeCount(ORG, count.id)).rejects.toBeInstanceOf(InvalidCountTransitionError);
  });

  it('rejects completing an already-completed count', async () => {
    const { engine } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.completeCount(ORG, count.id);
    await expect(engine.completeCount(ORG, count.id)).rejects.toBeInstanceOf(InvalidCountTransitionError);
  });
});

describe('InventoryCountingEngine — full count across multiple items with mixed variances', () => {
  it('reconciles both overages and shortages within a single full count', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    await stock.increaseOnHand(ORG, ITEM_2, WAREHOUSE, '50.00');
    const count = await engine.createCount(ORG, { countType: 'full', warehouseId: WAREHOUSE, itemIds: [ITEM, ITEM_2] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '90.00');
    await engine.recordCount(ORG, count.id, ITEM_2, '55.00');
    await engine.completeCount(ORG, count.id);
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('90.00');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM_2, WAREHOUSE))?.quantityOnHand).toBe('55.00');
  });
});

describe('InventoryCountingEngine — recordCount can be called multiple times for the same line', () => {
  it('the latest recorded count overwrites the previous one for that line', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, count.id);
    await engine.recordCount(ORG, count.id, ITEM, '90.00');
    const updated = await engine.recordCount(ORG, count.id, ITEM, '95.00');
    expect(updated.lines[0]?.countedQuantity).toBe('95.00');
    expect(updated.lines[0]?.variance).toBe('-5.00');
  });
});

describe('InventoryCountingEngine — cycle vs full count independence', () => {
  it('two separate counts for the same warehouse do not interfere with each other', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '100.00');
    const cycleCount = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    const fullCount = await engine.createCount(ORG, { countType: 'full', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    await engine.startCount(ORG, cycleCount.id);
    await engine.recordCount(ORG, cycleCount.id, ITEM, '95.00');
    const stillDraft = await engine.getCount(ORG, fullCount.id);
    expect(stillDraft?.status).toBe('draft');
  });
});

describe('InventoryCountingEngine — get/list/findByWarehouse/org scoping', () => {
  it('getCount() returns null for an unknown count', async () => {
    const { engine } = setup();
    expect(await engine.getCount(ORG, 'missing')).toBeNull();
  });

  it('listCounts()/findByWarehouse() round-trip', async () => {
    const { engine } = setup();
    await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    expect(await engine.listCounts(ORG)).toHaveLength(1);
    expect(await engine.findByWarehouse(ORG, WAREHOUSE)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, countRepository } = setup();
    const count = await engine.createCount(ORG, { countType: 'cycle', warehouseId: WAREHOUSE, itemIds: [ITEM] });
    expect(await countRepository.findById('org-2', count.id)).toBeNull();
  });
});
