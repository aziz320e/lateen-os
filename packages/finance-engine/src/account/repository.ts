/** @module account/repository */
import type { Repository } from '../shared/repository.js';
import type { AccountId, OrganizationId } from '../shared/identifiers.js';
import type { Account, AccountStatus, AccountType } from './types.js';

export interface AccountRepository extends Repository<Account, AccountId> {
  findAll(organizationId: OrganizationId): Promise<readonly Account[]>;
  findByType(organizationId: OrganizationId, accountType: AccountType): Promise<readonly Account[]>;
  findByStatus(organizationId: OrganizationId, status: AccountStatus): Promise<readonly Account[]>;
  findByParent(organizationId: OrganizationId, parentAccountId: AccountId): Promise<readonly Account[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Account | null>;
}
