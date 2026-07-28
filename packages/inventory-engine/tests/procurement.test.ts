import { describe, expect, it } from 'vitest';
import { createInventoryEventBus } from '../src/events/index.js';
import { computeSuggestedReorderQuantity, createProcurementPreparationEngine } from '../src/procurement/engine.impl.js';
import { createPurchaseRequestRepository } from '../src/procurement/repository.impl.js';
import { createInventoryStockEngine } from '../src/stock/engine.impl.js';
import { createStockLevelRepository } from '../src/stock/repository.impl.js';
import { PurchaseRequestNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const ITEM = 'item-1';
const ITEM_2 = 'item-2';
const WAREHOUSE = 'warehouse-1';

function setup(eventBus = createInventoryEventBus()) {
  const stockLevelRepository = createStockLevelRepository();
  const stock = createInventoryStockEngine(stockLevelRepository);
  const purchaseRequestRepository = createPurchaseRequestRepository();
  const engine = createProcurementPreparationEngine(stock, purchaseRequestRepository, eventBus);
  return { stock, purchaseRequestRepository, engine, eventBus };
}

describe('computeSuggestedReorderQuantity (pure)', () => {
  it('suggests bringing available quantity up to the maximum', () => {
    expect(computeSuggestedReorderQuantity('10.00', '20.00', '100.00')).toBe('90.00');
  });

  it('falls back to the reorder point when no maximum is configured', () => {
    expect(computeSuggestedReorderQuantity('10.00', '20.00', undefined)).toBe('10.00');
  });

  it('never goes negative', () => {
    expect(computeSuggestedReorderQuantity('150.00', '20.00', '100.00')).toBe('0.00');
  });
});

describe('ProcurementPreparationEngine — computeReorderSuggestions', () => {
  it('finds items at or below their reorder point', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { reorderPoint: '10.00', maximumStock: '100.00' });
    const suggestions = await engine.computeReorderSuggestions(ORG);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.itemId).toBe(ITEM);
    expect(suggestions[0]?.suggestedQuantity).toBe('95.00');
  });

  it('excludes items above their reorder point', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '50.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { reorderPoint: '10.00' });
    expect(await engine.computeReorderSuggestions(ORG)).toHaveLength(0);
  });

  it('excludes items with no reorder point configured', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '0.00');
    expect(await engine.computeReorderSuggestions(ORG)).toHaveLength(0);
  });

  it('accounts for reserved and damaged quantity via available quantity', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '20.00');
    await stock.increaseReserved(ORG, ITEM, WAREHOUSE, '15.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { reorderPoint: '10.00' });
    const suggestions = await engine.computeReorderSuggestions(ORG);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.availableQuantity).toBe('5.00');
  });
});

describe('ProcurementPreparationEngine — detectShortages', () => {
  it('finds items below their minimum stock', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    const shortages = await engine.detectShortages(ORG);
    expect(shortages).toHaveLength(1);
    expect(shortages[0]?.itemId).toBe(ITEM);
  });

  it('excludes items at or above their minimum', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '20.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    expect(await engine.detectShortages(ORG)).toHaveLength(0);
  });

  it('publishes inventory.shortage.detected once per shortage', async () => {
    const eventBus = createInventoryEventBus();
    const { engine, stock } = setup(eventBus);
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    const seen: unknown[] = [];
    eventBus.subscribe('inventory.shortage.detected', (payload) => seen.push(payload));
    await engine.detectShortages(ORG);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, available: '5.00' });
  });

  it('detects shortages across multiple items independently', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { minimumStock: '10.00' });
    await stock.increaseOnHand(ORG, ITEM_2, WAREHOUSE, '2.00');
    await stock.setThresholds(ORG, ITEM_2, WAREHOUSE, { minimumStock: '10.00' });
    expect(await engine.detectShortages(ORG)).toHaveLength(2);
  });
});

describe('ProcurementPreparationEngine — generatePurchaseRequest', () => {
  it('persists a suggested purchase request', async () => {
    const { engine } = setup();
    const request = await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    expect(request.status).toBe('suggested');
    expect(request.quantity).toBe('50.00');
  });

  it('publishes inventory.reorder.recommended', async () => {
    const eventBus = createInventoryEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('inventory.reorder.recommended', (payload) => (seen = payload));
    await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    expect(seen).toEqual({ organizationId: ORG, itemId: ITEM, warehouseId: WAREHOUSE, suggestedQuantity: '50.00' });
  });
});

describe('ProcurementPreparationEngine — acknowledge/dismiss', () => {
  it('acknowledgePurchaseRequest() moves status to acknowledged', async () => {
    const { engine } = setup();
    const request = await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    const acknowledged = await engine.acknowledgePurchaseRequest(ORG, request.id);
    expect(acknowledged.status).toBe('acknowledged');
  });

  it('dismissPurchaseRequest() moves status to dismissed', async () => {
    const { engine } = setup();
    const request = await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    const dismissed = await engine.dismissPurchaseRequest(ORG, request.id);
    expect(dismissed.status).toBe('dismissed');
  });

  it('throws PurchaseRequestNotFoundError for an unknown request', async () => {
    const { engine } = setup();
    await expect(engine.acknowledgePurchaseRequest(ORG, 'missing')).rejects.toBeInstanceOf(PurchaseRequestNotFoundError);
  });
});

describe('ProcurementPreparationEngine — reorder suggestions across multiple warehouses', () => {
  it('computes suggestions independently per warehouse', async () => {
    const { engine, stock } = setup();
    await stock.increaseOnHand(ORG, ITEM, WAREHOUSE, '5.00');
    await stock.setThresholds(ORG, ITEM, WAREHOUSE, { reorderPoint: '10.00', maximumStock: '50.00' });
    await stock.increaseOnHand(ORG, ITEM, 'warehouse-2', '40.00');
    await stock.setThresholds(ORG, ITEM, 'warehouse-2', { reorderPoint: '10.00', maximumStock: '50.00' });
    const suggestions = await engine.computeReorderSuggestions(ORG);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.warehouseId).toBe(WAREHOUSE);
  });
});

describe('ProcurementPreparationEngine — dismissed requests are excluded from acknowledged filter', () => {
  it('findByStatus() separates acknowledged from dismissed requests', async () => {
    const { engine } = setup();
    const requestA = await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00' });
    const requestB = await engine.generatePurchaseRequest(ORG, { itemId: ITEM_2, warehouseId: WAREHOUSE, quantity: '20.00' });
    await engine.acknowledgePurchaseRequest(ORG, requestA.id);
    await engine.dismissPurchaseRequest(ORG, requestB.id);
    expect(await engine.findByStatus(ORG, 'acknowledged')).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'dismissed')).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'suggested')).toHaveLength(0);
  });
});

describe('ProcurementPreparationEngine — get/list/findByStatus/org scoping', () => {
  it('getPurchaseRequest() returns null for an unknown request', async () => {
    const { engine } = setup();
    expect(await engine.getPurchaseRequest(ORG, 'missing')).toBeNull();
  });

  it('listPurchaseRequests()/findByStatus() round-trip', async () => {
    const { engine } = setup();
    await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    expect(await engine.listPurchaseRequests(ORG)).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'suggested')).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, purchaseRequestRepository } = setup();
    const request = await engine.generatePurchaseRequest(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00' });
    expect(await purchaseRequestRepository.findById('org-2', request.id)).toBeNull();
  });
});
