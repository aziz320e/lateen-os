/**
 * Real Inventory Catalog engine — inventory items (SKU, barcode,
 * serial number, batch number, unit of measure, categories, brands)
 * with a guarded create/update/activate/deactivate/archive/restore
 * lifecycle, plus simple category/brand lookups.
 *
 * @module item/engine.impl
 */
import type { InventoryEventBus } from '../events/inventory-event-bus.js';
import {
  BrandNotFoundError,
  CategoryNotFoundError,
  DuplicateSkuError,
  InvalidItemTransitionError,
  InventoryItemNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { BrandId, CategoryId, InventoryItemId, OrganizationId, ProductId } from '../shared/identifiers.js';
import type { UnitOfMeasure } from '../shared/primitives.js';
import type { BrandRepository, CategoryRepository, InventoryItemRepository } from './repository.js';
import type { Brand, Category, InventoryItem, InventoryItemStatus } from './types.js';

const ITEM_TRANSITIONS: Readonly<Record<InventoryItemStatus, readonly InventoryItemStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns an item to its pre-archive status.
  archived: [],
};

/** Whether an inventory item may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionItem(from: InventoryItemStatus, to: InventoryItemStatus): boolean {
  return ITEM_TRANSITIONS[from].includes(to);
}

export interface CreateInventoryItemInput {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly barcode?: string;
  readonly serialNumber?: string;
  readonly batchNumber?: string;
  readonly unitOfMeasure: UnitOfMeasure;
  readonly categoryId?: CategoryId;
  readonly brandId?: BrandId;
  readonly externalProductId?: ProductId;
}

export interface UpdateInventoryItemInput {
  readonly name?: string;
  readonly description?: string;
  readonly barcode?: string;
  readonly serialNumber?: string;
  readonly batchNumber?: string;
  readonly categoryId?: CategoryId;
  readonly brandId?: BrandId;
}

export interface CreateCategoryInput {
  readonly name: string;
  readonly parentCategoryId?: CategoryId;
}

export interface CreateBrandInput {
  readonly name: string;
}

export interface InventoryCatalogEngine {
  create(organizationId: OrganizationId, input: CreateInventoryItemInput): Promise<InventoryItem>;
  update(organizationId: OrganizationId, itemId: InventoryItemId, input: UpdateInventoryItemInput): Promise<InventoryItem>;
  activate(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem>;
  deactivate(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem>;
  archive(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem>;
  restore(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem>;
  get(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem | null>;
  list(organizationId: OrganizationId): Promise<readonly InventoryItem[]>;
  findByCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<readonly InventoryItem[]>;
  findByBrand(organizationId: OrganizationId, brandId: BrandId): Promise<readonly InventoryItem[]>;
  findBySku(organizationId: OrganizationId, sku: string): Promise<InventoryItem | null>;
  findByBarcode(organizationId: OrganizationId, barcode: string): Promise<InventoryItem | null>;

  createCategory(organizationId: OrganizationId, input: CreateCategoryInput): Promise<Category>;
  archiveCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<Category>;
  restoreCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<Category>;
  getCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<Category | null>;
  listCategories(organizationId: OrganizationId): Promise<readonly Category[]>;

  createBrand(organizationId: OrganizationId, input: CreateBrandInput): Promise<Brand>;
  archiveBrand(organizationId: OrganizationId, brandId: BrandId): Promise<Brand>;
  restoreBrand(organizationId: OrganizationId, brandId: BrandId): Promise<Brand>;
  getBrand(organizationId: OrganizationId, brandId: BrandId): Promise<Brand | null>;
  listBrands(organizationId: OrganizationId): Promise<readonly Brand[]>;
}

/** Creates a real {@link InventoryCatalogEngine}. */
export function createInventoryCatalogEngine(
  itemRepository: InventoryItemRepository,
  categoryRepository: CategoryRepository,
  brandRepository: BrandRepository,
  eventBus?: InventoryEventBus,
  now: () => string = nowIso,
): InventoryCatalogEngine {
  async function requireItem(organizationId: OrganizationId, itemId: InventoryItemId): Promise<InventoryItem> {
    const item = await itemRepository.findById(organizationId, itemId);
    if (!item) throw new InventoryItemNotFoundError(itemId);
    return item;
  }

  async function transition(organizationId: OrganizationId, itemId: InventoryItemId, to: InventoryItemStatus): Promise<InventoryItem> {
    const item = await requireItem(organizationId, itemId);
    if (!canTransitionItem(item.status, to)) {
      throw new InvalidItemTransitionError(itemId, item.status, to);
    }
    const updated: InventoryItem = {
      ...item,
      status: to,
      statusBeforeArchive: to === 'archived' ? item.status : item.statusBeforeArchive,
      currentVersion: item.currentVersion + 1,
      updatedAt: now(),
    };
    await itemRepository.save(updated);
    return updated;
  }

  async function requireCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<Category> {
    const category = await categoryRepository.findById(organizationId, categoryId);
    if (!category) throw new CategoryNotFoundError(categoryId);
    return category;
  }

  async function requireBrand(organizationId: OrganizationId, brandId: BrandId): Promise<Brand> {
    const brand = await brandRepository.findById(organizationId, brandId);
    if (!brand) throw new BrandNotFoundError(brandId);
    return brand;
  }

  return {
    async create(organizationId, input) {
      const existing = await itemRepository.findBySku(organizationId, input.sku);
      if (existing) throw new DuplicateSkuError(input.sku);

      const timestamp = now();
      const item: InventoryItem = {
        id: generateId('inventory-item'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        sku: input.sku,
        name: input.name,
        description: input.description,
        barcode: input.barcode,
        serialNumber: input.serialNumber,
        batchNumber: input.batchNumber,
        unitOfMeasure: input.unitOfMeasure,
        categoryId: input.categoryId,
        brandId: input.brandId,
        externalProductId: input.externalProductId,
        status: 'draft',
        currentVersion: 1,
      };
      await itemRepository.save(item);
      eventBus?.publish('inventory.item.created', { organizationId, itemId: item.id, sku: item.sku });
      return item;
    },

    async update(organizationId, itemId, input) {
      const item = await requireItem(organizationId, itemId);
      if (item.status === 'archived') {
        throw new InvalidItemTransitionError(itemId, item.status, item.status);
      }
      const updated: InventoryItem = {
        ...item,
        name: input.name ?? item.name,
        description: input.description ?? item.description,
        barcode: input.barcode ?? item.barcode,
        serialNumber: input.serialNumber ?? item.serialNumber,
        batchNumber: input.batchNumber ?? item.batchNumber,
        categoryId: input.categoryId ?? item.categoryId,
        brandId: input.brandId ?? item.brandId,
        currentVersion: item.currentVersion + 1,
        updatedAt: now(),
      };
      await itemRepository.save(updated);
      return updated;
    },

    async activate(organizationId, itemId) {
      return transition(organizationId, itemId, 'active');
    },

    async deactivate(organizationId, itemId) {
      return transition(organizationId, itemId, 'inactive');
    },

    async archive(organizationId, itemId) {
      return transition(organizationId, itemId, 'archived');
    },

    async restore(organizationId, itemId) {
      const item = await requireItem(organizationId, itemId);
      if (item.status !== 'archived') {
        throw new InvalidItemTransitionError(itemId, item.status, item.statusBeforeArchive ?? 'draft');
      }
      const to = item.statusBeforeArchive ?? 'draft';
      const updated: InventoryItem = { ...item, status: to, currentVersion: item.currentVersion + 1, updatedAt: now() };
      await itemRepository.save(updated);
      return updated;
    },

    async get(organizationId, itemId) {
      return itemRepository.findById(organizationId, itemId);
    },

    async list(organizationId) {
      return itemRepository.findAll(organizationId);
    },

    async findByCategory(organizationId, categoryId) {
      return itemRepository.findByCategory(organizationId, categoryId);
    },

    async findByBrand(organizationId, brandId) {
      return itemRepository.findByBrand(organizationId, brandId);
    },

    async findBySku(organizationId, sku) {
      return itemRepository.findBySku(organizationId, sku);
    },

    async findByBarcode(organizationId, barcode) {
      return itemRepository.findByBarcode(organizationId, barcode);
    },

    async createCategory(organizationId, input) {
      const timestamp = now();
      const category: Category = {
        id: generateId('category'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        parentCategoryId: input.parentCategoryId,
        status: 'active',
      };
      await categoryRepository.save(category);
      return category;
    },

    async archiveCategory(organizationId, categoryId) {
      const category = await requireCategory(organizationId, categoryId);
      const updated: Category = { ...category, status: 'archived', updatedAt: now() };
      await categoryRepository.save(updated);
      return updated;
    },

    async restoreCategory(organizationId, categoryId) {
      const category = await requireCategory(organizationId, categoryId);
      const updated: Category = { ...category, status: 'active', updatedAt: now() };
      await categoryRepository.save(updated);
      return updated;
    },

    async getCategory(organizationId, categoryId) {
      return categoryRepository.findById(organizationId, categoryId);
    },

    async listCategories(organizationId) {
      return categoryRepository.findAll(organizationId);
    },

    async createBrand(organizationId, input) {
      const timestamp = now();
      const brand: Brand = {
        id: generateId('brand'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        status: 'active',
      };
      await brandRepository.save(brand);
      return brand;
    },

    async archiveBrand(organizationId, brandId) {
      const brand = await requireBrand(organizationId, brandId);
      const updated: Brand = { ...brand, status: 'archived', updatedAt: now() };
      await brandRepository.save(updated);
      return updated;
    },

    async restoreBrand(organizationId, brandId) {
      const brand = await requireBrand(organizationId, brandId);
      const updated: Brand = { ...brand, status: 'active', updatedAt: now() };
      await brandRepository.save(updated);
      return updated;
    },

    async getBrand(organizationId, brandId) {
      return brandRepository.findById(organizationId, brandId);
    },

    async listBrands(organizationId) {
      return brandRepository.findAll(organizationId);
    },
  };
}
