import { describe, expect, it } from 'vitest';
import { createContactRepository } from '../src/contact/repository.impl.js';
import { canTransitionContact, createContactManagement } from '../src/contact/service.impl.js';
import { contactFullName } from '../src/contact/types.js';
import { ContactNotFoundError, InvalidRecordTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createContactRepository();
  const service = createContactManagement(repository);
  return { repository, service };
}

describe('canTransitionContact', () => {
  it('allows active <-> archived only', () => {
    expect(canTransitionContact('active', 'archived')).toBe(true);
    expect(canTransitionContact('archived', 'active')).toBe(true);
  });
});

describe('contactFullName', () => {
  it('joins first and last name', () => {
    expect(contactFullName({ firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace');
  });

  it('trims when a name part is empty', () => {
    expect(contactFullName({ firstName: 'Ada', lastName: '' })).toBe('Ada');
  });
});

describe('createContactManagement', () => {
  it('create() creates an active contact', async () => {
    const { service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    expect(contact.status).toBe('active');
    expect(contact.tags).toEqual([]);
  });

  it('update() merges fields', async () => {
    const { service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    const updated = await service.update(ORG, contact.id, { title: 'Engineer' });
    expect(updated.title).toBe('Engineer');
    expect(updated.firstName).toBe('Ada');
  });

  it('update() rejects an archived contact', async () => {
    const { service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    await service.archive(ORG, contact.id);
    await expect(service.update(ORG, contact.id, { title: 'X' })).rejects.toBeInstanceOf(InvalidRecordTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const { service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    const archived = await service.archive(ORG, contact.id);
    expect(archived.status).toBe('archived');
    const restored = await service.restore(ORG, contact.id);
    expect(restored.status).toBe('active');
  });

  it('throws ContactNotFoundError for unknown contact', async () => {
    const { service } = setup();
    await expect(service.archive(ORG, 'missing')).rejects.toBeInstanceOf(ContactNotFoundError);
  });

  it('can reference both a customerId and an accountId', async () => {
    const { service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace', customerId: 'customer-1', accountId: 'account-1' });
    expect(contact.customerId).toBe('customer-1');
    expect(contact.accountId).toBe('account-1');
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const contact = await service.create(ORG, { firstName: 'Ada', lastName: 'Lovelace' });
    expect(await repository.findById('org-2', contact.id)).toBeNull();
  });

  it('get() returns null for an unknown contact', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });
});
