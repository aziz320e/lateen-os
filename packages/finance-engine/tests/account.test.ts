import { describe, expect, it } from 'vitest';
import { canTransitionAccount, createChartOfAccountsEngine, normalBalanceForAccountType } from '../src/account/engine.impl.js';
import { createAccountRepository } from '../src/account/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { AccountNotFoundError, InvalidAccountTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createFinanceEventBus()) {
  const repository = createAccountRepository();
  const engine = createChartOfAccountsEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('normalBalanceForAccountType (pure)', () => {
  it('assets and expenses are debit-normal', () => {
    expect(normalBalanceForAccountType('asset')).toBe('debit');
    expect(normalBalanceForAccountType('expense')).toBe('debit');
  });

  it('liabilities, equity, and revenue are credit-normal', () => {
    expect(normalBalanceForAccountType('liability')).toBe('credit');
    expect(normalBalanceForAccountType('equity')).toBe('credit');
    expect(normalBalanceForAccountType('revenue')).toBe('credit');
  });
});

describe('canTransitionAccount (pure)', () => {
  it('allows draft -> active', () => {
    expect(canTransitionAccount('draft', 'active')).toBe(true);
  });

  it('allows active -> inactive', () => {
    expect(canTransitionAccount('active', 'inactive')).toBe(true);
  });

  it('allows any non-archived status -> archived', () => {
    expect(canTransitionAccount('draft', 'archived')).toBe(true);
    expect(canTransitionAccount('active', 'archived')).toBe(true);
    expect(canTransitionAccount('inactive', 'archived')).toBe(true);
  });

  it('rejects archived -> anything — restore() is a distinct operation', () => {
    expect(canTransitionAccount('archived', 'draft')).toBe(false);
    expect(canTransitionAccount('archived', 'active')).toBe(false);
  });

  it('rejects draft -> inactive', () => {
    expect(canTransitionAccount('draft', 'inactive')).toBe(false);
  });
});

describe('ChartOfAccountsEngine — create', () => {
  it('creates a draft account at version 1 with the correct normal balance', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'Cash', accountType: 'asset' });
    expect(account.status).toBe('draft');
    expect(account.currentVersion).toBe(1);
    expect(account.normalBalance).toBe('debit');
  });

  it('supports all five account types', async () => {
    const { engine } = setup();
    const types = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
    for (const accountType of types) {
      const account = await engine.create(ORG, { code: `c-${accountType}`, name: accountType, accountType });
      expect(account.accountType).toBe(accountType);
    }
  });

  it('publishes account.created', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('account.created', (payload) => (seen = payload));
    const account = await engine.create(ORG, { code: '2000', name: 'Accounts Payable', accountType: 'liability' });
    expect(seen).toEqual({ organizationId: ORG, accountId: account.id, accountType: 'liability' });
  });

  it('supports a parentAccountId for hierarchy', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: '1000', name: 'Assets', accountType: 'asset' });
    const child = await engine.create(ORG, { code: '1010', name: 'Cash', accountType: 'asset', parentAccountId: parent.id });
    expect(child.parentAccountId).toBe(parent.id);
  });
});

describe('ChartOfAccountsEngine — update', () => {
  it('bumps version on update', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    const updated = await engine.update(ORG, account.id, { name: 'n2' });
    expect(updated.currentVersion).toBe(2);
    expect(updated.name).toBe('n2');
  });

  it('rejects updating an archived account', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await engine.archive(ORG, account.id);
    await expect(engine.update(ORG, account.id, { name: 'n2' })).rejects.toBeInstanceOf(InvalidAccountTransitionError);
  });

  it('throws AccountNotFoundError for an unknown account', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});

