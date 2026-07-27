import { describe, expect, it, vi } from 'vitest';
import { createCustomerRepository } from '../src/customer/repository.impl.js';
import { canTransitionCustomer, createCustomerLifecycle } from '../src/customer/lifecycle.impl.js';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';
import { CustomerNotFoundError, InvalidCustomerTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCrmEventBus()) {
  const repository = createCustomerRepository();
  const lifecycle = createCustomerLifecycle(repository, eventBus);
  return { repository, lifecycle, eventBus };
}

describe('canTransitionCustomer', () => {
  it('allows active -> archived -> active', () => {
    expect(canTransitionCustomer('active', 'archived')).toBe(true);
    expect(canTransitionCustomer('archived', 'active')).toBe(true);
  });

  it('allows active/archived -> merged but nothing out of merged', () => {
    expect(canTransitionCustomer('active', 'merged')).toBe(true);
    expect(canTransitionCustomer('archived', 'merged')).toBe(true);
    expect(canTransitionCustomer('merged', 'active')).toBe(false);
  });
});

describe('createCustomerLifecycle', () => {
  it('create() creates an active customer with empty tags by default', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    expect(customer.status).toBe('active');
    expect(customer.tags).toEqual([]);
  });

  it('update() merges fields', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const updated = await lifecycle.update(ORG, customer.id, { email: 'contact@acme.com' });
    expect(updated.email).toBe('contact@acme.com');
    expect(updated.name).toBe('Acme Corp');
  });

  it('update() rejects an archived customer', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.archive(ORG, customer.id);
    await expect(lifecycle.update(ORG, customer.id, { name: 'New' })).rejects.toBeInstanceOf(InvalidCustomerTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const archived = await lifecycle.archive(ORG, customer.id);
    expect(archived.status).toBe('archived');
    const restored = await lifecycle.restore(ORG, customer.id);
    expect(restored.status).toBe('active');
  });

  it('throws CustomerNotFoundError for an unknown customer', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.archive(ORG, 'missing')).rejects.toBeInstanceOf(CustomerNotFoundError);
  });

  it('mergeDuplicates() fills the primary\'s missing fields from duplicates', async () => {
    const { lifecycle } = setup();
    const primary = await lifecycle.create(ORG, { name: 'Acme Corp', tags: ['vip'] });
    const duplicate = await lifecycle.create(ORG, { name: 'Acme Corporation', email: 'info@acme.com', phone: '555-1234', tags: ['east-coast'] });

    const result = await lifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id]);
    expect(result.primary.email).toBe('info@acme.com');
    expect(result.primary.phone).toBe('555-1234');
    expect(result.primary.tags.sort()).toEqual(['east-coast', 'vip'].sort());
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0]?.status).toBe('merged');
    expect(result.merged[0]?.mergedIntoCustomerId).toBe(primary.id);
  });

  it('mergeDuplicates() does not overwrite fields the primary already has', async () => {
    const { lifecycle } = setup();
    const primary = await lifecycle.create(ORG, { name: 'Acme Corp', email: 'primary@acme.com' });
    const duplicate = await lifecycle.create(ORG, { name: 'Acme Corporation', email: 'other@acme.com' });

    const result = await lifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id]);
    expect(result.primary.email).toBe('primary@acme.com');
  });

  it('mergeDuplicates() merges multiple duplicates in one call', async () => {
    const { lifecycle } = setup();
    const primary = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const dup1 = await lifecycle.create(ORG, { name: 'Acme Corp 1', tags: ['a'] });
    const dup2 = await lifecycle.create(ORG, { name: 'Acme Corp 2', tags: ['b'] });

    const result = await lifecycle.mergeDuplicates(ORG, primary.id, [dup1.id, dup2.id]);
    expect(result.merged).toHaveLength(2);
    expect(result.primary.tags.sort()).toEqual(['a', 'b'].sort());
  });

  it('mergeDuplicates() ignores the primary id if listed among duplicates', async () => {
    const { lifecycle } = setup();
    const primary = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const result = await lifecycle.mergeDuplicates(ORG, primary.id, [primary.id]);
    expect(result.merged).toHaveLength(0);
  });

  it('mergeDuplicates() rejects an already-merged duplicate', async () => {
    const { lifecycle } = setup();
    const primary = await lifecycle.create(ORG, { name: 'A' });
    const other = await lifecycle.create(ORG, { name: 'B' });
    const duplicate = await lifecycle.create(ORG, { name: 'C' });
    await lifecycle.mergeDuplicates(ORG, other.id, [duplicate.id]);

    await expect(lifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id])).rejects.toBeInstanceOf(InvalidCustomerTransitionError);
  });

  it('mergeDuplicates() rejects an already-merged primary', async () => {
    const { lifecycle } = setup();
    const other = await lifecycle.create(ORG, { name: 'A' });
    const primary = await lifecycle.create(ORG, { name: 'B' });
    const duplicate = await lifecycle.create(ORG, { name: 'C' });
    await lifecycle.mergeDuplicates(ORG, other.id, [primary.id]);

    await expect(lifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id])).rejects.toBeInstanceOf(InvalidCustomerTransitionError);
  });

  it('publishes customer.created and customer.updated', async () => {
    const eventBus = createCrmEventBus();
    const created = vi.fn();
    const updated = vi.fn();
    eventBus.subscribe('customer.created', created);
    eventBus.subscribe('customer.updated', updated);

    const { lifecycle } = setup(eventBus);
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.update(ORG, customer.id, { email: 'a@acme.com' });
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('publishes customer.updated when a merge changes the primary', async () => {
    const eventBus = createCrmEventBus();
    const updated = vi.fn();
    eventBus.subscribe('customer.updated', updated);
    const { lifecycle } = setup(eventBus);

    const primary = await lifecycle.create(ORG, { name: 'A' });
    const duplicate = await lifecycle.create(ORG, { name: 'B' });
    updated.mockClear();
    await lifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id]);
    await Promise.resolve();

    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    expect(await repository.findById('org-2', customer.id)).toBeNull();
  });

  it('get() returns null for an unknown customer', async () => {
    const { lifecycle } = setup();
    expect(await lifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('transition() applies an arbitrary guarded transition directly', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const archived = await lifecycle.transition(ORG, customer.id, 'archived');
    expect(archived.status).toBe('archived');
  });

  it('transition() rejects an illegal transition', async () => {
    const { lifecycle } = setup();
    const customer = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.transition(ORG, customer.id, 'merged');
    await expect(lifecycle.transition(ORG, customer.id, 'active')).rejects.toBeInstanceOf(InvalidCustomerTransitionError);
  });
});
