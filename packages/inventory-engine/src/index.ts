/**
 * @lateen-os/inventory-engine — Inventory Engine
 *
 * Inventory catalog (items, categories, brands), warehouse management
 * (warehouses, zones, storage locations, bins), inventory stock,
 * inventory movements, stock valuation (FIFO/Weighted Average),
 * inventory counting, and procurement preparation for Lateen OS. Real,
 * deterministic, offline implementation — see `runtime.ts`'s
 * `createInventoryRuntime()` for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as item from './item/index.js';
export * as warehouse from './warehouse/index.js';
export * as stock from './stock/index.js';
export * as movement from './movement/index.js';
export * as valuation from './valuation/index.js';
export * as counting from './counting/index.js';
export * as procurement from './procurement/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createInventoryRuntime,
  type InventoryRuntime,
  type InventoryRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { InventoryItem, InventoryItemStatus, Category, CategoryStatus, Brand, BrandStatus } from './item/types.js';
export type { Warehouse, WarehouseStatus, Zone, ZoneStatus, StorageLocation, StorageLocationStatus, Bin, BinStatus } from './warehouse/types.js';
export type { StockLevel } from './stock/types.js';
export type { MovementRecord, MovementType } from './movement/types.js';
export type { CostLayer, WeightedAverageCost, ValuationRecord, ValuationMethod } from './valuation/types.js';
export type { InventoryCount, CountType, CountStatus, CountLine } from './counting/types.js';
export type { PurchaseRequest, PurchaseRequestStatus, ReorderSuggestion, ShortageDetection } from './procurement/types.js';

/** Real lifecycle/service ports. */
export { canTransitionItem, type InventoryCatalogEngine, type CreateInventoryItemInput, type UpdateInventoryItemInput, type CreateCategoryInput, type CreateBrandInput } from './item/engine.impl.js';
export {
  canTransitionWarehouseEntity,
  computeRemainingCapacity,
  type WarehouseManagementEngine,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type CreateZoneInput,
  type CreateStorageLocationInput,
  type UpdateStorageLocationInput,
  type CreateBinInput,
} from './warehouse/engine.impl.js';
export {
  computeAvailableQuantity,
  isBelowReorderPoint,
  isBelowMinimum,
  isAboveMaximum,
  type InventoryStockEngine,
  type SetStockThresholdsInput,
} from './stock/engine.impl.js';
export {
  type InventoryMovementEngine,
  type ReceiveInput,
  type IssueInput,
  type TransferInput,
  type AdjustInput,
  type ReturnInput,
  type ReserveInput,
  type ReleaseInput,
} from './movement/engine.impl.js';
export {
  computeFifoConsumption,
  computeWeightedAverageCost,
  type FifoConsumptionResult,
  type StockValuationEngine,
  type RecordReceiptInput,
  type RecordIssueInput,
} from './valuation/engine.impl.js';
export {
  canTransitionCount,
  computeVariance,
  type InventoryCountingEngine,
  type CreateInventoryCountInput,
} from './counting/engine.impl.js';
export {
  computeSuggestedReorderQuantity,
  type ProcurementPreparationEngine,
  type GeneratePurchaseRequestInput,
} from './procurement/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { InventoryItemRepository, CategoryRepository, BrandRepository } from './item/repository.js';
export type { WarehouseRepository, ZoneRepository, StorageLocationRepository, BinRepository } from './warehouse/repository.js';
export type { StockLevelRepository } from './stock/repository.js';
export type { MovementRecordRepository } from './movement/repository.js';
export type { CostLayerRepository, WeightedAverageCostRepository, ValuationRecordRepository } from './valuation/repository.js';
export type { InventoryCountRepository } from './counting/repository.js';
export type { PurchaseRequestRepository } from './procurement/repository.js';

/** Relationship Layer (Finance Engine / Sales Engine / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { InventoryQueries } from './queries/inventory-queries.js';

/** Typed event bus. */
export type { InventoryDomainEvent } from './events/inventory-events.js';
export { INVENTORY_EVENT_NAMES } from './events/inventory-events.js';
export type { InventoryEventBus } from './events/inventory-event-bus.js';
