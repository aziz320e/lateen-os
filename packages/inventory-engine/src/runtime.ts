/**
 * Inventory Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Inventory
 * Catalog (items, categories, brands), Warehouse Management
 * (warehouses, zones, storage locations, bins), Inventory Stock,
 * Inventory Movements (composed with Inventory Stock), Stock
 * Valuation (FIFO/Weighted Average), Inventory Counting (composed
 * with Inventory Stock and Inventory Movements), Procurement
 * Preparation (composed with Inventory Stock), the Relationship Layer
 * (the only integration point with Finance Engine, Sales Engine,
 * Business DNA, Workflow Engine, Communication Hub, Analytics Engine,
 * and Institutional Memory), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link InventoryRuntime} surface.
 *
 * @module runtime
 */
import { createInventoryCountingEngine, createInventoryCountRepository, type InventoryCountingEngine } from './counting/index.js';
import { createInventoryEventBus, type InventoryEventBus } from './events/index.js';
import {
  createBrandRepository,
  createCategoryRepository,
  createInventoryCatalogEngine,
  createInventoryItemRepository,
  type InventoryCatalogEngine,
} from './item/index.js';
import { createInventoryMovementEngine, createMovementRecordRepository, type InventoryMovementEngine } from './movement/index.js';
import { createProcurementPreparationEngine, createPurchaseRequestRepository, type ProcurementPreparationEngine } from './procurement/index.js';
import { createInventoryQueries, type InventoryQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';
import { createInventoryStockEngine, createStockLevelRepository, type InventoryStockEngine } from './stock/index.js';
import {
  createCostLayerRepository,
  createStockValuationEngine,
  createValuationRecordRepository,
  createWeightedAverageCostRepository,
  type StockValuationEngine,
} from './valuation/index.js';
import {
  createBinRepository,
  createStorageLocationRepository,
  createWarehouseManagementEngine,
  createWarehouseRepository,
  createZoneRepository,
  type WarehouseManagementEngine,
} from './warehouse/index.js';

export interface InventoryRuntimeDeps {
  readonly eventBus?: InventoryEventBus;
  readonly now?: () => string;
  readonly finance?: RelationshipManagementDeps['finance'];
  readonly sales?: RelationshipManagementDeps['sales'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface InventoryRuntime {
  readonly catalog: InventoryCatalogEngine;
  readonly warehouses: WarehouseManagementEngine;
  readonly stock: InventoryStockEngine;
  readonly movements: InventoryMovementEngine;
  readonly valuation: StockValuationEngine;
  readonly counting: InventoryCountingEngine;
  readonly procurement: ProcurementPreparationEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: InventoryQueries;
  /** Typed event bus — subscribe to item/movement/count/shortage/reorder events. */
  readonly events: InventoryEventBus;
}

/** Creates a real, in-memory {@link InventoryRuntime}. */
export function createInventoryRuntime(deps: InventoryRuntimeDeps = {}): InventoryRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createInventoryEventBus();

  const itemRepository = createInventoryItemRepository();
  const categoryRepository = createCategoryRepository();
  const brandRepository = createBrandRepository();

  const warehouseRepository = createWarehouseRepository();
  const zoneRepository = createZoneRepository();
  const locationRepository = createStorageLocationRepository();
  const binRepository = createBinRepository();

  const stockLevelRepository = createStockLevelRepository();
  const movementRepository = createMovementRecordRepository();

  const costLayerRepository = createCostLayerRepository();
  const weightedAverageRepository = createWeightedAverageCostRepository();
  const valuationRecordRepository = createValuationRecordRepository();

  const countRepository = createInventoryCountRepository();
  const purchaseRequestRepository = createPurchaseRequestRepository();

  const catalog = createInventoryCatalogEngine(itemRepository, categoryRepository, brandRepository, eventBus, now);
  const warehouses = createWarehouseManagementEngine(warehouseRepository, zoneRepository, locationRepository, binRepository, now);
  const stock = createInventoryStockEngine(stockLevelRepository, now);
  const movements = createInventoryMovementEngine(movementRepository, stock, eventBus, now);
  const valuation = createStockValuationEngine(costLayerRepository, weightedAverageRepository, valuationRecordRepository, now);
  const counting = createInventoryCountingEngine(countRepository, stock, movements, eventBus, now);
  const procurement = createProcurementPreparationEngine(stock, purchaseRequestRepository, eventBus, now);

  const relationships = createRelationshipManagement({
    finance: deps.finance,
    sales: deps.sales,
    businessDna: deps.businessDna,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    analytics: deps.analytics,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createInventoryQueries({
    itemRepository,
    categoryRepository,
    brandRepository,
    warehouseRepository,
    stockLevelRepository,
    movementRepository,
    valuationRecordRepository,
    countRepository,
  });

  return {
    catalog,
    warehouses,
    stock,
    movements,
    valuation,
    counting,
    procurement,
    relationships,
    queries,
    events: eventBus,
  };
}
