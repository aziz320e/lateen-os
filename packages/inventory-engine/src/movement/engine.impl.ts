/**
 * Real Inventory Movements engine — receive, issue, transfer,
 * adjustment, return, reservation, and release. Every operation
 * mutates stock through the injected {@link InventoryStockEngine} (the
 * single source of truth for stock arithmetic) and then persists
 * exactly one immutable {@link MovementRecord} — there is no update or
 * delete on this engine's public surface.
 *
 * @module movement/engine.impl
 */
import type { InventoryItemId } from '../item/types.js';
import type { InventoryEventBus } from '../events/inventory-event-bus.js';
import type { InventoryStockEngine } from '../stock/engine.impl.js';
import { compareAmounts, subtractAmounts } from '../shared/decimal.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MovementRecordId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { MovementRecordRepository } from './repository.js';
import type { MovementRecord, MovementType } from './types.js';

export interface ReceiveInput {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantity: string;
  readonly reason?: string;
  readonly referenceId?: string;
  readonly occurredAt?: ISODateTime;
}

export type IssueInput = ReceiveInput;
export type ReturnInput = ReceiveInput;
export type ReserveInput = ReceiveInput;
export type ReleaseInput = ReceiveInput;

export interface TransferInput {
  readonly itemId: InventoryItemId;
  readonly fromWarehouseId: WarehouseId;
  readonly toWarehouseId: WarehouseId;
  readonly quantity: string;
  readonly reason?: string;
  readonly referenceId?: string;
  readonly occurredAt?: ISODateTime;
}

export interface AdjustInput {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  /** Signed — positive increases on-hand quantity, negative decreases it. */
  readonly quantityDelta: string;
  readonly reason?: string;
  readonly referenceId?: string;
  readonly occurredAt?: ISODateTime;
}

export interface InventoryMovementEngine {
  /** Increases on-hand quantity. Publishes `inventory.received`. */
  receive(organizationId: OrganizationId, input: ReceiveInput): Promise<MovementRecord>;
  /** Decreases on-hand quantity. Throws `InsufficientStockError` if it would exceed on-hand quantity. Publishes `inventory.issued`. */
  issue(organizationId: OrganizationId, input: IssueInput): Promise<MovementRecord>;
  /** Decreases on-hand at the source and increases it at the destination, as one atomic pair of stock mutations and one movement record. Publishes `inventory.transferred`. */
  transfer(organizationId: OrganizationId, input: TransferInput): Promise<MovementRecord>;
  /** A signed correction to on-hand quantity (e.g. a physical-count or damage adjustment). Publishes `inventory.adjusted`. */
  adjust(organizationId: OrganizationId, input: AdjustInput): Promise<MovementRecord>;
  /** Increases on-hand quantity from a customer/vendor return. Publishes `inventory.received` (a return is, from the stock ledger's perspective, a receipt). */
  returnStock(organizationId: OrganizationId, input: ReturnInput): Promise<MovementRecord>;
  /** Increases reserved quantity. Throws `InsufficientStockError` if it would exceed available quantity. Publishes `inventory.reserved`. */
  reserve(organizationId: OrganizationId, input: ReserveInput): Promise<MovementRecord>;
  /** Decreases reserved quantity. Publishes `inventory.released`. */
  release(organizationId: OrganizationId, input: ReleaseInput): Promise<MovementRecord>;

  getMovement(organizationId: OrganizationId, movementId: MovementRecordId): Promise<MovementRecord | null>;
  listMovements(organizationId: OrganizationId): Promise<readonly MovementRecord[]>;
  findByItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<readonly MovementRecord[]>;
  findByWarehouse(organizationId: OrganizationId, warehouseId: WarehouseId): Promise<readonly MovementRecord[]>;
  findByType(organizationId: OrganizationId, movementType: MovementType): Promise<readonly MovementRecord[]>;
}

