/**
 * Real {@link InventoryQueries} implementation — a CQRS read layer
 * composed over the Inventory Engine repositories. Repositories are
 * taken as constructor dependencies but never returned to callers.
 *
 * @module queries/inventory-queries.impl
 */
import { compareAmounts } from '../shared/decimal.js';
import type { InventoryCountRepository } from '../counting/repository.js';
import type { BrandRepository, CategoryRepository, InventoryItemRepository } from '../item/repository.js';
import type { MovementRecordRepository } from '../movement/repository.js';
import type { StockLevelRepository } from '../stock/repository.js';
import type { ValuationRecordRepository } from '../valuation/repository.js';
import type { WarehouseRepository } from '../warehouse/repository.js';
import type { InventoryQueries } from './inventory-queries.js';
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
  SearchInventoryMatch,
  SearchInventoryQuery,
  SearchInventoryResult,
} from './types.js';

export interface InventoryQueriesDeps {
  readonly itemRepository: InventoryItemRepository;
  readonly categoryRepository: CategoryRepository;
  readonly brandRepository: BrandRepository;
  readonly warehouseRepository: WarehouseRepository;
  readonly stockLevelRepository: StockLevelRepository;
  readonly movementRepository: MovementRecordRepository;
  readonly valuationRecordRepository: ValuationRecordRepository;
  readonly countRepository: InventoryCountRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link InventoryQueries} read port over the given repositories. */
export function createInventoryQueries(deps: InventoryQueriesDeps): InventoryQueries {
  return {
    async findItems(query: FindItemsQuery): Promise<FindItemsResult> {
      let items = query.categoryId
        ? await deps.itemRepository.findByCategory(query.organizationId, query.categoryId)
        : query.brandId
          ? await deps.itemRepository.findByBrand(query.organizationId, query.brandId)
          : await deps.itemRepository.findAll(query.organizationId);
      if (query.status) items = items.filter((item) => item.status === query.status);
      return { items: paginate(items, query.offset, query.limit), total: items.length };
    },

    async findWarehouses(query: FindWarehousesQuery): Promise<FindWarehousesResult> {
      let warehouses = await deps.warehouseRepository.findAll(query.organizationId);
      if (query.status) warehouses = warehouses.filter((warehouse) => warehouse.status === query.status);
      return { warehouses: paginate(warehouses, query.offset, query.limit), total: warehouses.length };
    },

    async findInventory(query: FindInventoryQuery): Promise<FindInventoryResult> {
      let stockLevels = query.itemId
        ? await deps.stockLevelRepository.findByItem(query.organizationId, query.itemId)
        : query.warehouseId
          ? await deps.stockLevelRepository.findByWarehouse(query.organizationId, query.warehouseId)
          : await deps.stockLevelRepository.findAll(query.organizationId);
      if (query.itemId && query.warehouseId) {
        stockLevels = stockLevels.filter((level) => level.itemId === query.itemId && level.warehouseId === query.warehouseId);
      }
      return { stockLevels: paginate(stockLevels, query.offset, query.limit), total: stockLevels.length };
    },

    async findMovements(query: FindMovementsQuery): Promise<FindMovementsResult> {
      let movements = query.itemId
        ? await deps.movementRepository.findByItem(query.organizationId, query.itemId)
        : query.warehouseId
          ? await deps.movementRepository.findByWarehouse(query.organizationId, query.warehouseId)
          : await deps.movementRepository.findAll(query.organizationId);
      if (query.movementType) movements = movements.filter((movement) => movement.movementType === query.movementType);
      return { movements: paginate(movements, query.offset, query.limit), total: movements.length };
    },

    async findReservations(query: FindReservationsQuery): Promise<FindReservationsResult> {
      let stockLevels = query.itemId
        ? await deps.stockLevelRepository.findByItem(query.organizationId, query.itemId)
        : query.warehouseId
          ? await deps.stockLevelRepository.findByWarehouse(query.organizationId, query.warehouseId)
          : await deps.stockLevelRepository.findAll(query.organizationId);
      stockLevels = stockLevels.filter((level) => compareAmounts(level.reservedQuantity, '0') > 0);
      return { reservations: paginate(stockLevels, query.offset, query.limit), total: stockLevels.length };
    },

    async findValuations(query: FindValuationsQuery): Promise<FindValuationsResult> {
      let valuations = query.itemId
        ? await deps.valuationRecordRepository.findByItem(query.organizationId, query.itemId)
        : await deps.valuationRecordRepository.findAll(query.organizationId);
      if (query.method) valuations = valuations.filter((valuation) => valuation.method === query.method);
      return { valuations: paginate(valuations, query.offset, query.limit), total: valuations.length };
    },

    async findCounts(query: FindCountsQuery): Promise<FindCountsResult> {
      let counts = query.warehouseId
        ? await deps.countRepository.findByWarehouse(query.organizationId, query.warehouseId)
        : await deps.countRepository.findAll(query.organizationId);
      if (query.status) counts = counts.filter((count) => count.status === query.status);
      return { counts: paginate(counts, query.offset, query.limit), total: counts.length };
    },

    async searchInventory(query: SearchInventoryQuery): Promise<SearchInventoryResult> {
      const [items, warehouses, categories, brands] = await Promise.all([
        deps.itemRepository.findAll(query.organizationId),
        deps.warehouseRepository.findAll(query.organizationId),
        deps.categoryRepository.findAll(query.organizationId),
        deps.brandRepository.findAll(query.organizationId),
      ]);

      const matches: SearchInventoryMatch[] = [];
      for (const item of items) {
        const score = Math.max(scoreLabel(item.name, query.keyword), scoreLabel(item.sku, query.keyword));
        if (score > 0) matches.push({ recordType: 'item', id: item.id, label: item.name, score });
      }
      for (const warehouse of warehouses) {
        const score = scoreLabel(warehouse.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'warehouse', id: warehouse.id, label: warehouse.name, score });
      }
      for (const category of categories) {
        const score = scoreLabel(category.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'category', id: category.id, label: category.name, score });
      }
      for (const brand of brands) {
        const score = scoreLabel(brand.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'brand', id: brand.id, label: brand.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
