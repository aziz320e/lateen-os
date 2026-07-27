/** @module opportunity/repository */
import type { Repository } from '../shared/repository.js';
import type { AccountId, CustomerId, OpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { DealStage, Opportunity } from './types.js';

export interface OpportunityRepository extends Repository<Opportunity, OpportunityId> {
  findAll(organizationId: OrganizationId): Promise<readonly Opportunity[]>;
  findByStage(organizationId: OrganizationId, stage: DealStage): Promise<readonly Opportunity[]>;
  findByAccount(organizationId: OrganizationId, accountId: AccountId): Promise<readonly Opportunity[]>;
  findByCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<readonly Opportunity[]>;
}
