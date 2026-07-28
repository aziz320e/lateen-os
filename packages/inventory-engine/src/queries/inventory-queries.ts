/** @module queries/inventory-queries */
import type {
  FindCountsQuery,
  FindCountsResult,
  FindInventoryQuery,
  FindInventoryResult,
  FindItemsQuery,
  FindItemsResult,
  FindMovementsQuery,
  FindMovementsResult,
  FindReservationsQuery,
  FindReservationsResult,
  FindValuationsQuery,
  FindValuationsResult,
  FindWarehousesQuery,
  FindWarehousesResult,
  SearchInventoryQuery,
  SearchInventoryResult,
} from './types.js';

/** Real, read-only Inventory Engine query port. */
export interface InventoryQueries {
  findItems(query: FindItemsQuery): Promise<FindItemsResult>;
  findWarehouses(query: FindWarehousesQuery): Promise<FindWarehousesResult>;
  findInventory(query: FindInventoryQuery): Promise<FindInventoryResult>;
  findMovements(query: FindMovementsQuery): Promise<FindMovementsResult>;
  findReservations(query: FindReservationsQuery): Promise<FindReservationsResult>;
  findValuations(query: FindValuationsQuery): Promise<FindValuationsResult>;
  findCounts(query: FindCountsQuery): Promise<FindCountsResult>;
  searchInventory(query: SearchInventoryQuery): Promise<SearchInventoryResult>;
}
