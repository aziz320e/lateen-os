/** @module account/repository */
import type { Repository } from '../shared/repository.js';
import type { AccountId, OrganizationId } from '../shared/identifiers.js';
import type { Account, AccountStatus } from './types.js';

export interface AccountRepository extends Repository<Account, AccountId> {
  findAll(organizationId: OrganizationId): Promise<readonly Account[]>;
  findByStatus(organizationId: OrganizationId, status: AccountStatus): Promise<readonly Account[]>;
  findByName(organizationId: OrganizationId, name: string): Promise<Account | null>;
}
