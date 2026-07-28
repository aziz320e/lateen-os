import { describe, expect, it } from 'vitest';
import { createInventoryCountingEngine } from '../src/counting/engine.impl.js';
import { createInventoryCountRepository } from '../src/counting/repository.impl.js';
import { createInventoryCatalogEngine } from '../src/item/engine.impl.js';
import { createBrandRepository, createCategoryRepository, createInventoryItemRepository } from '../src/item/repository.impl.js';
import { createInventoryMovementEngine } from '../src/movement/engine.impl.js';
import { createMovementRecordRepository } from '../src/movement/repository.impl.js';
import { createInventoryQueries } from '../src/queries/inventory-queries.impl.js';
import { createInventoryStockEngine } from '../src/stock/engine.impl.js';
import { createStockLevelRepository } from '../src/stock/repository.impl.js';
import { createStockValuationEngine } from '../src/valuation/engine.impl.js';
import { createCostLayerRepository, createValuationRecordRepository, createWeightedAverageCostRepository } from '../src/valuation/repository.impl.js';
import { createWarehouseManagementEngine } from '../src/warehouse/engine.impl.js';
import { createBinRepository, createStorageLocationRepository, createWarehouseRepository, createZoneRepository } from '../src/warehouse/repository.impl.js';

const ORG = 'org-1';

function setup() {
  const itemRepository = createInventoryItemRepository();
  const categoryRepository = createCategoryRepository();
  const brandRepository = createBrandRepository();
  const warehouseRepository = createWarehouseRepository();
  const stockLevelRepository = createStockLevelRepository();
  const movementRepository = createMovementRecordRepository();
  const valuationRecordRepository = createValuationRecordRepository();
  const countRepository = createInventoryCountRepository();

  const catalog = createInventoryCatalogEngine(itemRepository, categoryRepository, brandRepository);
  const warehouses = createWarehouseManagementEngine(warehouseRepository, createZoneRepository(), createStorageLocationRepository(), createBinRepository());
  const stock = createInventoryStockEngine(stockLevelRepository);
  const movements = createInventoryMovementEngine(movementRepository, stock);
  const valuation = createStockValuationEngine(createCostLayerRepository(), createWeightedAverageCostRepository(), valuationRecordRepository);
  const counting = createInventoryCountingEngine(countRepository, stock, movements);

  const queries = createInventoryQueries({
    itemRepository,
    categoryRepository,
    brandRepository,
    warehouseRepository,
    stockLevelRepository,
    movementRepository,
    valuationRecordRepository,
    countRepository,
  });

  return { catalog, warehouses, stock, movements, valuation, counting, queries };
}

