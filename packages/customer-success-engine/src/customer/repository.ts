/** @module customer/repository */
import type { Repository } from '../shared/repository.js';
import type { CustomerSuccessRecordId, OrganizationId } from '../shared/identifiers.js';
import type { CustomerSuccessRecord, CustomerSuccessStatus } from './types.js';

export interface CustomerSuccessRecordRepository extends Repository<CustomerSuccessRecord, CustomerSuccessRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly CustomerSuccessRecord[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<CustomerSuccessRecord | null>;
  findByStatus(organizationId: OrganizationId, status: CustomerSuccessStatus): Promise<readonly CustomerSuccessRecord[]>;
}
