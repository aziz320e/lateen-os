import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { canTransitionOrganization, createOrganizationEngine } from '../src/organizations/engine.impl.js';
import { createOrganizationRepository } from '../src/organizations/repository.impl.js';
import { DuplicateOrganizationError, InvalidOrganizationTransitionError, OrganizationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createOrganizationEngine(createOrganizationRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionOrganization (pure)', () => {
  it('active -> suspended | archived', () => {
    expect(canTransitionOrganization('active', 'suspended')).toBe(true);
    expect(canTransitionOrganization('active', 'archived')).toBe(true);
  });

  it('suspended -> active | archived', () => {
    expect(canTransitionOrganization('suspended', 'active')).toBe(true);
    expect(canTransitionOrganization('suspended', 'archived')).toBe(true);
  });

  it('archived is terminal', () => {
    expect(canTransitionOrganization('archived', 'active')).toBe(false);
    expect(canTransitionOrganization('archived', 'suspended')).toBe(false);
  });
});

describe('OrganizationEngine', () => {
  it('registerOrganization() starts at active status with id === organizationId', async () => {
    const { engine } = setup();
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(organization.status).toBe('active');
    expect(organization.id).toBe(ORG);
    expect(organization.organizationId).toBe(ORG);
  });

  it('registerOrganization() defaults plan to "free"', async () => {
    const { engine } = setup();
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(organization.plan).toBe('free');
  });

  it('registerOrganization() accepts an explicit plan', async () => {
    const { engine } = setup();
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co', plan: 'enterprise' });
    expect(organization.plan).toBe('enterprise');
  });

  it('publishes organization.created', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('organization.created', (payload) => (seen = payload));
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(seen).toEqual({ organizationId: ORG, name: 'Acme Co' });
  });

  it('registerOrganization() rejects a duplicate organizationId', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    await expect(engine.registerOrganization(ORG, { name: 'Acme Co Again' })).rejects.toBeInstanceOf(DuplicateOrganizationError);
  });

  it('suspendOrganization() -> reactivateOrganization() -> archiveOrganization() progresses the lifecycle', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    const suspended = await engine.suspendOrganization(ORG);
    expect(suspended.status).toBe('suspended');
    const reactivated = await engine.reactivateOrganization(ORG);
    expect(reactivated.status).toBe('active');
    const archived = await engine.archiveOrganization(ORG);
    expect(archived.status).toBe('archived');
  });

  it('rejects archiveOrganization() called twice', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    await engine.archiveOrganization(ORG);
    await expect(engine.archiveOrganization(ORG)).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('suspendOrganization() throws OrganizationNotFoundError for an unregistered organization', async () => {
    const { engine } = setup();
    await expect(engine.suspendOrganization('missing-org')).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it('getOrganization() returns null for an unregistered organization', async () => {
    const { engine } = setup();
    expect(await engine.getOrganization('missing-org')).toBeNull();
  });

  it('listOrganizations() lists every registered organization, across organizations', async () => {
    const { engine } = setup();
    await engine.registerOrganization('org-a', { name: 'A' });
    await engine.registerOrganization('org-b', { name: 'B' });
    const organizations = await engine.listOrganizations();
    expect(organizations).toHaveLength(2);
    expect(organizations.map((organization) => organization.id).sort()).toEqual(['org-a', 'org-b']);
  });

  it('listOrganizations() is empty when nothing has been registered', async () => {
    const { engine } = setup();
    expect(await engine.listOrganizations()).toEqual([]);
  });

  it('suspended -> archived is a valid direct transition (bypassing reactivation)', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    await engine.suspendOrganization(ORG);
    const archived = await engine.archiveOrganization(ORG);
    expect(archived.status).toBe('archived');
  });

  it('reactivateOrganization() throws InvalidOrganizationTransitionError when already active', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    await expect(engine.reactivateOrganization(ORG)).rejects.toBeInstanceOf(InvalidOrganizationTransitionError);
  });

  it('supports every organization plan', async () => {
    const { engine } = setup();
    const plans = ['free', 'starter', 'business', 'enterprise'] as const;
    for (const plan of plans) {
      const organization = await engine.registerOrganization(`org-${plan}`, { name: plan, plan });
      expect(organization.plan).toBe(plan);
    }
  });

  it('registerOrganization() sets createdAt and updatedAt to the same timestamp initially', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const engine = createOrganizationEngine(createOrganizationRepository(), undefined, fixedNow);
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(organization.createdAt).toBe(organization.updatedAt);
  });

  it('a status transition updates updatedAt but leaves createdAt untouched', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const engine = createOrganizationEngine(createOrganizationRepository(), undefined, () => current);
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    current = '2026-01-02T00:00:00.000Z';
    const suspended = await engine.suspendOrganization(ORG);
    expect(suspended.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(suspended.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('getOrganization() reflects the current status after a transition', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Co' });
    await engine.suspendOrganization(ORG);
    expect((await engine.getOrganization(ORG))?.status).toBe('suspended');
  });

  it('archiveOrganization() throws OrganizationNotFoundError for an unregistered organization', async () => {
    const { engine } = setup();
    await expect(engine.archiveOrganization('missing-org')).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it('registerOrganization() after archiving a different organization does not interfere', async () => {
    const { engine } = setup();
    await engine.registerOrganization('org-archived', { name: 'Old Co' });
    await engine.archiveOrganization('org-archived');
    const fresh = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(fresh.status).toBe('active');
  });

  it('registering the same organizationId again after it was never registered succeeds normally', async () => {
    const { engine } = setup();
    const organization = await engine.registerOrganization(ORG, { name: 'Acme Co' });
    expect(organization).toBeDefined();
  });

  it('the organization name is preserved verbatim through status transitions', async () => {
    const { engine } = setup();
    await engine.registerOrganization(ORG, { name: 'Acme Corporation' });
    const suspended = await engine.suspendOrganization(ORG);
    expect(suspended.name).toBe('Acme Corporation');
  });

  it('archived -> suspended is not a valid transition', () => {
    expect(canTransitionOrganization('archived', 'suspended')).toBe(false);
  });

  it('active -> active is not itself a declared transition', () => {
    expect(canTransitionOrganization('active', 'active')).toBe(false);
  });
});
