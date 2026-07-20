/** @module product-discovery/repository */
import type { OrganizationId, ProductOpportunityId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { ProductOpportunity, ProductOpportunityStatus } from './types.js';

export interface ProductOpportunityRepository extends Repository<
  ProductOpportunity,
  ProductOpportunityId
> {
  findByStatus(
    organizationId: OrganizationId,
    status: ProductOpportunityStatus,
  ): Promise<readonly ProductOpportunity[]>;
}
