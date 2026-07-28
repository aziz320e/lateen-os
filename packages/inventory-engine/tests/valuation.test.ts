import { describe, expect, it } from 'vitest';
import { computeFifoConsumption, computeWeightedAverageCost, createStockValuationEngine } from '../src/valuation/engine.impl.js';
import { createCostLayerRepository, createValuationRecordRepository, createWeightedAverageCostRepository } from '../src/valuation/repository.impl.js';
import { NoCostLayersAvailableError } from '../src/shared/errors.js';

const ORG = 'org-1';
const ITEM = 'item-1';
const WAREHOUSE = 'warehouse-1';

function setup() {
  const costLayerRepository = createCostLayerRepository();
  const weightedAverageRepository = createWeightedAverageCostRepository();
  const valuationRecordRepository = createValuationRecordRepository();
  const engine = createStockValuationEngine(costLayerRepository, weightedAverageRepository, valuationRecordRepository);
  return { costLayerRepository, weightedAverageRepository, valuationRecordRepository, engine };
}

describe('computeFifoConsumption (pure)', () => {
  it('consumes a single layer fully covering the request', () => {
    const result = computeFifoConsumption([{ id: 'layer-1', quantityRemaining: '100.00', unitCost: '5.00' }], '40.00');
    expect(result.consumed).toEqual([{ layerId: 'layer-1', quantity: '40.00', unitCost: '5.00' }]);
    expect(result.totalCost).toBe('200.00');
    expect(result.shortfall).toBe('0.00');
  });

  it('consumes oldest layers first, spilling into the next when one is exhausted', () => {
    const result = computeFifoConsumption(
      [
        { id: 'layer-1', quantityRemaining: '10.00', unitCost: '5.00' },
        { id: 'layer-2', quantityRemaining: '50.00', unitCost: '8.00' },
      ],
      '30.00',
    );
    expect(result.consumed).toEqual([
      { layerId: 'layer-1', quantity: '10.00', unitCost: '5.00' },
      { layerId: 'layer-2', quantity: '20.00', unitCost: '8.00' },
    ]);
    expect(result.totalCost).toBe('210.00');
    expect(result.shortfall).toBe('0.00');
  });

  it('reports a shortfall when layers do not fully cover the request', () => {
    const result = computeFifoConsumption([{ id: 'layer-1', quantityRemaining: '10.00', unitCost: '5.00' }], '30.00');
    expect(result.shortfall).toBe('20.00');
    expect(result.totalCost).toBe('50.00');
  });

  it('handles an empty layer list', () => {
    const result = computeFifoConsumption([], '10.00');
    expect(result.consumed).toEqual([]);
    expect(result.shortfall).toBe('10.00');
  });
});

describe('computeWeightedAverageCost (pure)', () => {
  it('blends existing and new cost proportionally to quantity', () => {
    expect(computeWeightedAverageCost('10.00', '100.00', '100.00', '20.00')).toBe('15.00');
  });

  it('is the new unit cost when there was no existing quantity', () => {
    expect(computeWeightedAverageCost('0.00', '0.00', '50.00', '8.00')).toBe('8.00');
  });

  it('is 0.00 when the resulting total quantity is 0', () => {
    expect(computeWeightedAverageCost('0.00', '0.00', '0.00', '8.00')).toBe('0.00');
  });
});

describe('StockValuationEngine — recordReceipt', () => {
  it('appends a FIFO cost layer', async () => {
    const { engine } = setup();
    const layer = await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '5.00' });
    expect(layer.quantityRemaining).toBe('100.00');
    expect(layer.unitCost).toBe('5.00');
  });

  it('updates the running weighted-average cost', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '10.00' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '20.00' });
    const weightedAverage = await engine.getWeightedAverageCost(ORG, ITEM, WAREHOUSE);
    expect(weightedAverage?.averageCost).toBe('15.00');
    expect(weightedAverage?.totalQuantity).toBe('200.00');
  });

  it('multiple receipts create multiple independent FIFO layers', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00', unitCost: '5.00' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '50.00', unitCost: '7.00' });
    expect(await engine.listCostLayers(ORG, ITEM, WAREHOUSE)).toHaveLength(2);
  });
});

describe('StockValuationEngine — recordIssue (fifo)', () => {
  it('values an issue using the oldest layers first', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00', receivedAt: '2026-01-01T00:00:00.000Z' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '8.00', receivedAt: '2026-01-02T00:00:00.000Z' });
    const valuation = await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '15.00', method: 'fifo' });
    expect(valuation.method).toBe('fifo');
    expect(valuation.totalValue).toBe('90.00');
  });

  it('reduces the remaining quantity of consumed layers', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00', receivedAt: '2026-01-01T00:00:00.000Z' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '4.00', method: 'fifo' });
    const layers = await engine.listCostLayers(ORG, ITEM, WAREHOUSE);
    expect(layers[0]?.quantityRemaining).toBe('6.00');
  });

  it('fully consumed layers no longer appear in available layers', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00', receivedAt: '2026-01-01T00:00:00.000Z' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', method: 'fifo' });
    expect(await engine.listCostLayers(ORG, ITEM, WAREHOUSE)).toHaveLength(0);
  });

  it('throws NoCostLayersAvailableError when layers cannot cover the request', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', unitCost: '5.00' });
    await expect(engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', method: 'fifo' })).rejects.toBeInstanceOf(
      NoCostLayersAvailableError,
    );
  });

  it('throws NoCostLayersAvailableError when there are no layers at all', async () => {
    const { engine } = setup();
    await expect(engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '1.00', method: 'fifo' })).rejects.toBeInstanceOf(
      NoCostLayersAvailableError,
    );
  });
});

