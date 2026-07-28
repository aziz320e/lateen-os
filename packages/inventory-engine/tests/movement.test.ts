import { describe, expect, it } from 'vitest';
import { createInventoryEventBus } from '../src/events/index.js';
import { createInventoryMovementEngine } from '../src/movement/engine.impl.js';
import { createMovementRecordRepository } from '../src/movement/repository.impl.js';
import { createInventoryStockEngine } from '../src/stock/engine.impl.js';
import { createStockLevelRepository } from '../src/stock/repository.impl.js';
import { InsufficientStockError } from '../src/shared/errors.js';

const ORG = 'org-1';
const ITEM = 'item-1';
const ITEM_2 = 'item-2';
const WAREHOUSE = 'warehouse-1';
const OTHER_WAREHOUSE = 'warehouse-2';

function setup(eventBus = createInventoryEventBus()) {
  const stockLevelRepository = createStockLevelRepository();
  const stock = createInventoryStockEngine(stockLevelRepository);
  const movementRepository = createMovementRecordRepository();
  const engine = createInventoryMovementEngine(movementRepository, stock, eventBus);
  return { stockLevelRepository, stock, movementRepository, engine, eventBus };
}

describe('InventoryMovementEngine — receive', () => {
  it('increases on-hand and records an immutable movement', async () => {
    const { engine, stock } = setup();
    const movement = await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    expect(movement.movementType).toBe('receive');
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('100.00');
  });

  it('publishes inventory.received', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('inventory.received', (payload) => (seen = payload));
    const movement = await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', movementId: movement.id });
  });

  it('supports a reason and referenceId', async () => {
    const { engine } = setup();
    const movement = await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', reason: 'PO fulfillment', referenceId: 'PO-1' });
    expect(movement.reason).toBe('PO fulfillment');
    expect(movement.referenceId).toBe('PO-1');
  });
});

describe('InventoryMovementEngine — issue', () => {
  it('decreases on-hand and records an immutable movement', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    const movement = await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    expect(movement.movementType).toBe('issue');
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('70.00');
  });

  it('publishes inventory.issued', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    let seen: unknown;
    eventBus.subscribe('inventory.issued', (payload) => (seen = payload));
    const movement = await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00', movementId: movement.id });
  });

  it('throws InsufficientStockError when exceeding on-hand quantity', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await expect(engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' })).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('does not record a movement when the issue fails', async () => {
    const { engine, movementRepository } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await expect(engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' })).rejects.toThrow();
    expect(await movementRepository.findByType(ORG, 'issue')).toHaveLength(0);
  });
});

describe('InventoryMovementEngine — transfer', () => {
  it('moves quantity from one warehouse to another', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    const movement = await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '40.00' });
    expect(movement.movementType).toBe('transfer');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('60.00');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, OTHER_WAREHOUSE))?.quantityOnHand).toBe('40.00');
  });

  it('publishes inventory.transferred', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    let seen: unknown;
    eventBus.subscribe('inventory.transferred', (payload) => (seen = payload));
    const movement = await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '40.00' });
    expect(seen).toEqual({
      organizationId: ORG,
      itemId: ITEM,
      fromWarehouseId: WAREHOUSE,
      toWarehouseId: OTHER_WAREHOUSE,
      quantity: '40.00',
      movementId: movement.id,
    });
  });

  it('throws InsufficientStockError when the source lacks stock', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await expect(engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '40.00' })).rejects.toBeInstanceOf(
      InsufficientStockError,
    );
  });

  it('records fromWarehouseId and toWarehouseId on the movement', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    const movement = await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '40.00' });
    expect(movement.fromWarehouseId).toBe(WAREHOUSE);
    expect(movement.toWarehouseId).toBe(OTHER_WAREHOUSE);
  });
});

describe('InventoryMovementEngine — adjust', () => {
  it('a positive adjustment increases on-hand quantity', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    const movement = await engine.adjust(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantityDelta: '10.00' });
    expect(movement.movementType).toBe('adjustment');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('110.00');
  });

  it('a negative adjustment decreases on-hand quantity', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.adjust(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantityDelta: '-15.00' });
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('85.00');
  });

  it('publishes inventory.adjusted with the signed quantity', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    let seen: unknown;
    eventBus.subscribe('inventory.adjusted', (payload) => (seen = payload));
    const movement = await engine.adjust(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantityDelta: '-15.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '-15.00', movementId: movement.id });
  });

  it('a negative adjustment beyond on-hand throws InsufficientStockError', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await expect(engine.adjust(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantityDelta: '-20.00' })).rejects.toBeInstanceOf(InsufficientStockError);
  });
});

