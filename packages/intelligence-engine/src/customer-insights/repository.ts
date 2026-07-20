/** @module customer-insights/repository */
import type { CustomerId, CustomerInsightId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { CustomerInsight } from './types.js';

export interface CustomerInsightRepository extends Repository<CustomerInsight, CustomerInsightId> {
  findByCustomer(
    organizationId: OrganizationId,
    customerId: CustomerId,
  ): Promise<readonly CustomerInsight[]>;
}
