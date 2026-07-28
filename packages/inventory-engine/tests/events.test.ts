import { describe, expect, it } from 'vitest';
import { createInventoryEventBus, INVENTORY_EVENT_NAMES } from '../src/events/index.js';

describe('InventoryEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.item.created', (payload) => (seen = payload));
    bus.publish('inventory.item.created', { organizationId: 'org-1', itemId: 'item-1', sku: 'SKU-1' });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', sku: 'SKU-1' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createInventoryEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('inventory.received', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00', movementId: 'm1' });
    bus.publish('inventory.issued', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', movementId: 'm2' });
    expect(names).toEqual(['inventory.received', 'inventory.issued']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createInventoryEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('inventory.reorder.recommended', () => (count += 1));
    bus.publish('inventory.reorder.recommended', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', suggestedQuantity: '10.00' });
    unsubscribe();
    bus.publish('inventory.reorder.recommended', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', suggestedQuantity: '10.00' });
    expect(count).toBe(1);
  });

  it('delivers inventory.transferred with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.transferred', (payload) => (seen = payload));
    bus.publish('inventory.transferred', {
      organizationId: 'org-1',
      itemId: 'item-1',
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      quantity: '10.00',
      movementId: 'm1',
    });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', quantity: '10.00', movementId: 'm1' });
  });

  it('delivers inventory.adjusted with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.adjusted', (payload) => (seen = payload));
    bus.publish('inventory.adjusted', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '-5.00', movementId: 'm1' });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '-5.00', movementId: 'm1' });
  });

  it('delivers inventory.reserved and inventory.released with their payloads', () => {
    const bus = createInventoryEventBus();
    const seen: unknown[] = [];
    bus.subscribe('inventory.reserved', (payload) => seen.push(payload));
    bus.subscribe('inventory.released', (payload) => seen.push(payload));
    bus.publish('inventory.reserved', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00', movementId: 'm1' });
    bus.publish('inventory.released', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00', movementId: 'm2' });
    expect(seen).toHaveLength(2);
  });

  it('delivers inventory.count.completed with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.count.completed', (payload) => (seen = payload));
    bus.publish('inventory.count.completed', { organizationId: 'org-1', countId: 'count-1', varianceCount: 3 });
    expect(seen).toEqual({ organizationId: 'org-1', countId: 'count-1', varianceCount: 3 });
  });

  it('delivers inventory.shortage.detected with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.shortage.detected', (payload) => (seen = payload));
    bus.publish('inventory.shortage.detected', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', available: '2.00' });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', available: '2.00' });
  });

  it('delivers inventory.issued with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.issued', (payload) => (seen = payload));
    bus.publish('inventory.issued', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', movementId: 'm1' });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', movementId: 'm1' });
  });

  it('delivers inventory.item.created with its payload', () => {
    const bus = createInventoryEventBus();
    let seen: unknown;
    bus.subscribe('inventory.item.created', (payload) => (seen = payload));
    bus.publish('inventory.item.created', { organizationId: 'org-1', itemId: 'item-1', sku: 'SKU-1' });
    expect(seen).toEqual({ organizationId: 'org-1', itemId: 'item-1', sku: 'SKU-1' });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createInventoryEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('inventory.received', () => (countA += 1));
    bus.subscribe('inventory.received', () => (countB += 1));
    bus.publish('inventory.received', { organizationId: 'org-1', itemId: 'item-1', warehouseId: 'wh-1', quantity: '5.00', movementId: 'm1' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('INVENTORY_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(INVENTORY_EVENT_NAMES)).toEqual([
      'inventory.item.created',
      'inventory.received',
      'inventory.issued',
      'inventory.transferred',
      'inventory.adjusted',
      'inventory.reserved',
      'inventory.released',
      'inventory.count.completed',
      'inventory.shortage.detected',
      'inventory.reorder.recommended',
    ]);
  });
});
