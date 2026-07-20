/** @module customer/repository */
import type { CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Customer, CustomerSegment, CustomerStatus } from './types.js';

export interface CustomerRepository extends Repository<Customer, CustomerId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Customer | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: CustomerStatus,
  ): Promise<readonly Customer[]>;
  findBySegment(
    organizationId: OrganizationId,
    segment: CustomerSegment,
  ): Promise<readonly Customer[]>;
}
