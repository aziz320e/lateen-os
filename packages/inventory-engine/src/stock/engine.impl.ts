/**
 * Real Inventory Stock engine — stock levels, available/reserved/
 * damaged quantities, minimum/maximum stock, and reorder points.
 * Deterministic calculations only. The low-level mutation methods
 * (`increaseOnHand`, `decreaseReserved`, etc.) are called exclusively
 * by the Inventory Movements engine — this module is the single
 * source of truth for stock arithmetic, never duplicated elsewhere.
 *
 * @module stock/engine.impl
 */
import { createKeyMutex } from '@lateen-os/shared-kernel/concurrency';
import type { InventoryItemId } from '../item/types.js';
import { addAmounts, compareAmounts, subtractAmounts } from '../shared/decimal.js';
import { InsufficientStockError, StockLevelNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, StockLevelId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { StockLevelRepository } from './repository.js';
import type { StockLevel } from './types.js';

/** Pure: quantity truly available to promise — on hand, less reserved and damaged quantities. */
export function computeAvailableQuantity(
  stockLevel: Pick<StockLevel, 'quantityOnHand' | 'reservedQuantity' | 'damagedQuantity'>,
): string {
  return subtractAmounts(
    subtractAmounts(stockLevel.quantityOnHand, stockLevel.reservedQuantity),
    stockLevel.damagedQuantity,
  );
}

/** Pure: whether available quantity has fallen at or below the configured reorder point. `false` when no reorder point is configured. */
export function isBelowReorderPoint(available: string, reorderPoint: string | undefined): boolean {
  if (reorderPoint === undefined) return false;
  return compareAmounts(available, reorderPoint) <= 0;
}

/** Pure: whether on-hand quantity has fallen below the configured minimum. `false` when no minimum is configured. */
export function isBelowMinimum(quantityOnHand: string, minimumStock: string | undefined): boolean {
  if (minimumStock === undefined) return false;
  return compareAmounts(quantityOnHand, minimumStock) < 0;
}

/** Pure: whether on-hand quantity exceeds the configured maximum. `false` when no maximum is configured. */
export function isAboveMaximum(quantityOnHand: string, maximumStock: string | undefined): boolean {
  if (maximumStock === undefined) return false;
  return compareAmounts(quantityOnHand, maximumStock) > 0;
}

export interface SetStockThresholdsInput {
  readonly minimumStock?: string;
  readonly maximumStock?: string;
  readonly reorderPoint?: string;
}

export interface InventoryStockEngine {
  /** Finds the stock level for (item, warehouse), creating a zeroed record on first use. */
  getOrCreate(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
  ): Promise<StockLevel>;
  setThresholds(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    input: SetStockThresholdsInput,
  ): Promise<StockLevel>;
  get(organizationId: OrganizationId, stockLevelId: StockLevelId): Promise<StockLevel | null>;
  getByItemAndWarehouse(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
  ): Promise<StockLevel | null>;
  list(organizationId: OrganizationId): Promise<readonly StockLevel[]>;
  findByItem(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
  ): Promise<readonly StockLevel[]>;
  findByWarehouse(
    organizationId: OrganizationId,
    warehouseId: WarehouseId,
  ): Promise<readonly StockLevel[]>;
  listBelowReorderPoint(organizationId: OrganizationId): Promise<readonly StockLevel[]>;
  listBelowMinimum(organizationId: OrganizationId): Promise<readonly StockLevel[]>;

  /** Increases on-hand quantity (receive, return, or a positive adjustment). */
  increaseOnHand(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
  /** Decreases on-hand quantity (issue, or a negative adjustment). Throws {@link InsufficientStockError} if it would exceed on-hand quantity. */
  decreaseOnHand(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
  /** Increases reserved quantity. Throws {@link InsufficientStockError} if it would exceed available quantity. */
  increaseReserved(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
  /** Decreases reserved quantity. Never goes below `0`. */
  decreaseReserved(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
  /** Increases damaged quantity (does not itself change on-hand quantity — callers typically combine this with a corresponding on-hand adjustment). */
  increaseDamaged(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
  /** Decreases damaged quantity. Never goes below `0`. */
  decreaseDamaged(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
  ): Promise<StockLevel>;
}

/** Creates a real {@link InventoryStockEngine} backed by a {@link StockLevelRepository}. */
export function createInventoryStockEngine(
  repository: StockLevelRepository,
  now: () => string = nowIso,
): InventoryStockEngine {
  // Serializes every read-compute-write against a single (item,
  // warehouse) stock level. Without this, two concurrent mutations
  // against the same stock level (e.g. two issues, or two reservations)
  // can both read the same starting quantities, both pass their own
  // "is there enough stock" check independently, and the second
  // `save()` silently overwrites the first's effect -- a lost update
  // that can also duplicate a `getOrCreate`d record for a brand-new
  // (item, warehouse) pair. Keyed by `${itemId}::${warehouseId}` (the
  // same key shape `StockLevelNotFoundError` already uses below);
  // stock levels for different items/warehouses are never blocked by
  // one another.
  const mutex = createKeyMutex();
  const levelKey = (itemId: InventoryItemId, warehouseId: WarehouseId) =>
    `${itemId}::${warehouseId}`;

  async function requireLevel(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
  ): Promise<StockLevel> {
    const level = await repository.findByItemAndWarehouse(organizationId, itemId, warehouseId);
    if (!level) throw new StockLevelNotFoundError(`${itemId}::${warehouseId}`);
    return level;
  }

  async function getOrCreateLevel(
    organizationId: OrganizationId,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
  ): Promise<StockLevel> {
    const existing = await repository.findByItemAndWarehouse(organizationId, itemId, warehouseId);
    if (existing) return existing;
    const timestamp = now();
    const level: StockLevel = {
      id: generateId('stock-level'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemId,
      warehouseId,
      quantityOnHand: '0.00',
      reservedQuantity: '0.00',
      damagedQuantity: '0.00',
    };
    await repository.save(level);
    return level;
  }

  return {
    async getOrCreate(organizationId, itemId, warehouseId) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), () =>
        getOrCreateLevel(organizationId, itemId, warehouseId),
      );
    },

    async setThresholds(organizationId, itemId, warehouseId, input) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const existing = await getOrCreateLevel(organizationId, itemId, warehouseId);
        const updated: StockLevel = {
          ...existing,
          minimumStock: input.minimumStock ?? existing.minimumStock,
          maximumStock: input.maximumStock ?? existing.maximumStock,
          reorderPoint: input.reorderPoint ?? existing.reorderPoint,
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async get(organizationId, stockLevelId) {
      return repository.findById(organizationId, stockLevelId);
    },

    async getByItemAndWarehouse(organizationId, itemId, warehouseId) {
      return repository.findByItemAndWarehouse(organizationId, itemId, warehouseId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByItem(organizationId, itemId) {
      return repository.findByItem(organizationId, itemId);
    },

    async findByWarehouse(organizationId, warehouseId) {
      return repository.findByWarehouse(organizationId, warehouseId);
    },

    async listBelowReorderPoint(organizationId) {
      const levels = await repository.findAll(organizationId);
      return levels.filter((level) =>
        isBelowReorderPoint(computeAvailableQuantity(level), level.reorderPoint),
      );
    },

    async listBelowMinimum(organizationId) {
      const levels = await repository.findAll(organizationId);
      return levels.filter((level) => isBelowMinimum(level.quantityOnHand, level.minimumStock));
    },

    async increaseOnHand(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await getOrCreateLevel(organizationId, itemId, warehouseId);
        const updated: StockLevel = {
          ...level,
          quantityOnHand: addAmounts(level.quantityOnHand, quantity),
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async decreaseOnHand(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await requireLevel(organizationId, itemId, warehouseId);
        if (compareAmounts(quantity, level.quantityOnHand) === 1) {
          throw new InsufficientStockError(itemId, quantity, level.quantityOnHand);
        }
        const updated: StockLevel = {
          ...level,
          quantityOnHand: subtractAmounts(level.quantityOnHand, quantity),
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async increaseReserved(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await requireLevel(organizationId, itemId, warehouseId);
        const available = computeAvailableQuantity(level);
        if (compareAmounts(quantity, available) === 1) {
          throw new InsufficientStockError(itemId, quantity, available);
        }
        const updated: StockLevel = {
          ...level,
          reservedQuantity: addAmounts(level.reservedQuantity, quantity),
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async decreaseReserved(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await requireLevel(organizationId, itemId, warehouseId);
        const nextReserved = subtractAmounts(level.reservedQuantity, quantity);
        const updated: StockLevel = {
          ...level,
          reservedQuantity: compareAmounts(nextReserved, '0') === -1 ? '0.00' : nextReserved,
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async increaseDamaged(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await requireLevel(organizationId, itemId, warehouseId);
        const updated: StockLevel = {
          ...level,
          damagedQuantity: addAmounts(level.damagedQuantity, quantity),
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },

    async decreaseDamaged(organizationId, itemId, warehouseId, quantity) {
      return mutex.runExclusive(levelKey(itemId, warehouseId), async () => {
        const level = await requireLevel(organizationId, itemId, warehouseId);
        const nextDamaged = subtractAmounts(level.damagedQuantity, quantity);
        const updated: StockLevel = {
          ...level,
          damagedQuantity: compareAmounts(nextDamaged, '0') === -1 ? '0.00' : nextDamaged,
          updatedAt: now(),
        };
        await repository.save(updated);
        return updated;
      });
    },
  };
}