describe('InventoryMovementEngine — returnStock', () => {
  it('increases on-hand quantity and records a return movement', async () => {
    const { engine, stock } = setup();
    const movement = await engine.returnStock(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00' });
    expect(movement.movementType).toBe('return');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('5.00');
  });

  it('publishes inventory.received (a return is a receipt from the ledger perspective)', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('inventory.received', (payload) => (seen = payload));
    const movement = await engine.returnStock(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', movementId: movement.id });
  });
});

describe('InventoryMovementEngine — reserve/release', () => {
  it('reserve() increases reserved quantity and records a reservation movement', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    const movement = await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    expect(movement.movementType).toBe('reservation');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.reservedQuantity).toBe('20.00');
  });

  it('publishes inventory.reserved', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    let seen: unknown;
    eventBus.subscribe('inventory.reserved', (payload) => (seen = payload));
    const movement = await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00', movementId: movement.id });
  });

  it('reserve() throws InsufficientStockError when exceeding available quantity', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await expect(engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' })).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('release() decreases reserved quantity and records a release movement', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    const movement = await engine.release(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00' });
    expect(movement.movementType).toBe('release');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.reservedQuantity).toBe('15.00');
  });

  it('publishes inventory.released', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    let seen: unknown;
    eventBus.subscribe('inventory.released', (payload) => (seen = payload));
    const movement = await engine.release(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', movementId: movement.id });
  });
});

describe('InventoryMovementEngine — combined receive/issue/reserve/release sequence', () => {
  it('produces the expected final stock state across a realistic sequence', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '200.00' });
    await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    await engine.release(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('170.00');
    expect(level?.reservedQuantity).toBe('30.00');
  });

  it('every operation in the sequence produces its own immutable movement record', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '200.00' });
    await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    await engine.release(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00' });
    expect(await engine.listMovements(ORG)).toHaveLength(4);
  });
});

describe('InventoryMovementEngine — transfer is symmetric', () => {
  it('a transfer followed by a reverse transfer returns to the original distribution', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '40.00' });
    await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: OTHER_WAREHOUSE, toWarehouseId: WAREHOUSE, quantity: '40.00' });
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('100.00');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, OTHER_WAREHOUSE))?.quantityOnHand).toBe('0.00');
  });
});

describe('InventoryMovementEngine — reserve then issue the same reserved quantity', () => {
  it('issuing a reserved quantity decreases on-hand but leaves reservation bookkeeping to a separate release() call', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.reserve(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00' });
    const level = await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE);
    expect(level?.quantityOnHand).toBe('70.00');
    expect(level?.reservedQuantity).toBe('30.00');
  });
});

describe('InventoryMovementEngine — receive and return both increase on-hand identically', () => {
  it('receive() and returnStock() of the same quantity produce the same resulting on-hand', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '25.00' });
    const afterReceive = (await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand;
    await engine.returnStock(ORG, { itemId: ITEM_2, warehouseId: WAREHOUSE, quantity: '25.00' });
    const afterReturn = (await stock.getByItemAndWarehouse(ORG, ITEM_2, WAREHOUSE))?.quantityOnHand;
    expect(afterReceive).toBe(afterReturn);
  });
});

describe('InventoryMovementEngine — adjustment of exactly 0', () => {
  it('a zero-delta adjustment is a no-op on quantity but still recorded', async () => {
    const { engine, stock } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    const movement = await engine.adjust(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantityDelta: '0.00' });
    expect(movement.movementType).toBe('adjustment');
    expect((await stock.getByItemAndWarehouse(ORG, ITEM, WAREHOUSE))?.quantityOnHand).toBe('50.00');
  });
});

describe('InventoryMovementEngine — get/list/find/org scoping', () => {
  it('getMovement() returns null for an unknown movement', async () => {
    const { engine } = setup();
    expect(await engine.getMovement(ORG, 'missing')).toBeNull();
  });

  it('listMovements()/findByItem()/findByWarehouse()/findByType() round-trip', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    await engine.issue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00' });
    expect(await engine.listMovements(ORG)).toHaveLength(2);
    expect(await engine.findByItem(ORG, ITEM)).toHaveLength(2);
    expect(await engine.findByWarehouse(ORG, WAREHOUSE)).toHaveLength(2);
    expect(await engine.findByType(ORG, 'receive')).toHaveLength(1);
    expect(await engine.findByType(ORG, 'issue')).toHaveLength(1);
  });

  it('findByWarehouse() includes transfers touching the warehouse on either side', async () => {
    const { engine } = setup();
    await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00' });
    await engine.transfer(ORG, { itemId: ITEM, fromWarehouseId: WAREHOUSE, toWarehouseId: OTHER_WAREHOUSE, quantity: '10.00' });
    expect(await engine.findByWarehouse(ORG, OTHER_WAREHOUSE)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, movementRepository } = setup();
    const movement = await engine.receive(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    expect(await movementRepository.findById('org-2', movement.id)).toBeNull();
  });
});
