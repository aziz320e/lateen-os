import { describe, expect, it } from 'vitest';
import { createInventoryRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createInventoryRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createInventoryRuntime();
    const item = await runtime.catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    expect(item.status).toBe('draft');
    const warehouse = await runtime.warehouses.createWarehouse(ORG, { code: 'WH1', name: 'Main' });
    expect(warehouse.status).toBe('active');
    expect(await runtime.relationships.getProductContext(ORG, 'product-1')).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createInventoryRuntime();
    let seen: unknown;
    runtime.events.subscribe('inventory.item.created', (payload) => (seen = payload));
    const item = await runtime.catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    expect(seen).toEqual({ organizationId: ORG, itemId: item.id, sku: 'SKU-1' });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createInventoryEventBus } = await import('../src/events/index.js');
    const eventBus = createInventoryEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createInventoryRuntime({ eventBus, now: fixedNow });
    const item = await runtime.catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    expect(item.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createInventoryRuntime();
    await runtime.catalog.create(ORG, { sku: 'SKU-1', name: 'Widget', unitOfMeasure: 'EA' });
    const result = await runtime.queries.findItems({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('movements.receive() and movements.issue() are reflected in stock, which the runtime shares between modules', async () => {
    const runtime = createInventoryRuntime();
    await runtime.movements.receive(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '100.00' });
    await runtime.movements.issue(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '30.00' });
    const level = await runtime.stock.getByItemAndWarehouse(ORG, 'item-1', 'wh-1');
    expect(level?.quantityOnHand).toBe('70.00');
  });

  it('counting.completeCount() reconciles via the same movements engine used elsewhere', async () => {
    const runtime = createInventoryRuntime();
    await runtime.movements.receive(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '100.00' });
    const count = await runtime.counting.createCount(ORG, { countType: 'cycle', warehouseId: 'wh-1', itemIds: ['item-1'] });
    await runtime.counting.startCount(ORG, count.id);
    await runtime.counting.recordCount(ORG, count.id, 'item-1', '90.00');
    await runtime.counting.completeCount(ORG, count.id);
    const level = await runtime.stock.getByItemAndWarehouse(ORG, 'item-1', 'wh-1');
    expect(level?.quantityOnHand).toBe('90.00');
    expect(await runtime.movements.findByType(ORG, 'adjustment')).toHaveLength(1);
  });

  it('procurement.computeReorderSuggestions() sees thresholds set through stock', async () => {
    const runtime = createInventoryRuntime();
    await runtime.movements.receive(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00' });
    await runtime.stock.setThresholds(ORG, 'item-1', 'wh-1', { reorderPoint: '10.00', maximumStock: '100.00' });
    const suggestions = await runtime.procurement.computeReorderSuggestions(ORG);
    expect(suggestions).toHaveLength(1);
  });

  it('valuation.recordReceipt()/recordIssue() work off the same runtime independently of movements', async () => {
    const runtime = createInventoryRuntime();
    await runtime.valuation.recordReceipt(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '100.00', unitCost: '5.00' });
    const valuation = await runtime.valuation.recordIssue(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '20.00', method: 'fifo' });
    expect(valuation.totalValue).toBe('100.00');
  });

  it('searchInventory() finds records created through the runtime engines', async () => {
    const runtime = createInventoryRuntime();
    await runtime.catalog.create(ORG, { sku: 'UNIQUE-999', name: 'UniqueItemName', unitOfMeasure: 'EA' });
    const result = await runtime.queries.searchInventory({ organizationId: ORG, keyword: 'UniqueItemName' });
    expect(result.total).toBe(1);
  });
});
