/** @module product/repository */
import type { OrganizationId, ProductBundleId, ProductId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Product, ProductBundle, ProductCategory, ProductStatus } from './types.js';

export interface ProductRepository extends Repository<Product, ProductId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Product | null>;
  findByCategory(
    organizationId: OrganizationId,
    category: ProductCategory,
  ): Promise<readonly Product[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: ProductStatus,
  ): Promise<readonly Product[]>;
  findAll(organizationId: OrganizationId): Promise<readonly Product[]>;
}

export interface ProductBundleRepository extends Repository<ProductBundle, ProductBundleId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<ProductBundle | null>;
  findAll(organizationId: OrganizationId): Promise<readonly ProductBundle[]>;
}
