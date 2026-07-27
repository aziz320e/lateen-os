/**
 * Real Account Management — create / update / archive / restore.
 *
 * @module account/service.impl
 */
import { AccountNotFoundError, InvalidRecordTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AccountId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag } from '../shared/primitives.js';
import type { AccountRepository } from './repository.js';
import type { Account, AccountStatus } from './types.js';

const ACCOUNT_TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  active: ['archived'],
  archived: ['active'],
};

export function canTransitionAccount(from: AccountStatus, to: AccountStatus): boolean {
  return ACCOUNT_TRANSITIONS[from].includes(to);
}

export interface CreateAccountInput {
  readonly name: string;
  readonly industry?: string;
  readonly website?: string;
  readonly tags?: readonly CrmTag[];
}

export interface UpdateAccountInput {
  readonly name?: string;
  readonly industry?: string;
  readonly website?: string;
  readonly tags?: readonly CrmTag[];
}

export interface AccountManagement {
  create(organizationId: OrganizationId, input: CreateAccountInput): Promise<Account>;
  update(organizationId: OrganizationId, accountId: AccountId, patch: UpdateAccountInput): Promise<Account>;
  archive(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  restore(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  get(organizationId: OrganizationId, accountId: AccountId): Promise<Account | null>;
}

/** Creates a real {@link AccountManagement} service backed by an {@link AccountRepository}. */
export function createAccountManagement(repository: AccountRepository, now: () => string = nowIso): AccountManagement {
  async function requireAccount(organizationId: OrganizationId, accountId: AccountId): Promise<Account> {
    const account = await repository.findById(organizationId, accountId);
    if (!account) throw new AccountNotFoundError(accountId);
    return account;
  }

  async function transition(organizationId: OrganizationId, accountId: AccountId, to: AccountStatus): Promise<Account> {
    const account = await requireAccount(organizationId, accountId);
    if (!canTransitionAccount(account.status, to)) {
      throw new InvalidRecordTransitionError('Account', accountId, account.status, to);
    }
    const updated: Account = { ...account, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const account: Account = {
        id: generateId('account'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        industry: input.industry,
        website: input.website,
        status: 'active',
        tags: input.tags ?? [],
      };
      await repository.save(account);
      return account;
    },

    async update(organizationId, accountId, patch) {
      const account = await requireAccount(organizationId, accountId);
      if (account.status !== 'active') {
        throw new InvalidRecordTransitionError('Account', accountId, account.status, 'updated');
      }
      const updated: Account = {
        ...account,
        name: patch.name ?? account.name,
        industry: patch.industry ?? account.industry,
        website: patch.website ?? account.website,
        tags: patch.tags ?? account.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, accountId) {
      return transition(organizationId, accountId, 'archived');
    },

    async restore(organizationId, accountId) {
      return transition(organizationId, accountId, 'active');
    },

    async get(organizationId, accountId) {
      return repository.findById(organizationId, accountId);
    },
  };
}
