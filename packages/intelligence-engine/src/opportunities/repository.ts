/** @module opportunities/repository */
import type { BusinessOpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessOpportunity, BusinessOpportunityStatus, OpportunityCategory } from './types.js';

export interface BusinessOpportunityRepository extends Repository<
  BusinessOpportunity,
  BusinessOpportunityId
> {
  findByCategory(
    organizationId: OrganizationId,
    category: OpportunityCategory,
  ): Promise<readonly BusinessOpportunity[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: BusinessOpportunityStatus,
  ): Promise<readonly BusinessOpportunity[]>;
}
