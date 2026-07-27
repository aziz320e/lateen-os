import { describe, expect, it } from 'vitest';
import { createAccountRepository } from '../src/account/repository.impl.js';
import { canTransitionAccount, createAccountManagement } from '../src/account/service.impl.js';
import { AccountNotFoundError, InvalidRecordTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createAccountRepository();
  const service = createAccountManagement(repository);
  return { repository, service };
}

describe('canTransitionAccount', () => {
  it('allows active <-> archived only', () => {
    expect(canTransitionAccount('active', 'archived')).toBe(true);
    expect(canTransitionAccount('archived', 'active')).toBe(true);
  });
});

describe('createAccountManagement', () => {
  it('create() creates an active account', async () => {
    const { service } = setup();
    const account = await service.create(ORG, { name: 'Acme Corp' });
    expect(account.status).toBe('active');
    expect(account.tags).toEqual([]);
  });

  it('update() merges fields', async () => {
    const { service } = setup();
    const account = await service.create(ORG, { name: 'Acme Corp' });
    const updated = await service.update(ORG, account.id, { industry: 'Manufacturing' });
    expect(updated.industry).toBe('Manufacturing');
    expect(updated.name).toBe('Acme Corp');
  });

  it('update() rejects an archived account', async () => {
    const { service } = setup();
    const account = await service.create(ORG, { name: 'Acme Corp' });
    await service.archive(ORG, account.id);
    await expect(service.update(ORG, account.id, { name: 'X' })).rejects.toBeInstanceOf(InvalidRecordTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const { service } = setup();
    const account = await service.create(ORG, { name: 'Acme Corp' });
    const archived = await service.archive(ORG, account.id);
    expect(archived.status).toBe('archived');
    const restored = await service.restore(ORG, account.id);
    expect(restored.status).toBe('active');
  });

  it('throws AccountNotFoundError for unknown account', async () => {
    const { service } = setup();
    await expect(service.archive(ORG, 'missing')).rejects.toBeInstanceOf(AccountNotFoundError);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const account = await service.create(ORG, { name: 'Acme Corp' });
    expect(await repository.findById('org-2', account.id)).toBeNull();
  });

  it('get() returns null for an unknown account', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });
});
