/**
 * Real Inventory Counting engine — cycle counts and full counts, with
 * deterministic variance computation and stock reconciliation.
 * Reconciliation is intra-package composition: `completeCount()` calls
 * this package's own Inventory Movements `adjust()` for every
 * non-zero variance, so the resulting stock movement is a real,
 * immutable `MovementRecord` like any other adjustment.
 *
 * @module counting/engine.impl
 */
import type { InventoryItemId } from '../item/types.js';
import type { InventoryEventBus } from '../events/inventory-event-bus.js';
import type { InventoryMovementEngine } from '../movement/engine.impl.js';
import { compareAmounts, subtractAmounts } from '../shared/decimal.js';
import { CountLineNotFoundError, InvalidCountTransitionError, InventoryCountNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { InventoryCountId, OrganizationId } from '../shared/identifiers.js';
import type { InventoryStockEngine } from '../stock/engine.impl.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { InventoryCountRepository } from './repository.js';
import type { CountLine, CountStatus, CountType, InventoryCount } from './types.js';

const COUNT_TRANSITIONS: Readonly<Record<CountStatus, readonly CountStatus[]>> = {
  draft: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
};

/** Whether an inventory count may transition from one status to another. */
export function canTransitionCount(from: CountStatus, to: CountStatus): boolean {
  return COUNT_TRANSITIONS[from].includes(to);
}

/** Pure: `countedQuantity - systemQuantity`. */
export function computeVariance(systemQuantity: string, countedQuantity: string): string {
  return subtractAmounts(countedQuantity, systemQuantity);
}

export interface CreateInventoryCountInput {
  readonly countType: CountType;
  readonly warehouseId: WarehouseId;
  readonly itemIds: readonly InventoryItemId[];
}

export interface InventoryCountingEngine {
  /** Snapshots each item's current system quantity into a new, `draft` count. */
  createCount(organizationId: OrganizationId, input: CreateInventoryCountInput): Promise<InventoryCount>;
  startCount(organizationId: OrganizationId, countId: InventoryCountId): Promise<InventoryCount>;
  recordCount(organizationId: OrganizationId, countId: InventoryCountId, itemId: InventoryItemId, countedQuantity: string): Promise<InventoryCount>;
  /** Reconciles every non-zero-variance line via a real Inventory Movements `adjust()`, then marks the count `completed`. Publishes `inventory.count.completed`. */
  completeCount(organizationId: OrganizationId, countId: InventoryCountId): Promise<InventoryCount>;
  getCount(organizationId: OrganizationId, countId: InventoryCountId): Promise<InventoryCount | null>;
  listCounts(organizationId: OrganizationId): Promise<readonly InventoryCount[]>;
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly InventoryCount[]>;
}

/** Creates a real {@link InventoryCountingEngine}. */
export function createInventoryCountingEngine(
  repository: InventoryCountRepository,
  stock: InventoryStockEngine,
  movements: InventoryMovementEngine,
  eventBus?: InventoryEventBus,
  now: () => string = nowIso,
): InventoryCountingEngine {
  async function requireCount(organizationId: OrganizationId, countId: InventoryCountId): Promise<InventoryCount> {
    const count = await repository.findById(organizationId, countId);
    if (!count) throw new InventoryCountNotFoundError(countId);
    return count;
  }

  return {
    async createCount(organizationId, input) {
      const lines: CountLine[] = [];
      for (const itemId of input.itemIds) {
        const level = await stock.getOrCreate(organizationId, itemId, input.warehouseId);
        lines.push({ itemId, systemQuantity: level.quantityOnHand });
      }
      const timestamp = now();
      const count: InventoryCount = {
        id: generateId('inventory-count'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        countType: input.countType,
        warehouseId: input.warehouseId,
        lines,
        status: 'draft',
      };
      await repository.save(count);
      return count;
    },

    async startCount(organizationId, countId) {
      const count = await requireCount(organizationId, countId);
      if (!canTransitionCount(count.status, 'in_progress')) {
        throw new InvalidCountTransitionError(countId, count.status, 'in_progress');
      }
      const updated: InventoryCount = { ...count, status: 'in_progress', startedAt: now(), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async recordCount(organizationId, countId, itemId, countedQuantity) {
      const count = await requireCount(organizationId, countId);
      if (count.status !== 'in_progress') {
        throw new InvalidCountTransitionError(countId, count.status, 'in_progress');
      }
      const lineIndex = count.lines.findIndex((line) => line.itemId === itemId);
      if (lineIndex === -1) throw new CountLineNotFoundError(countId, itemId);

      const lines = count.lines.map((line, index) =>
        index === lineIndex ? { ...line, countedQuantity, variance: computeVariance(line.systemQuantity, countedQuantity) } : line,
      );
      const updated: InventoryCount = { ...count, lines, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async completeCount(organizationId, countId) {
      const count = await requireCount(organizationId, countId);
      if (!canTransitionCount(count.status, 'completed')) {
        throw new InvalidCountTransitionError(countId, count.status, 'completed');
      }

      let varianceCount = 0;
      for (const line of count.lines) {
        if (line.variance === undefined || compareAmounts(line.variance, '0') === 0) continue;
        varianceCount += 1;
        await movements.adjust(organizationId, {
          itemId: line.itemId,
          warehouseId: count.warehouseId,
          quantityDelta: line.variance,
          reason: `${count.countType}_count_reconciliation`,
          referenceId: count.id,
        });
      }

      const timestamp = now();
      const updated: InventoryCount = { ...count, status: 'completed', completedAt: timestamp, updatedAt: timestamp };
      await repository.save(updated);
      eventBus?.publish('inventory.count.completed', { organizationId, countId, varianceCount });
      return updated;
    },

    async getCount(organizationId, countId) {
      return repository.findById(organizationId, countId);
    },

    async listCounts(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByWarehouse(organizationId, warehouseId) {
      return repository.findByWarehouse(organizationId, warehouseId);
    },
  };
}