describe('ChartOfAccountsEngine — activate/deactivate/archive/restore', () => {
  it('activate() moves draft -> active', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    const activated = await engine.activate(ORG, account.id);
    expect(activated.status).toBe('active');
  });

  it('deactivate() moves active -> inactive', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await engine.activate(ORG, account.id);
    const deactivated = await engine.deactivate(ORG, account.id);
    expect(deactivated.status).toBe('inactive');
  });

  it('rejects activate() on an archived account', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await engine.archive(ORG, account.id);
    await expect(engine.activate(ORG, account.id)).rejects.toBeInstanceOf(InvalidAccountTransitionError);
  });

  it('archive() stamps statusBeforeArchive and restore() returns to it', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await engine.activate(ORG, account.id);
    const archived = await engine.archive(ORG, account.id);
    expect(archived.statusBeforeArchive).toBe('active');
    const restored = await engine.restore(ORG, account.id);
    expect(restored.status).toBe('active');
  });

  it('restore() defaults to draft when archived directly from draft', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await engine.archive(ORG, account.id);
    const restored = await engine.restore(ORG, account.id);
    expect(restored.status).toBe('draft');
  });

  it('rejects restore() on a non-archived account', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'n', accountType: 'asset' });
    await expect(engine.restore(ORG, account.id)).rejects.toBeInstanceOf(InvalidAccountTransitionError);
  });
});

describe('ChartOfAccountsEngine — hierarchy', () => {
  it('getChildren() returns direct children only', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: '1000', name: 'Assets', accountType: 'asset' });
    const child1 = await engine.create(ORG, { code: '1010', name: 'Cash', accountType: 'asset', parentAccountId: parent.id });
    const child2 = await engine.create(ORG, { code: '1020', name: 'Receivables', accountType: 'asset', parentAccountId: parent.id });
    const grandchild = await engine.create(ORG, { code: '1011', name: 'Petty Cash', accountType: 'asset', parentAccountId: child1.id });
    const children = await engine.getChildren(ORG, parent.id);
    expect(children.map((c) => c.id).sort()).toEqual([child1.id, child2.id].sort());
    expect(children.some((c) => c.id === grandchild.id)).toBe(false);
  });

  it('getDescendants() returns every depth', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: '1000', name: 'Assets', accountType: 'asset' });
    const child = await engine.create(ORG, { code: '1010', name: 'Cash', accountType: 'asset', parentAccountId: parent.id });
    const grandchild = await engine.create(ORG, { code: '1011', name: 'Petty Cash', accountType: 'asset', parentAccountId: child.id });
    const descendants = await engine.getDescendants(ORG, parent.id);
    expect(descendants.map((d) => d.id).sort()).toEqual([child.id, grandchild.id].sort());
  });

  it('getAncestors() walks up to the root', async () => {
    const { engine } = setup();
    const parent = await engine.create(ORG, { code: '1000', name: 'Assets', accountType: 'asset' });
    const child = await engine.create(ORG, { code: '1010', name: 'Cash', accountType: 'asset', parentAccountId: parent.id });
    const grandchild = await engine.create(ORG, { code: '1011', name: 'Petty Cash', accountType: 'asset', parentAccountId: child.id });
    const ancestors = await engine.getAncestors(ORG, grandchild.id);
    expect(ancestors.map((a) => a.id)).toEqual([parent.id, child.id]);
  });

  it('getAncestors() is empty for a root account', async () => {
    const { engine } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'Assets', accountType: 'asset' });
    expect(await engine.getAncestors(ORG, account.id)).toEqual([]);
  });
});

describe('ChartOfAccountsEngine — get/list/org scoping', () => {
  it('get() returns null for an unknown account', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every account for the organization', async () => {
    const { engine } = setup();
    await engine.create(ORG, { code: '1000', name: 'a', accountType: 'asset' });
    await engine.create(ORG, { code: '2000', name: 'b', accountType: 'liability' });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const account = await engine.create(ORG, { code: '1000', name: 'a', accountType: 'asset' });
    expect(await repository.findById('org-2', account.id)).toBeNull();
  });
});