describe('StockValuationEngine — recordIssue (weighted_average)', () => {
  it('values an issue at the current weighted-average cost', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '10.00' });
    const valuation = await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', method: 'weighted_average' });
    expect(valuation.method).toBe('weighted_average');
    expect(valuation.unitCost).toBe('10.00');
    expect(valuation.totalValue).toBe('100.00');
  });

  it('reduces the remaining weighted-average total quantity', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '10.00' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '30.00', method: 'weighted_average' });
    const weightedAverage = await engine.getWeightedAverageCost(ORG, ITEM, WAREHOUSE);
    expect(weightedAverage?.totalQuantity).toBe('70.00');
  });

  it('is 0.00 cost when there is no weighted-average record yet', async () => {
    const { engine } = setup();
    const valuation = await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', method: 'weighted_average' });
    expect(valuation.unitCost).toBe('0.00');
    expect(valuation.totalValue).toBe('0.00');
  });
});

describe('StockValuationEngine — FIFO and weighted average tracked independently', () => {
  it('recording a FIFO issue does not affect the weighted-average totalQuantity', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '10.00' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00', method: 'fifo' });
    const weightedAverage = await engine.getWeightedAverageCost(ORG, ITEM, WAREHOUSE);
    expect(weightedAverage?.totalQuantity).toBe('100.00');
  });

  it('recording a weighted-average issue does not affect FIFO layers', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '100.00', unitCost: '10.00' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00', method: 'weighted_average' });
    const layers = await engine.listCostLayers(ORG, ITEM, WAREHOUSE);
    expect(layers[0]?.quantityRemaining).toBe('100.00');
  });
});

describe('StockValuationEngine — three-layer FIFO consumption', () => {
  it('spills across three layers when needed', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '1.00', receivedAt: '2026-01-01T00:00:00.000Z' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '2.00', receivedAt: '2026-01-02T00:00:00.000Z' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '3.00', receivedAt: '2026-01-03T00:00:00.000Z' });
    const valuation = await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '25.00', method: 'fifo' });
    expect(valuation.totalValue).toBe('45.00');
  });
});

describe('StockValuationEngine — organization scoping', () => {
  it('cost layers and valuations are organization-scoped', async () => {
    const { engine, costLayerRepository, valuationRecordRepository } = setup();
    const layer = await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00' });
    const valuation = await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', method: 'fifo' });
    expect(await costLayerRepository.findById('org-2', layer.id)).toBeNull();
    expect(await valuationRecordRepository.findById('org-2', valuation.id)).toBeNull();
  });
});

describe('StockValuationEngine — weighted average across three receipts', () => {
  it('blends three receipts into one running average', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '10.00' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '20.00' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '20.00', unitCost: '5.00' });
    const weightedAverage = await engine.getWeightedAverageCost(ORG, ITEM, WAREHOUSE);
    expect(weightedAverage?.averageCost).toBe('10.00');
    expect(weightedAverage?.totalQuantity).toBe('40.00');
  });
});

describe('StockValuationEngine — per-warehouse independence', () => {
  it('cost layers at one warehouse do not leak into another', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00' });
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: 'warehouse-2', quantity: '20.00', unitCost: '8.00' });
    expect(await engine.listCostLayers(ORG, ITEM, WAREHOUSE)).toHaveLength(1);
    expect(await engine.listCostLayers(ORG, ITEM, 'warehouse-2')).toHaveLength(1);
  });
});

describe('StockValuationEngine — get/list/findByItem', () => {
  it('getValuation() returns null for an unknown record', async () => {
    const { engine } = setup();
    expect(await engine.getValuation(ORG, 'missing')).toBeNull();
  });

  it('listValuations()/findByItem() round-trip', async () => {
    const { engine } = setup();
    await engine.recordReceipt(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '10.00', unitCost: '5.00' });
    await engine.recordIssue(ORG, { itemId: ITEM, warehouseId: WAREHOUSE, quantity: '5.00', method: 'fifo' });
    expect(await engine.listValuations(ORG)).toHaveLength(1);
    expect(await engine.findByItem(ORG, ITEM)).toHaveLength(1);
  });

  it('getWeightedAverageCost() returns null before any receipt', async () => {
    const { engine } = setup();
    expect(await engine.getWeightedAverageCost(ORG, ITEM, WAREHOUSE)).toBeNull();
  });
});
