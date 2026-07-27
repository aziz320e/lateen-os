/** @module customer/repository */
import type { Repository } from '../shared/repository.js';
import type { CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { Email, Phone } from '../shared/primitives.js';
import type { Customer, CustomerStatus } from './types.js';

export interface CustomerRepository extends Repository<Customer, CustomerId> {
  findAll(organizationId: OrganizationId): Promise<readonly Customer[]>;
  findByStatus(organizationId: OrganizationId, status: CustomerStatus): Promise<readonly Customer[]>;
  findByEmail(organizationId: OrganizationId, email: Email): Promise<Customer | null>;
  findByPhone(organizationId: OrganizationId, phone: Phone): Promise<Customer | null>;
}
