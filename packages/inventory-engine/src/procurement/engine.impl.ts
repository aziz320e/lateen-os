/**
 * Real Procurement Preparation engine — deterministic reorder
 * suggestions, purchase-request generation, and shortage detection.
 * **No purchasing workflow** — every output here is a recommendation
 * or a plain data record; raising an actual approval process is the
 * Relationship Layer's job, via Workflow Engine's public API.
 *
 * @module procurement/engine.impl
 */
import type { InventoryItemId } from '../item/types.js';
import type { InventoryEventBus } from '../events/inventory-event-bus.js';
import { isBelowMinimum, isBelowReorderPoint, computeAvailableQuantity } from '../stock/engine.impl.js';
import type { InventoryStockEngine } from '../stock/engine.impl.js';
import { subtractAmounts, compareAmounts } from '../shared/decimal.js';
import { PurchaseRequestNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PurchaseRequestId } from '../shared/identifiers.js';
import type { WarehouseId } from '../warehouse/types.js';
import type { PurchaseRequestRepository } from './repository.js';
import type { PurchaseRequest, PurchaseRequestStatus, ReorderSuggestion, ShortageDetection } from './types.js';

/** Pure: how much to (re)order to reach `maximumStock` (or, absent one, back up to `reorderPoint`) from `available`. Never negative. */
export function computeSuggestedReorderQuantity(available: string, reorderPoint: string, maximumStock: string | undefined): string {
  const target = maximumStock ?? reorderPoint;
  const suggested = subtractAmounts(target, available);
  return compareAmounts(suggested, '0') === -1 ? '0.00' : suggested;
}

export interface GeneratePurchaseRequestInput {
  readonly itemId: InventoryItemId;
  readonly warehouseId: WarehouseId;
  readonly quantity: string;
}

export interface ProcurementPreparationEngine {
  /** Every (item, warehouse) currently at or below its reorder point, with a deterministic suggested order quantity. */
  computeReorderSuggestions(organizationId: OrganizationId): Promise<readonly ReorderSuggestion[]>;
  /** Every (item, warehouse) currently below its configured minimum stock. Publishes `inventory.shortage.detected` once per detected shortage. */
  detectShortages(organizationId: OrganizationId): Promise<readonly ShortageDetection[]>;
  /** Persists a deterministic purchase request recommendation. Publishes `inventory.reorder.recommended`. */
  generatePurchaseRequest(organizationId: OrganizationId, input: GeneratePurchaseRequestInput): Promise<PurchaseRequest>;
  acknowledgePurchaseRequest(organizationId: OrganizationId, purchaseRequestId: PurchaseRequestId): Promise<PurchaseRequest>;
  dismissPurchaseRequest(organizationId: OrganizationId, purchaseRequestId: PurchaseRequestId): Promise<PurchaseRequest>;
  getPurchaseRequest(organizationId: OrganizationId, purchaseRequestId: PurchaseRequestId): Promise<PurchaseRequest | null>;
  listPurchaseRequests(organizationId: OrganizationId): Promise<readonly PurchaseRequest[]>;
  findByStatus(organizationId: OrganizationId, status: PurchaseRequestStatus): Promise<readonly PurchaseRequest[]>;
}

/** Creates a real {@link ProcurementPreparationEngine}. */
export function createProcurementPreparationEngine(
  stock: InventoryStockEngine,
  repository: PurchaseRequestRepository,
  eventBus?: InventoryEventBus,
  now: () => string = nowIso,
): ProcurementPreparationEngine {
  async function requireRequest(organizationId: OrganizationId, purchaseRequestId: PurchaseRequestId): Promise<PurchaseRequest> {
    const request = await repository.findById(organizationId, purchaseRequestId);
    if (!request) throw new PurchaseRequestNotFoundError(purchaseRequestId);
    return request;
  }

  return {
    async computeReorderSuggestions(organizationId) {
      const levels = await stock.list(organizationId);
      const suggestions: ReorderSuggestion[] = [];
      for (const level of levels) {
        const available = computeAvailableQuantity(level);
        if (!isBelowReorderPoint(available, level.reorderPoint)) continue;
        suggestions.push({
          itemId: level.itemId,
          warehouseId: level.warehouseId,
          availableQuantity: available,
          reorderPoint: level.reorderPoint as string,
          suggestedQuantity: computeSuggestedReorderQuantity(available, level.reorderPoint as string, level.maximumStock),
        });
      }
      return suggestions;
    },

    async detectShortages(organizationId) {
      const levels = await stock.list(organizationId);
      const shortages: ShortageDetection[] = [];
      for (const level of levels) {
        if (!isBelowMinimum(level.quantityOnHand, level.minimumStock)) continue;
        const shortage: ShortageDetection = {
          itemId: level.itemId,
          warehouseId: level.warehouseId,
          availableQuantity: computeAvailableQuantity(level),
          minimumStock: level.minimumStock as string,
        };
        shortages.push(shortage);
        eventBus?.publish('inventory.shortage.detected', {
          organizationId,
          itemId: shortage.itemId,
          warehouseId: shortage.warehouseId,
          available: shortage.availableQuantity,
        });
      }
      return shortages;
    },

    async generatePurchaseRequest(organizationId, input) {
      const timestamp = now();
      const request: PurchaseRequest = {
        id: generateId('purchase-request'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        status: 'suggested',
      };
      await repository.save(request);
      eventBus?.publish('inventory.reorder.recommended', {
        organizationId,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        suggestedQuantity: input.quantity,
      });
      return request;
    },

    async acknowledgePurchaseRequest(organizationId, purchaseRequestId) {
      const request = await requireRequest(organizationId, purchaseRequestId);
      const updated: PurchaseRequest = { ...request, status: 'acknowledged', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async dismissPurchaseRequest(organizationId, purchaseRequestId) {
      const request = await requireRequest(organizationId, purchaseRequestId);
      const updated: PurchaseRequest = { ...request, status: 'dismissed', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getPurchaseRequest(organizationId, purchaseRequestId) {
      return repository.findById(organizationId, purchaseRequestId);
    },

    async listPurchaseRequests(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
