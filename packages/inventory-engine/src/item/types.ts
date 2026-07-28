/** @module item/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { BrandId, CategoryId, InventoryItemId, ProductId } from '../shared/identifiers.js';
import type { UnitOfMeasure } from '../shared/primitives.js';

export type { BrandId, CategoryId, InventoryItemId };

export type CategoryStatus = 'active' | 'archived';

/** A simple, named grouping lookup for inventory items. */
export interface Category extends TenantAuditableEntity<CategoryId> {
  readonly name: string;
  readonly parentCategoryId?: CategoryId;
  readonly status: CategoryStatus;
}

export type BrandStatus = 'active' | 'archived';

/** A simple, named brand lookup for inventory items. */
export interface Brand extends TenantAuditableEntity<BrandId> {
  readonly name: string;
  readonly status: BrandStatus;
}

export type InventoryItemStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** A single catalog entry — the real, authoritative HR-analog for physical/trackable inventory. */
export interface InventoryItem extends TenantAuditableEntity<InventoryItemId> {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly barcode?: string;
  readonly serialNumber?: string;
  readonly batchNumber?: string;
  readonly unitOfMeasure: UnitOfMeasure;
  readonly categoryId?: CategoryId;
  readonly brandId?: BrandId;
  /** Optional link to a real Business DNA catalog product. */
  readonly externalProductId?: ProductId;
  readonly status: InventoryItemStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: InventoryItemStatus;
  readonly currentVersion: number;
}
