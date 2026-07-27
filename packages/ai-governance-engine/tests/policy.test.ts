import { describe, expect, it } from 'vitest';
import { createGovernancePolicyRepository, createGovernancePolicyVersionRepository } from '../src/policy/repository.impl.js';
import { canTransitionPolicy, createGovernancePolicyEngine } from '../src/policy/engine.impl.js';
import { createGovernanceEventBus } from '../src/events/index.js';
import { InvalidPolicyTransitionError, GovernancePolicyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createGovernanceEventBus()) {
  const repository = createGovernancePolicyRepository();
  const versionRepository = createGovernancePolicyVersionRepository();
  const engine = createGovernancePolicyEngine(repository, versionRepository, eventBus);
  return { repository, versionRepository, engine, eventBus };
}

describe('canTransitionPolicy (pure)', () => {
  it('allows draft -> active', () => {
    expect(canTransitionPolicy('draft', 'active')).toBe(true);
  });

  it('allows active -> inactive', () => {
    expect(canTransitionPolicy('active', 'inactive')).toBe(true);
  });

  it('allows any non-archived status -> archived', () => {
    expect(canTransitionPolicy('draft', 'archived')).toBe(true);
    expect(canTransitionPolicy('active', 'archived')).toBe(true);
    expect(canTransitionPolicy('inactive', 'archived')).toBe(true);
  });

  it('rejects archived -> draft/active/inactive — restore() is a distinct operation, not an ordinary transition', () => {
    expect(canTransitionPolicy('archived', 'draft')).toBe(false);
    expect(canTransitionPolicy('archived', 'active')).toBe(false);
    expect(canTransitionPolicy('archived', 'inactive')).toBe(false);
  });

  it('rejects draft -> inactive', () => {
    expect(canTransitionPolicy('draft', 'inactive')).toBe(false);
  });

  it('rejects archived -> archived', () => {
    expect(canTransitionPolicy('archived', 'archived')).toBe(false);
  });
});

describe('createGovernancePolicyEngine — create', () => {
  it('creates a draft policy at version 1', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'Prompt Security Baseline', policyType: 'security' });
    expect(policy.status).toBe('draft');
    expect(policy.currentVersion).toBe(1);
    expect(policy.policyType).toBe('security');
  });

  it('publishes policy.created', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('policy.created', (payload) => (seen = payload));
    const policy = await engine.create(ORG, { name: 'p', policyType: 'ai' });
    expect(seen).toEqual({ organizationId: ORG, policyId: policy.id, policyType: 'ai' });
  });

  it('snapshots version 1 on create', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'workflow' });
    const history = await engine.getVersionHistory(ORG, policy.id);
    expect(history).toHaveLength(1);
    expect(history[0]?.version).toBe(1);
  });

  it('supports all seven policy types', async () => {
    const { engine } = setup();
    const types = ['security', 'workflow', 'ai', 'communication', 'business', 'approval', 'runtime'] as const;
    for (const policyType of types) {
      const policy = await engine.create(ORG, { name: `p-${policyType}`, policyType });
      expect(policy.policyType).toBe(policyType);
    }
  });
});

describe('createGovernancePolicyEngine — update', () => {
  it('bumps version and snapshots on update', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    const updated = await engine.update(ORG, policy.id, { name: 'p2' });
    expect(updated.currentVersion).toBe(2);
    expect(updated.name).toBe('p2');
    const history = await engine.getVersionHistory(ORG, policy.id);
    expect(history).toHaveLength(2);
  });

  it('publishes policy.updated', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    let seen: unknown;
    eventBus.subscribe('policy.updated', (payload) => (seen = payload));
    await engine.update(ORG, policy.id, { name: 'p2' });
    expect(seen).toEqual({ organizationId: ORG, policyId: policy.id });
  });

  it('rejects updating an archived policy', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.archive(ORG, policy.id);
    await expect(engine.update(ORG, policy.id, { name: 'p2' })).rejects.toBeInstanceOf(InvalidPolicyTransitionError);
  });

  it('throws GovernancePolicyNotFoundError for an unknown policy', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', { name: 'x' })).rejects.toBeInstanceOf(GovernancePolicyNotFoundError);
  });
});

describe('createGovernancePolicyEngine — activate/deactivate', () => {
  it('activate() moves draft -> active and publishes policy.activated', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    let seen: unknown;
    eventBus.subscribe('policy.activated', (payload) => (seen = payload));
    const activated = await engine.activate(ORG, policy.id);
    expect(activated.status).toBe('active');
    expect(seen).toEqual({ organizationId: ORG, policyId: policy.id });
  });

  it('deactivate() moves active -> inactive and publishes policy.deactivated', async () => {
    const eventBus = createGovernanceEventBus();
    const { engine } = setup(eventBus);
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.activate(ORG, policy.id);
    let seen: unknown;
    eventBus.subscribe('policy.deactivated', (payload) => (seen = payload));
    const deactivated = await engine.deactivate(ORG, policy.id);
    expect(deactivated.status).toBe('inactive');
    expect(seen).toEqual({ organizationId: ORG, policyId: policy.id });
  });

  it('rejects activate() on an archived policy', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.archive(ORG, policy.id);
    await expect(engine.activate(ORG, policy.id)).rejects.toBeInstanceOf(InvalidPolicyTransitionError);
  });
});

describe('createGovernancePolicyEngine — archive/restore', () => {
  it('archive() stamps statusBeforeArchive', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.activate(ORG, policy.id);
    const archived = await engine.archive(ORG, policy.id);
    expect(archived.status).toBe('archived');
    expect(archived.statusBeforeArchive).toBe('active');
  });

  it('restore() returns to the status held before archiving', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.activate(ORG, policy.id);
    await engine.deactivate(ORG, policy.id);
    await engine.archive(ORG, policy.id);
    const restored = await engine.restore(ORG, policy.id);
    expect(restored.status).toBe('inactive');
  });

  it('restore() defaults to draft when archived directly from draft', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.archive(ORG, policy.id);
    const restored = await engine.restore(ORG, policy.id);
    expect(restored.status).toBe('draft');
  });

  it('rejects restore() on a non-archived policy', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await expect(engine.restore(ORG, policy.id)).rejects.toBeInstanceOf(InvalidPolicyTransitionError);
  });
});

describe('createGovernancePolicyEngine — get / version history / org scoping', () => {
  it('get() returns null for an unknown policy', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('getVersionHistory() is sorted ascending by version', async () => {
    const { engine } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    await engine.update(ORG, policy.id, { name: 'p2' });
    await engine.update(ORG, policy.id, { name: 'p3' });
    const history = await engine.getVersionHistory(ORG, policy.id);
    expect(history.map((v) => v.version)).toEqual([1, 2, 3]);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const policy = await engine.create(ORG, { name: 'p', policyType: 'security' });
    expect(await repository.findById('org-2', policy.id)).toBeNull();
  });
});
