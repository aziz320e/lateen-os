/** @module opportunity/repository */
import type { Repository } from '../shared/repository.js';
import type { CustomerId, OrganizationId, SalesOpportunityId } from '../shared/identifiers.js';
import type { SalesOpportunity, SalesOpportunityStatus, SalesPipelineStage } from './types.js';

export interface SalesOpportunityRepository extends Repository<SalesOpportunity, SalesOpportunityId> {
  findAll(organizationId: OrganizationId): Promise<readonly SalesOpportunity[]>;
  findByStage(organizationId: OrganizationId, stage: SalesPipelineStage): Promise<readonly SalesOpportunity[]>;
  findByStatus(organizationId: OrganizationId, status: SalesOpportunityStatus): Promise<readonly SalesOpportunity[]>;
  findByCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<readonly SalesOpportunity[]>;
}
