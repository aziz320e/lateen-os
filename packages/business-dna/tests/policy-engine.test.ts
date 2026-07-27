import { describe, expect, it, vi } from 'vitest';
import { createPolicyRepository } from '../src/policy/repository.impl.js';
import { canTransitionPolicy, createPolicyEngine } from '../src/policy/engine.impl.js';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';
import { InvalidPolicyTransitionError, PolicyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function policyInput(type: 'business' | 'approval' | 'communication' | 'sales' = 'business') {
  return { code: `POL-${type}`, name: 'Refund Policy', type, description: 'Governs refunds' };
}

describe('canTransitionPolicy', () => {
  it('allows draft -> active -> suspended -> active', () => {
    expect(canTransitionPolicy('draft', 'active')).toBe(true);
    expect(canTransitionPolicy('active', 'suspended')).toBe(true);
    expect(canTransitionPolicy('suspended', 'active')).toBe(true);
  });

  it('rejects transitions out of archived', () => {
    expect(canTransitionPolicy('archived', 'active')).toBe(false);
  });
});

describe('createPolicyEngine', () => {
  it('create() creates every required policy type in draft status', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    for (const type of ['business', 'approval', 'communication', 'sales'] as const) {
      const policy = await engine.create(ORG, policyInput(type));
      expect(policy.status).toBe('draft');
      expect(policy.type).toBe(type);
    }
  });

  it('approve() stamps approvedById/approvedAt without changing status', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    const policy = await engine.create(ORG, policyInput());
    const approved = await engine.approve(ORG, policy.id, 'employee-1');
    expect(approved.approvedById).toBe('employee-1');
    expect(approved.approvedAt).toBeDefined();
    expect(approved.status).toBe('draft');
  });

  it('activate() moves draft to active and can reactivate from suspended', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    const policy = await engine.create(ORG, policyInput());
    const active = await engine.activate(ORG, policy.id);
    expect(active.status).toBe('active');

    const suspended = await engine.suspend(ORG, policy.id);
    expect(suspended.status).toBe('suspended');

    const reactivated = await engine.activate(ORG, policy.id);
    expect(reactivated.status).toBe('active');
  });

  it('archive() is terminal', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    const policy = await engine.create(ORG, policyInput());
    const archived = await engine.archive(ORG, policy.id);
    expect(archived.status).toBe('archived');
    await expect(engine.activate(ORG, policy.id)).rejects.toBeInstanceOf(InvalidPolicyTransitionError);
  });

  it('throws PolicyNotFoundError for an unknown policy', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    await expect(engine.activate(ORG, 'missing')).rejects.toBeInstanceOf(PolicyNotFoundError);
  });

  it('findByType() filters by policy type', async () => {
    const engine = createPolicyEngine(createPolicyRepository());
    await engine.create(ORG, policyInput('business'));
    await engine.create(ORG, policyInput('sales'));
    expect(await engine.findByType(ORG, 'sales')).toHaveLength(1);
  });

  it('publishes policy.updated on every mutation', async () => {
    const eventBus = createBusinessDnaEventBus();
    const handler = vi.fn();
    eventBus.subscribe('policy.updated', handler);
    const engine = createPolicyEngine(createPolicyRepository(), eventBus);

    const policy = await engine.create(ORG, policyInput());
    await engine.approve(ORG, policy.id, 'employee-1');
    await engine.activate(ORG, policy.id);
    await engine.suspend(ORG, policy.id);
    await engine.archive(ORG, policy.id);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(5);
  });
});
