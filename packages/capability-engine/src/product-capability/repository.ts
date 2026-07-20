/** @module product-capability/repository */
import type {
  CapabilityId,
  OrganizationId,
  ProductCapabilityId,
  ProductId,
} from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { ProductCapability, ProductCapabilityStatus } from './types.js';

export interface ProductCapabilityRepository extends Repository<
  ProductCapability,
  ProductCapabilityId
> {
  findByProduct(
    organizationId: OrganizationId,
    productId: ProductId,
  ): Promise<readonly ProductCapability[]>;
  findByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly ProductCapability[]>;
  findByProductAndCapability(
    organizationId: OrganizationId,
    productId: ProductId,
    capabilityId: CapabilityId,
  ): Promise<ProductCapability | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: ProductCapabilityStatus,
  ): Promise<readonly ProductCapability[]>;
  findRequiredByProduct(
    organizationId: OrganizationId,
    productId: ProductId,
  ): Promise<readonly ProductCapability[]>;
}
