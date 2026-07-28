/** @module queries/types */
import type { Brand, BrandId, Category, CategoryId, InventoryItem, InventoryItemId, InventoryItemStatus } from '../item/types.js';
import type { InventoryCount, InventoryCountId, CountStatus } from '../counting/types.js';
import type { MovementRecord, MovementRecordId, MovementType } from '../movement/types.js';
import type { StockLevel, StockLevelId } from '../stock/types.js';
import type { ValuationMethod, ValuationRecord, ValuationRecordId } from '../valuation/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { Warehouse, WarehouseId, WarehouseStatus } from '../warehouse/types.js';

export interface FindItemsQuery extends OrganizationScopedQuery {
  readonly categoryId?: CategoryId;
  readonly brandId?: BrandId;
  readonly status?: InventoryItemStatus;
}

export interface FindItemsResult {
  readonly items: readonly InventoryItem[];
  readonly total: number;
}

export interface FindWarehousesQuery extends OrganizationScopedQuery {
  readonly status?: WarehouseStatus;
}

export interface FindWarehousesResult {
  readonly warehouses: readonly Warehouse[];
  readonly total: number;
}

export interface FindInventoryQuery extends OrganizationScopedQuery {
  readonly itemId?: InventoryItemId;
  readonly warehouseId?: WarehouseId;
}

export interface FindInventoryResult {
  readonly stockLevels: readonly StockLevel[];
  readonly total: number;
}

export interface FindMovementsQuery extends OrganizationScopedQuery {
  readonly itemId?: InventoryItemId;
  readonly warehouseId?: WarehouseId;
  readonly movementType?: MovementType;
}

export interface FindMovementsResult {
  readonly movements: readonly MovementRecord[];
  readonly total: number;
}

export interface FindReservationsQuery extends OrganizationScopedQuery {
  readonly itemId?: InventoryItemId;
  readonly warehouseId?: WarehouseId;
}

/** Every stock level currently carrying a non-zero reserved quantity. */
export interface FindReservationsResult {
  readonly reservations: readonly StockLevel[];
  readonly total: number;
}

export interface FindValuationsQuery extends OrganizationScopedQuery {
  readonly itemId?: InventoryItemId;
  readonly method?: ValuationMethod;
}

export interface FindValuationsResult {
  readonly valuations: readonly ValuationRecord[];
  readonly total: number;
}

export interface FindCountsQuery extends OrganizationScopedQuery {
  readonly warehouseId?: WarehouseId;
  readonly status?: CountStatus;
}

export interface FindCountsResult {
  readonly counts: readonly InventoryCount[];
  readonly total: number;
}

export interface SearchInventoryQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchInventoryRecordType = 'item' | 'warehouse' | 'category' | 'brand';

export interface SearchInventoryMatch {
  readonly recordType: SearchInventoryRecordType;
  readonly id: InventoryItemId | WarehouseId | CategoryId | BrandId | StockLevelId | MovementRecordId | ValuationRecordId | InventoryCountId;
  readonly label: string;
  readonly score: number;
}

export interface SearchInventoryResult {
  readonly matches: readonly SearchInventoryMatch[];
  readonly total: number;
}

export type { OrganizationId, Category, Brand };
