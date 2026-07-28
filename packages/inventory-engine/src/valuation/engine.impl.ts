/**
 * Real Stock Valuation engine — deterministic FIFO and Weighted
 * Average costing. This module **never implements accounting** — it
 * only computes and records cost figures; posting those figures to a
 * ledger is the Relationship Layer's job, calling Finance Engine's own
 * public API.
 *
 * @module valuation/engine.impl
 */
import type { InventoryItemId } from '../item/types.js';
import { addAmounts, parseDecimal, toMoney } from '../shared/decimal.js';
import { NoCostLayersAvailableError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ValuationRecordId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { CostLayerRepository, ValuationRecordRepository, WeightedAverageCostRepository } from './repository.js';
import type { CostLayer, ValuationMethod, ValuationRecord, WeightedAverageCost } from './types.js';

export interface FifoConsumptionResult {
  readonly consumed: readonly { readonly layerId: string; readonly quantity: string; readonly unitCost: string }[];
  readonly totalCost: string;
  /** `0.00` when the layers fully covered the requested quantity; otherwise the unconsumed remainder. */
  readonly shortfall: string;
}

/** Pure: consumes FIFO layers oldest-first for `quantityToConsume`, never mutating the input layers. */
export function computeFifoConsumption(
  layers: readonly Pick<CostLayer, 'id' | 'quantityRemaining' | 'unitCost'>[],
  quantityToConsume: string,
): FifoConsumptionResult {
  let remaining = parseDecimal(quantityToConsume);
  const consumed: { layerId: string; quantity: string; unitCost: string }[] = [];
  let totalCost = 0;

  for (const layer of layers) {
    if (remaining <= 0) break;
    const available = parseDecimal(layer.quantityRemaining);
    const take = Math.min(available, remaining);
    if (take <= 0) continue;
    consumed.push({ layerId: layer.id, quantity: toMoney(take), unitCost: layer.unitCost });
    totalCost += take * parseDecimal(layer.unitCost);
    remaining = toMoneyNumber(remaining - take);
  }

  return { consumed, totalCost: toMoney(totalCost), shortfall: toMoney(Math.max(0, remaining)) };
}

function toMoneyNumber(value: number): number {
  return Number.parseFloat(toMoney(value));
}

/** Pure: the new blended weighted-average unit cost after receiving `newQty` at `newUnitCost`. `0.00` if the resulting total quantity is `0`. */
export function computeWeightedAverageCost(existingAvgCost: string, existingQty: string, newQty: string, newUnitCost: string): string {
  const totalQty = parseDecimal(existingQty) + parseDecimal(newQty);
  if (totalQty === 0) return '0.00';
  const totalCost = parseDecimal(existingAvgCost) * parseDecimal(existingQty) + parseDecimal(newUnitCost) * parseDecimal(newQty);
  return toMoney(totalCost / totalQty);
}

export interface RecordReceiptInput {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantity: string;
  readonly unitCost: string;
  readonly receivedAt?: ISODateTime;
}

export interface RecordIssueInput {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantity: string;
  readonly method: ValuationMethod;
}

export interface StockValuationEngine {
  /** Appends a new FIFO cost layer and updates the running weighted-average cost — both methods stay available at all times. */
  recordReceipt(organizationId: OrganizationId, input: RecordReceiptInput): Promise<CostLayer>;
  /** Values and persists one issue under the given method. Throws {@link NoCostLayersAvailableError} for `fifo` when layers can't fully cover the requested quantity. */
  recordIssue(organizationId: OrganizationId, input: RecordIssueInput): Promise<ValuationRecord>;
  getWeightedAverageCost(organizationId: OrganizationId, itemId: InventoryItemId, warehouseId: WarehouseId): Promise<WeightedAverageCost | null>;
  listCostLayers(organizationId: OrganizationId, itemId: InventoryItemId, warehouseId: WarehouseId): Promise<readonly CostLayer[]>;
  getValuation(organizationId: OrganizationId, valuationId: ValuationRecordId): Promise<ValuationRecord | null>;
  listValuations(organizationId: OrganizationId): Promise<readonly ValuationRecord[]>;
  findByItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<readonly ValuationRecord[]>;
}

/** Creates a real {@link StockValuationEngine}. */
export function createStockValuationEngine(
  costLayerRepository: CostLayerRepository,
  weightedAverageRepository: WeightedAverageCostRepository,
  valuationRecordRepository: ValuationRecordRepository,
  now: () => string = nowIso,
): StockValuationEngine {
  return {
    async recordReceipt(organizationId, input) {
      const timestamp = now();
      const layer: CostLayer = {
        id: generateId('cost-layer'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        quantityRemaining: input.quantity,
        unitCost: input.unitCost,
        receivedAt: input.receivedAt ?? timestamp,
      };
      await costLayerRepository.save(layer);

      const existing = await weightedAverageRepository.findByItemAndWarehouse(organizationId, input.itemId, input.warehouseId);
      const newAverageCost = computeWeightedAverageCost(existing?.averageCost ?? '0.00', existing?.totalQuantity ?? '0.00', input.quantity, input.unitCost);
      const weightedAverage: WeightedAverageCost = {
        id: existing?.id ?? generateId('weighted-average'),
        organizationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        averageCost: newAverageCost,
        totalQuantity: addAmounts(existing?.totalQuantity ?? '0.00', input.quantity),
      };
      await weightedAverageRepository.save(weightedAverage);

      return layer;
    },

    async recordIssue(organizationId, input) {
      const timestamp = now();
      let unitCost: string;
      let totalValue: string;

      if (input.method === 'fifo') {
        const layers = await costLayerRepository.findAvailableByItemAndWarehouse(organizationId, input.itemId, input.warehouseId);
        const result = computeFifoConsumption(layers, input.quantity);
        if (Number.parseFloat(result.shortfall) > 0) {
          throw new NoCostLayersAvailableError(input.itemId, input.warehouseId);
        }
        for (const consumedLayer of result.consumed) {
          const layer = layers.find((candidate) => candidate.id === consumedLayer.layerId);
          if (!layer) continue;
          await costLayerRepository.save({
            ...layer,
            quantityRemaining: toMoney(parseDecimal(layer.quantityRemaining) - parseDecimal(consumedLayer.quantity)),
            updatedAt: timestamp,
          });
        }
        totalValue = result.totalCost;
        unitCost = parseDecimal(input.quantity) === 0 ? '0.00' : toMoney(parseDecimal(result.totalCost) / parseDecimal(input.quantity));
      } else {
        const weightedAverage = await weightedAverageRepository.findByItemAndWarehouse(organizationId, input.itemId, input.warehouseId);
        unitCost = weightedAverage?.averageCost ?? '0.00';
        totalValue = toMoney(parseDecimal(unitCost) * parseDecimal(input.quantity));
        if (weightedAverage) {
          await weightedAverageRepository.save({
            ...weightedAverage,
            totalQuantity: toMoney(Math.max(0, parseDecimal(weightedAverage.totalQuantity) - parseDecimal(input.quantity))),
            updatedAt: timestamp,
          });
        }
      }

      const valuationRecord: ValuationRecord = {
        id: generateId('valuation-record'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        method: input.method,
        quantity: input.quantity,
        unitCost,
        totalValue,
        computedAt: timestamp,
      };
      await valuationRecordRepository.save(valuationRecord);
      return valuationRecord;
    },

    async getWeightedAverageCost(organizationId, itemId, warehouseId) {
      return weightedAverageRepository.findByItemAndWarehouse(organizationId, itemId, warehouseId);
    },

    async listCostLayers(organizationId, itemId, warehouseId) {
      return costLayerRepository.findAvailableByItemAndWarehouse(organizationId, itemId, warehouseId);
    },

    async getValuation(organizationId, valuationId) {
      return valuationRecordRepository.findById(organizationId, valuationId);
    },

    async listValuations(organizationId) {
      return valuationRecordRepository.findAll(organizationId);
    },

    async findByItem(organizationId, itemId) {
      return valuationRecordRepository.findByItem(organizationId, itemId);
    },
  };
}
