/** @module product-capability/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  OrganizationId,
  ProductCapabilityId,
  ProductId,
} from '../shared/identifiers.js';

export type { ProductCapabilityId };

export type ProductCapabilityStatus = 'active' | 'inactive' | 'archived';

/**
 * Links a Business DNA Product to a Capability it requires for production.
 * A product may require one or more capabilities.
 */
export interface ProductCapability extends TenantAuditableEntity<ProductCapabilityId> {
  readonly productId: ProductId;
  readonly capabilityId: CapabilityId;
  readonly status: ProductCapabilityStatus;
  readonly required: boolean;
  readonly sequence?: number;
  readonly notes?: string;
}

export type { OrganizationId, ProductId, CapabilityId };