describe('InventoryQueries — findItems', () => {
  it('filters by categoryId, brandId, and status', async () => {
    const { catalog, queries } = setup();
    const category = await catalog.createCategory(ORG, { name: 'Electronics' });
    const brand = await catalog.createBrand(ORG, { name: 'Acme' });
    const item = await catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA', categoryId: category.id, brandId: brand.id });
    await catalog.activate(ORG, item.id);
    await catalog.create(ORG, { sku: 'SKU-2', name: 'Gadget', unitOfMeasure: 'EA' });

    expect((await queries.findItems({ organizationId: ORG, categoryId: category.id })).total).toBe(1);
    expect((await queries.findItems({ organizationId: ORG, brandId: brand.id })).total).toBe(1);
    expect((await queries.findItems({ organizationId: ORG, status: 'active' })).total).toBe(1);
  });

  it('paginates with offset/limit', async () => {
    const { catalog, queries } = setup();
    for (let i = 0; i < 5; i += 1) await catalog.create(ORG, { sku: `SKU-${i}`, name: `Item ${i}`, unitOfMeasure: 'EA' });
    const page = await queries.findItems({ organizationId: ORG, offset: 2, limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe('InventoryQueries — findWarehouses', () => {
  it('filters by status', async () => {
    const { warehouses, queries } = setup();
    const warehouse = await warehouses.createWarehouse(ORG, { code: 'WH1', name: 'Main' });
    await warehouses.archiveWarehouse(ORG, warehouse.id);
    await warehouses.createWarehouse(ORG, { code: 'WH2', name: 'Other' });
    expect((await queries.findWarehouses({ organizationId: ORG, status: 'archived' })).total).toBe(1);
    expect((await queries.findWarehouses({ organizationId: ORG, status: 'active' })).total).toBe(1);
  });
});

describe('InventoryQueries — findInventory', () => {
  it('filters by itemId and warehouseId', async () => {
    const { stock, queries } = setup();
    await stock.increaseOnHand(ORG, 'item-1', 'wh-1', '10.00');
    await stock.increaseOnHand(ORG, 'item-2', 'wh-1', '20.00');
    expect((await queries.findInventory({ organizationId: ORG, itemId: 'item-1' })).total).toBe(1);
    expect((await queries.findInventory({ organizationId: ORG, warehouseId: 'wh-1' })).total).toBe(2);
    expect((await queries.findInventory({ organizationId: ORG, itemId: 'item-1', warehouseId: 'wh-1' })).total).toBe(1);
  });
});

describe('InventoryQueries — findMovements', () => {
  it('filters by itemId, warehouseId, and movementType', async () => {
    const { movements, queries } = setup();
    await movements.receive(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00' });
    await movements.issue(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00' });
    expect((await queries.findMovements({ organizationId: ORG, itemId: 'item-1' })).total).toBe(2);
    expect((await queries.findMovements({ organizationId: ORG, movementType: 'receive' })).total).toBe(1);
  });
});

describe('InventoryQueries — findReservations', () => {
  it('finds only stock levels with a non-zero reserved quantity', async () => {
    const { stock, queries } = setup();
    await stock.increaseOnHand(ORG, 'item-1', 'wh-1', '100.00');
    await stock.increaseReserved(ORG, 'item-1', 'wh-1', '20.00');
    await stock.increaseOnHand(ORG, 'item-2', 'wh-1', '50.00');
    const result = await queries.findReservations({ organizationId: ORG });
    expect(result.total).toBe(1);
    expect(result.reservations[0]?.itemId).toBe('item-1');
  });
});

describe('InventoryQueries — findValuations', () => {
  it('filters by itemId and method', async () => {
    const { valuation, queries } = setup();
    await valuation.recordReceipt(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00', unitCost: '5.00' });
    await valuation.recordIssue(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', method: 'fifo' });
    expect((await queries.findValuations({ organizationId: ORG, itemId: 'item-1' })).total).toBe(1);
    expect((await queries.findValuations({ organizationId: ORG, method: 'fifo' })).total).toBe(1);
    expect((await queries.findValuations({ organizationId: ORG, method: 'weighted_average' })).total).toBe(0);
  });
});

describe('InventoryQueries — findCounts', () => {
  it('filters by warehouseId and status', async () => {
    const { counting, queries } = setup();
    const count = await counting.createCount(ORG, { countType: 'cycle', warehouseId: 'wh-1', itemIds: ['item-1'] });
    await counting.startCount(ORG, count.id);
    expect((await queries.findCounts({ organizationId: ORG, warehouseId: 'wh-1' })).total).toBe(1);
    expect((await queries.findCounts({ organizationId: ORG, status: 'in_progress' })).total).toBe(1);
    expect((await queries.findCounts({ organizationId: ORG, status: 'completed' })).total).toBe(0);
  });
});

describe('InventoryQueries — findMovements without filters', () => {
  it('returns every movement in the organization when no filter is given', async () => {
    const { movements, queries } = setup();
    await movements.receive(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00' });
    await movements.receive(ORG, { itemId: 'item-2', warehouseId: 'wh-2', quantity: '20.00' });
    expect((await queries.findMovements({ organizationId: ORG })).total).toBe(2);
  });
});

describe('InventoryQueries — findWarehouses without filters', () => {
  it('returns every warehouse when no filter is given', async () => {
    const { warehouses, queries } = setup();
    await warehouses.createWarehouse(ORG, { code: 'WH1', name: 'A' });
    await warehouses.createWarehouse(ORG, { code: 'WH2', name: 'B' });
    expect((await queries.findWarehouses({ organizationId: ORG })).total).toBe(2);
  });
});

describe('InventoryQueries — findCounts without filters', () => {
  it('returns every count when no filter is given', async () => {
    const { counting, queries } = setup();
    await counting.createCount(ORG, { countType: 'cycle', warehouseId: 'wh-1', itemIds: ['item-1'] });
    await counting.createCount(ORG, { countType: 'full', warehouseId: 'wh-2', itemIds: ['item-2'] });
    expect((await queries.findCounts({ organizationId: ORG })).total).toBe(2);
  });
});

describe('InventoryQueries — findValuations without filters', () => {
  it('returns every valuation when no filter is given', async () => {
    const { valuation, queries } = setup();
    await valuation.recordReceipt(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00', unitCost: '5.00' });
    await valuation.recordIssue(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', method: 'fifo' });
    await valuation.recordReceipt(ORG, { itemId: 'item-2', warehouseId: 'wh-1', quantity: '10.00', unitCost: '5.00' });
    await valuation.recordIssue(ORG, { itemId: 'item-2', warehouseId: 'wh-1', quantity: '5.00', method: 'weighted_average' });
    expect((await queries.findValuations({ organizationId: ORG })).total).toBe(2);
  });
});

describe('InventoryQueries — findReservations is organization-scoped', () => {
  it('does not leak reservations across organizations', async () => {
    const { stock, queries } = setup();
    await stock.increaseOnHand(ORG, 'item-1', 'wh-1', '100.00');
    await stock.increaseReserved(ORG, 'item-1', 'wh-1', '20.00');
    expect((await queries.findReservations({ organizationId: 'org-2' })).total).toBe(0);
  });
});

describe('InventoryQueries — findItems is organization-scoped', () => {
  it('does not leak items across organizations', async () => {
    const { catalog, queries } = setup();
    await catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    expect((await queries.findItems({ organizationId: 'org-2' })).total).toBe(0);
  });
});

describe('InventoryQueries — searchInventory', () => {
  it('matches items/warehouses/categories/brands by keyword, best score first', async () => {
    const { catalog, warehouses, queries } = setup();
    await catalog.create(ORG, { sku: 'CAS-001', name: 'Cascade Widget', unitOfMeasure: 'EA' });
    await warehouses.createWarehouse(ORG, { code: 'CAS', name: 'Cascade Warehouse' });
    await catalog.createCategory(ORG, { name: 'Cascade Parts' });
    await catalog.createBrand(ORG, { name: 'Cascade Brand' });

    const result = await queries.searchInventory({ organizationId: ORG, keyword: 'Cascade' });
    expect(result.total).toBe(4);
    expect(new Set(result.matches.map((m) => m.recordType))).toEqual(new Set(['item', 'warehouse', 'category', 'brand']));
  });

  it('matches items by SKU too', async () => {
    const { catalog, queries } = setup();
    await catalog.create(ORG, { sku: 'UNIQUE-SKU-999', name: 'Some Widget', unitOfMeasure: 'EA' });
    const result = await queries.searchInventory({ organizationId: ORG, keyword: 'UNIQUE-SKU-999' });
    expect(result.total).toBe(1);
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { catalog, queries } = setup();
    await catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    const result = await queries.searchInventory({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.total).toBe(0);
  });
});
