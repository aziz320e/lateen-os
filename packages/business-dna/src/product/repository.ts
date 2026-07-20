/** @module product/repository */
import type { OrganizationId, ProductId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Product, ProductCategory, ProductStatus } from './types.js';

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
}
