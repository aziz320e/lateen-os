/** @module contact/repository */
import type { Repository } from '../shared/repository.js';
import type { AccountId, ContactId, CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { Email } from '../shared/primitives.js';
import type { Contact, ContactStatus } from './types.js';

export interface ContactRepository extends Repository<Contact, ContactId> {
  findAll(organizationId: OrganizationId): Promise<readonly Contact[]>;
  findByStatus(organizationId: OrganizationId, status: ContactStatus): Promise<readonly Contact[]>;
  findByEmail(organizationId: OrganizationId, email: Email): Promise<Contact | null>;
  findByCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<readonly Contact[]>;
  findByAccount(organizationId: OrganizationId, accountId: AccountId): Promise<readonly Contact[]>;
}
