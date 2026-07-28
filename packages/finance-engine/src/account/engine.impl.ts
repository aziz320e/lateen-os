/**
 * Real Chart of Accounts engine — create/update/activate/deactivate/
 * archive/restore lifecycle plus hierarchy traversal across the five
 * account types (`asset`, `liability`, `equity`, `revenue`, `expense`).
 *
 * @module account/engine.impl
 */
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { AccountNotFoundError, InvalidAccountTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AccountId, OrganizationId } from '../shared/identifiers.js';
import type { AccountRepository } from './repository.js';
import type { Account, AccountStatus, AccountType, NormalBalance } from './types.js';

const ACCOUNT_TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns an account to its pre-archive status
  // without going through this table.
  archived: [],
};

/** Whether an account may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionAccount(from: AccountStatus, to: AccountStatus): boolean {
  return ACCOUNT_TRANSITIONS[from].includes(to);
}

/** Pure: the side of a journal line that increases this account type's balance — assets/expenses are debit-normal, liabilities/equity/revenue are credit-normal. */
export function normalBalanceForAccountType(accountType: AccountType): NormalBalance {
  return accountType === 'asset' || accountType === 'expense' ? 'debit' : 'credit';
}

export interface CreateAccountInput {
  readonly code: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly parentAccountId?: AccountId;
  readonly description?: string;
}

export interface UpdateAccountInput {
  readonly name?: string;
  readonly description?: string;
  readonly parentAccountId?: AccountId;
}

export interface ChartOfAccountsEngine {
  create(organizationId: OrganizationId, input: CreateAccountInput): Promise<Account>;
  update(organizationId: OrganizationId, accountId: AccountId, input: UpdateAccountInput): Promise<Account>;
  activate(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  deactivate(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  archive(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  restore(organizationId: OrganizationId, accountId: AccountId): Promise<Account>;
  get(organizationId: OrganizationId, accountId: AccountId): Promise<Account | null>;
  list(organizationId: OrganizationId): Promise<readonly Account[]>;
  /** Direct children of `accountId` in the account hierarchy. */
  getChildren(organizationId: OrganizationId, accountId: AccountId): Promise<readonly Account[]>;
  /** Every descendant of `accountId`, at any depth. */
  getDescendants(organizationId: OrganizationId, accountId: AccountId): Promise<readonly Account[]>;
  /** The chain of ancestors from `accountId`'s immediate parent up to the root, root last... actually root first. */
  getAncestors(organizationId: OrganizationId, accountId: AccountId): Promise<readonly Account[]>;
}

/** Creates a real {@link ChartOfAccountsEngine} backed by an {@link AccountRepository}. */
export function createChartOfAccountsEngine(
  repository: AccountRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): ChartOfAccountsEngine {
  async function requireAccount(organizationId: OrganizationId, accountId: AccountId): Promise<Account> {
    const account = await repository.findById(organizationId, accountId);
    if (!account) throw new AccountNotFoundError(accountId);
    return account;
  }

  async function transition(organizationId: OrganizationId, accountId: AccountId, to: AccountStatus): Promise<Account> {
    const account = await requireAccount(organizationId, accountId);
    if (!canTransitionAccount(account.status, to)) {
      throw new InvalidAccountTransitionError(accountId, account.status, to);
    }
    const updated: Account = {
      ...account,
      status: to,
      statusBeforeArchive: to === 'archived' ? account.status : account.statusBeforeArchive,
      currentVersion: account.currentVersion + 1,
      updatedAt: now(),
    };
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
        code: input.code,
        name: input.name,
        accountType: input.accountType,
        normalBalance: normalBalanceForAccountType(input.accountType),
        parentAccountId: input.parentAccountId,
        description: input.description,
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(account);
      eventBus?.publish('account.created', { organizationId, accountId: account.id, accountType: account.accountType });
      return account;
    },

    async update(organizationId, accountId, input) {
      const account = await requireAccount(organizationId, accountId);
      if (account.status === 'archived') {
        throw new InvalidAccountTransitionError(accountId, account.status, account.status);
      }
      const updated: Account = {
        ...account,
        name: input.name ?? account.name,
        description: input.description ?? account.description,
        parentAccountId: input.parentAccountId ?? account.parentAccountId,
        currentVersion: account.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async activate(organizationId, accountId) {
      return transition(organizationId, accountId, 'active');
    },

    async deactivate(organizationId, accountId) {
      return transition(organizationId, accountId, 'inactive');
    },

    async archive(organizationId, accountId) {
      return transition(organizationId, accountId, 'archived');
    },

    async restore(organizationId, accountId) {
      const account = await requireAccount(organizationId, accountId);
      if (account.status !== 'archived') {
        throw new InvalidAccountTransitionError(accountId, account.status, account.statusBeforeArchive ?? 'draft');
      }
      const to = account.statusBeforeArchive ?? 'draft';
      const updated: Account = { ...account, status: to, currentVersion: account.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, accountId) {
      return repository.findById(organizationId, accountId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async getChildren(organizationId, accountId) {
      return repository.findByParent(organizationId, accountId);
    },

    async getDescendants(organizationId, accountId) {
      const descendants: Account[] = [];
      const queue = [...(await repository.findByParent(organizationId, accountId))];
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) continue;
        descendants.push(next);
        queue.push(...(await repository.findByParent(organizationId, next.id)));
      }
      return descendants;
    },

    async getAncestors(organizationId, accountId) {
      const ancestors: Account[] = [];
      let current = await requireAccount(organizationId, accountId);
      while (current.parentAccountId) {
        const parent = await requireAccount(organizationId, current.parentAccountId);
        ancestors.unshift(parent);
        current = parent;
      }
      return ancestors;
    },
  };
}
