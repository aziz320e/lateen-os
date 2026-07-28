/** Real, in-memory Inventory Catalog repositories. @module item/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BrandRepository, CategoryRepository, InventoryItemRepository } from './repository.js';
import type { Brand, Category, InventoryItem } from './types.js';

/** Creates a real, in-memory {@link CategoryRepository}. */
export function createCategoryRepository(seed?: readonly Category[]): CategoryRepository {
  const repo = createInMemoryRepository<Category>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link BrandRepository}. */
export function createBrandRepository(seed?: readonly Brand[]): BrandRepository {
  const repo = createInMemoryRepository<Brand>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link InventoryItemRepository}. */
export function createInventoryItemRepository(seed?: readonly InventoryItem[]): InventoryItemRepository {
  const repo = createInMemoryRepository<InventoryItem>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((item) => item.status === status);
    },
    async findByCategory(organizationId, categoryId) {
      return repo.list(organizationId).filter((item) => item.categoryId === categoryId);
    },
    async findByBrand(organizationId, brandId) {
      return repo.list(organizationId).filter((item) => item.brandId === brandId);
    },
    async findBySku(organizationId, sku) {
      return repo.list(organizationId).find((item) => item.sku === sku) ?? null;
    },
    async findByBarcode(organizationId, barcode) {
      return repo.list(organizationId).find((item) => item.barcode === barcode) ?? null;
    },
  };
}
