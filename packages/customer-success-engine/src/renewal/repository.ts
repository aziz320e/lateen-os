/** @module renewal/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, RenewalId } from '../shared/identifiers.js';
import type { Renewal, RenewalStatus } from './types.js';

export interface RenewalRepository extends Repository<Renewal, RenewalId> {
  findAll(organizationId: OrganizationId): Promise<readonly Renewal[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly Renewal[]>;
  findByStatus(organizationId: OrganizationId, status: RenewalStatus): Promise<readonly Renewal[]>;
}