/** Creates a real {@link InventoryMovementEngine}. */
export function createInventoryMovementEngine(
  repository: MovementRecordRepository,
  stock: InventoryStockEngine,
  eventBus?: InventoryEventBus,
  now: () => string = nowIso,
): InventoryMovementEngine {
  async function record(
    organizationId: OrganizationId,
    movementType: MovementType,
    itemId: InventoryItemId,
    warehouseId: WarehouseId,
    quantity: string,
    extra: Partial<Pick<MovementRecord, 'fromWarehouseId' | 'toWarehouseId' | 'reason' | 'referenceId'>>,
    occurredAt: ISODateTime | undefined,
  ): Promise<MovementRecord> {
    const timestamp = now();
    const movement: MovementRecord = {
      id: generateId('movement'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      itemId,
      warehouseId,
      movementType,
      quantity,
      fromWarehouseId: extra.fromWarehouseId,
      toWarehouseId: extra.toWarehouseId,
      reason: extra.reason,
      referenceId: extra.referenceId,
      occurredAt: occurredAt ?? timestamp,
    };
    await repository.save(movement);
    return movement;
  }

  return {
    async receive(organizationId, input) {
      await stock.increaseOnHand(organizationId, input.itemId, input.warehouseId, input.quantity);
      const movement = await record(organizationId, 'receive', input.itemId, input.warehouseId, input.quantity, input, input.occurredAt);
      eventBus?.publish('inventory.received', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity, movementId: movement.id });
      return movement;
    },

    async issue(organizationId, input) {
      await stock.decreaseOnHand(organizationId, input.itemId, input.warehouseId, input.quantity);
      const movement = await record(organizationId, 'issue', input.itemId, input.warehouseId, input.quantity, input, input.occurredAt);
      eventBus?.publish('inventory.issued', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity, movementId: movement.id });
      return movement;
    },

    async transfer(organizationId, input) {
      await stock.decreaseOnHand(organizationId, input.itemId, input.fromWarehouseId, input.quantity);
      await stock.increaseOnHand(organizationId, input.itemId, input.toWarehouseId, input.quantity);
      const movement = await record(organizationId, 'transfer', input.itemId, input.fromWarehouseId, input.quantity, {
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        reason: input.reason,
        referenceId: input.referenceId,
      }, input.occurredAt);
      eventBus?.publish('inventory.transferred', {
        organizationId,
        itemId: input.itemId,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        quantity: input.quantity,
        movementId: movement.id,
      });
      return movement;
    },

    async adjust(organizationId, input) {
      const isNegative = compareAmounts(input.quantityDelta, '0') === -1;
      if (isNegative) {
        await stock.decreaseOnHand(organizationId, input.itemId, input.warehouseId, subtractAmounts('0', input.quantityDelta));
      } else {
        await stock.increaseOnHand(organizationId, input.itemId, input.warehouseId, input.quantityDelta);
      }
      const movement = await record(organizationId, 'adjustment', input.itemId, input.warehouseId, input.quantityDelta, input, input.occurredAt);
      eventBus?.publish('inventory.adjusted', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantityDelta, movementId: movement.id });
      return movement;
    },

    async returnStock(organizationId, input) {
      await stock.increaseOnHand(organizationId, input.itemId, input.warehouseId, input.quantity);
      const movement = await record(organizationId, 'return', input.itemId, input.warehouseId, input.quantity, input, input.occurredAt);
      eventBus?.publish('inventory.received', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity, movementId: movement.id });
      return movement;
    },

    async reserve(organizationId, input) {
      await stock.increaseReserved(organizationId, input.itemId, input.warehouseId, input.quantity);
      const movement = await record(organizationId, 'reservation', input.itemId, input.warehouseId, input.quantity, input, input.occurredAt);
      eventBus?.publish('inventory.reserved', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity, movementId: movement.id });
      return movement;
    },

    async release(organizationId, input) {
      await stock.decreaseReserved(organizationId, input.itemId, input.warehouseId, input.quantity);
      const movement = await record(organizationId, 'release', input.itemId, input.warehouseId, input.quantity, input, input.occurredAt);
      eventBus?.publish('inventory.released', { organizationId, itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity, movementId: movement.id });
      return movement;
    },

    async getMovement(organizationId, movementId) {
      return repository.findById(organizationId, movementId);
    },

    async listMovements(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByItem(organizationId, itemId) {
      return repository.findByItem(organizationId, itemId);
    },

    async findByWarehouse(organizationId, warehouseId) {
      return repository.findByWarehouse(organizationId, warehouseId);
    },

    async findByType(organizationId, movementType) {
      return repository.findByType(organizationId, movementType);
    },
  };
}
