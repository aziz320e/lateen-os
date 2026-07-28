/** @module expansion/repository */
import type { Repository } from '../shared/repository.js';
import type { ExpansionOpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { ExpansionOpportunity, ExpansionOpportunityStatus, ExpansionOpportunityType } from './types.js';

export interface ExpansionOpportunityRepository extends Repository<ExpansionOpportunity, ExpansionOpportunityId> {
  findAll(organizationId: OrganizationId): Promise<readonly ExpansionOpportunity[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly ExpansionOpportunity[]>;
  findByType(organizationId: OrganizationId, opportunityType: ExpansionOpportunityType): Promise<readonly ExpansionOpportunity[]>;
  findByStatus(organizationId: OrganizationId, status: ExpansionOpportunityStatus): Promise<readonly ExpansionOpportunity[]>;
}
