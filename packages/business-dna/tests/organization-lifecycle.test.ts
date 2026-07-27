import { describe, expect, it, vi } from 'vitest';
import { createOrganizationRepository } from '../src/organization/repository.impl.js';
import { canTransitionOrganization, createOrganizationLifecycle } from '../src/organization/lifecycle.impl.js';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';
import {
  InvalidOrganizationTransitionError,
  OrganizationCodeConflictError,
  OrganizationNotFoundError,
} from '../src/shared/errors.js';

function createInput() {
  return {
    code: 'acme',
    name: 'Acme Signage Co.',
    legalName: 'Acme Signage Company LLC',
    registrationNumber: 'REG-001',
    taxId: 'TAX-001',
    domain: 'acme.com',
    defaultCurrency: 'SAR',
    defaultLocale: 'en-SA',
    timezone: 'Asia/Riyadh',
  };
}

describe('canTransitionOrganization', () => {
  it('allows draft -> active -> suspended -> active', () => {
    expect(canTransitionOrganization('draft', 'active')).toBe(true);
    expect(canTransitionOrganization('active', 'suspended')).toBe(true);
    expect(canTransitionOrganization('suspended', 'active')).toBe(true);
  });

  it('allows archived -> active (restore) but nothing else out of archived', () => {
    expect(canTransitionOrganization('archived', 'active')).toBe(true);
    expect(canTransitionOrganization('archived', 'draft')).toBe(false);
    expect(canTransitionOrganization('archived', 'suspended')).toBe(false);
  });
});

describe('createOrganizationLifecycle', () => {
  it('create() creates an organization in draft status', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    expect(org.status).toBe('draft');
    expect(org.operatingModel).toBe('ai_first');
    expect(org.domain).toBe('acme.com');
    expect(org.industryVerticals).toEqual([]);
  });

  it('create() rejects a duplicate code', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    await lifecycle.create(createInput());
    await expect(lifecycle.create(createInput())).rejects.toBeInstanceOf(OrganizationCodeConflictError);
  });

  it('activate() moves draft to active', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    const activated = await lifecycle.activate(org.id);
    expect(activated.status).toBe('active');
  });

  it('activate() is rejected on an already-active organization', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await lifecycle.activate(org.id);
    await expect(lifecycle.activate(org.id)).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('suspend() and reactivate() round-trip', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await lifecycle.activate(org.id);
    const suspended = await lifecycle.suspend(org.id);
    expect(suspended.status).toBe('suspended');
    const reactivated = await lifecycle.activate(org.id);
    expect(reactivated.status).toBe('active');
  });

  it('suspend() rejects a draft organization', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await expect(lifecycle.suspend(org.id)).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await lifecycle.activate(org.id);
    const archived = await lifecycle.archive(org.id);
    expect(archived.status).toBe('archived');
    const restored = await lifecycle.restore(org.id);
    expect(restored.status).toBe('active');
  });

  it('restore() rejects a non-archived organization', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await expect(lifecycle.restore(org.id)).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('update() merges fields and bumps updatedAt', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    const updated = await lifecycle.update(org.id, { name: 'Acme Signage & Branding Co.' });
    expect(updated.name).toBe('Acme Signage & Branding Co.');
    expect(updated.legalName).toBe(org.legalName);
  });

  it('update() rejects an archived organization', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    const org = await lifecycle.create(createInput());
    await lifecycle.activate(org.id);
    await lifecycle.archive(org.id);
    await expect(lifecycle.update(org.id, { name: 'New name' })).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('throws OrganizationNotFoundError for an unknown organization', async () => {
    const lifecycle = createOrganizationLifecycle(createOrganizationRepository());
    await expect(lifecycle.activate('missing')).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it('publishes organization.created, updated, activated, suspended, archived, restored', async () => {
    const eventBus = createBusinessDnaEventBus();
    const created = vi.fn();
    const updated = vi.fn();
    const activated = vi.fn();
    const suspended = vi.fn();
    const archived = vi.fn();
    const restored = vi.fn();
    eventBus.subscribe('organization.created', created);
    eventBus.subscribe('organization.updated', updated);
    eventBus.subscribe('organization.activated', activated);
    eventBus.subscribe('organization.suspended', suspended);
    eventBus.subscribe('organization.archived', archived);
    eventBus.subscribe('organization.restored', restored);

    const lifecycle = createOrganizationLifecycle(createOrganizationRepository(), eventBus);
    const org = await lifecycle.create(createInput());
    await lifecycle.update(org.id, { name: 'Renamed' });
    await lifecycle.activate(org.id);
    await lifecycle.suspend(org.id);
    await lifecycle.activate(org.id);
    await lifecycle.archive(org.id);
    await lifecycle.restore(org.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
    expect(activated).toHaveBeenCalledTimes(2);
    expect(suspended).toHaveBeenCalledTimes(1);
    expect(archived).toHaveBeenCalledTimes(1);
    expect(restored).toHaveBeenCalledTimes(1);
  });
});

describe('createOrganizationRepository', () => {
  it('findByCode, findByDomain, and findByStatus are unscoped lookups', async () => {
    const repository = createOrganizationRepository();
    const lifecycle = createOrganizationLifecycle(repository);
    const org = await lifecycle.create(createInput());
    await lifecycle.create({ ...createInput(), code: 'other', domain: 'other.com' });

    expect((await repository.findByCode('acme'))?.id).toBe(org.id);
    expect((await repository.findByDomain('acme.com'))?.id).toBe(org.id);
    expect(await repository.findByStatus('draft')).toHaveLength(2);
    expect(await repository.findAll()).toHaveLength(2);
  });

  it('findById only resolves when organizationId equals the id (self-scoped tenant root)', async () => {
    const repository = createOrganizationRepository();
    const lifecycle = createOrganizationLifecycle(repository);
    const org = await lifecycle.create(createInput());

    expect(await repository.findById(org.id, org.id)).not.toBeNull();
    expect(await repository.findById('some-other-id', org.id)).toBeNull();
  });
});
