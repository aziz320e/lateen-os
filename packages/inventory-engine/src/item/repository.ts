/** @module item/repository */
import type { Repository } from '../shared/repository.js';
import type { BrandId, CategoryId, InventoryItemId, OrganizationId } from '../shared/identifiers.js';
import type { Brand, Category, InventoryItem, InventoryItemStatus } from './types.js';

export interface CategoryRepository extends Repository<Category, CategoryId> {
  findAll(organizationId: OrganizationId): Promise<readonly Category[]>;
}

export interface BrandRepository extends Repository<Brand, BrandId> {
  findAll(organizationId: OrganizationId): Promise<readonly Brand[]>;
}

export interface InventoryItemRepository extends Repository<InventoryItem, InventoryItemId> {
  findAll(organizationId: OrganizationId): Promise<readonly InventoryItem[]>;
  findByStatus(organizationId: OrganizationId, status: InventoryItemStatus): Promise<readonly InventoryItem[]>;
  findByCategory(organizationId: OrganizationId, categoryId: CategoryId): Promise<readonly InventoryItem[]>;
  findByBrand(organizationId: OrganizationId, brandId: BrandId): Promise<readonly InventoryItem[]>;
  findBySku(organizationId: OrganizationId, sku: string): Promise<InventoryItem | null>;
  findByBarcode(organizationId: OrganizationId, barcode: string): Promise<InventoryItem | null>;
}
