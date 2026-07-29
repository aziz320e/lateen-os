import { describe, expect, it } from 'vitest';
import { createAuthorizationEngine, evaluatePolicies, matchesPattern } from '../src/authorization/engine.impl.js';
import { createPolicyRepository } from '../src/authorization/repository.impl.js';
import { PolicyNotFoundError } from '../src/shared/errors.js';
import type { Policy } from '../src/authorization/types.js';

const ORG = 'org-1';

function setup() {
  return { engine: createAuthorizationEngine(createPolicyRepository()) };
}

function makePolicy(overrides: Partial<Policy> = {}): Policy {
  return {
    id: 'policy-x',
    organizationId: ORG,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'X',
    effect: 'allow',
    resource: '*',
    action: '*',
    priority: 0,
    status: 'active',
    ...overrides,
  };
}

describe('matchesPattern (pure)', () => {
  it('matches an exact string', () => {
    expect(matchesPattern('/crm/customers', '/crm/customers')).toBe(true);
    expect(matchesPattern('/crm/customers', '/crm/other')).toBe(false);
  });

  it('matches a bare wildcard against anything', () => {
    expect(matchesPattern('*', '/anything')).toBe(true);
  });

  it('matches a trailing-wildcard prefix pattern', () => {
    expect(matchesPattern('/crm/*', '/crm/customers')).toBe(true);
    expect(matchesPattern('/crm/*', '/hr/employees')).toBe(false);
  });
});

describe('evaluatePolicies (pure)', () => {
  it('denies by default when no policy matches', () => {
    expect(evaluatePolicies([], { resource: '/crm/customers', action: 'GET' })).toEqual({ effect: 'deny' });
  });

  it('allows when a matching allow policy exists', () => {
    const policies = [makePolicy({ id: 'p1', effect: 'allow', resource: '/crm/*', action: 'GET' })];
    expect(evaluatePolicies(policies, { resource: '/crm/customers', action: 'GET' })).toEqual({ effect: 'allow', matchedPolicyId: 'p1' });
  });

  it('the highest-priority matching policy wins', () => {
    const policies = [
      makePolicy({ id: 'low', effect: 'allow', resource: '/crm/*', action: '*', priority: 1 }),
      makePolicy({ id: 'high', effect: 'deny', resource: '/crm/*', action: '*', priority: 10 }),
    ];
    expect(evaluatePolicies(policies, { resource: '/crm/customers', action: 'GET' })).toEqual({ effect: 'deny', matchedPolicyId: 'high' });
  });

  it('ignores inactive policies', () => {
    const policies = [makePolicy({ id: 'p1', effect: 'allow', status: 'inactive' })];
    expect(evaluatePolicies(policies, { resource: '/x', action: 'GET' })).toEqual({ effect: 'deny' });
  });

  it('requires principalScope to be present when a policy declares one', () => {
    const policies = [makePolicy({ id: 'p1', effect: 'allow', principalScope: 'admin' })];
    expect(evaluatePolicies(policies, { resource: '/x', action: 'GET', principalScopes: [] })).toEqual({ effect: 'deny' });
    expect(evaluatePolicies(policies, { resource: '/x', action: 'GET', principalScopes: ['admin'] })).toEqual({ effect: 'allow', matchedPolicyId: 'p1' });
  });

  it('a policy without a principalScope applies to every principal', async () => {
    const policies = [makePolicy({ id: 'p1', effect: 'allow' })];
    expect(evaluatePolicies(policies, { resource: '/x', action: 'GET' })).toEqual({ effect: 'allow', matchedPolicyId: 'p1' });
  });

  it('action matching respects the same exact/wildcard rules as resource', () => {
    const policies = [makePolicy({ id: 'p1', effect: 'allow', resource: '*', action: 'GET' })];
    expect(evaluatePolicies(policies, { resource: '/x', action: 'POST' })).toEqual({ effect: 'deny' });
  });
});

describe('AuthorizationEngine', () => {
  it('createPolicy() defaults priority to 0 and status to active', async () => {
    const { engine } = setup();
    const policy = await engine.createPolicy(ORG, { name: 'Allow CRM', effect: 'allow', resource: '/crm/*', action: 'GET' });
    expect(policy.priority).toBe(0);
    expect(policy.status).toBe('active');
  });

  it('deactivatePolicy() / activatePolicy() toggle status', async () => {
    const { engine } = setup();
    const policy = await engine.createPolicy(ORG, { name: 'Allow CRM', effect: 'allow', resource: '/crm/*', action: 'GET' });
    const deactivated = await engine.deactivatePolicy(ORG, policy.id);
    expect(deactivated.status).toBe('inactive');
    const reactivated = await engine.activatePolicy(ORG, policy.id);
    expect(reactivated.status).toBe('active');
  });

  it('deactivatePolicy() throws PolicyNotFoundError for an unknown policy', async () => {
    const { engine } = setup();
    await expect(engine.deactivatePolicy(ORG, 'missing')).rejects.toBeInstanceOf(PolicyNotFoundError);
  });

  it('evaluate() composes createPolicy() and the pure evaluation algorithm', async () => {
    const { engine } = setup();
    await engine.createPolicy(ORG, { name: 'Allow CRM', effect: 'allow', resource: '/crm/*', action: 'GET', priority: 5 });
    const decision = await engine.evaluate(ORG, { resource: '/crm/customers', action: 'GET' });
    expect(decision.effect).toBe('allow');
  });

  it('evaluate() denies when nothing has been configured', async () => {
    const { engine } = setup();
    const decision = await engine.evaluate(ORG, { resource: '/anything', action: 'GET' });
    expect(decision.effect).toBe('deny');
  });

  it('a deactivated policy no longer affects evaluate()', async () => {
    const { engine } = setup();
    const policy = await engine.createPolicy(ORG, { name: 'Allow CRM', effect: 'allow', resource: '*', action: '*' });
    await engine.deactivatePolicy(ORG, policy.id);
    const decision = await engine.evaluate(ORG, { resource: '/x', action: 'GET' });
    expect(decision.effect).toBe('deny');
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const policy = await engine.createPolicy(ORG, { name: 'X', effect: 'allow', resource: '*', action: '*' });
    expect(await engine.get(ORG, policy.id)).toEqual(policy);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('policies are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createPolicy(ORG, { name: 'X', effect: 'allow', resource: '*', action: '*' });
    await engine.createPolicy('org-2', { name: 'X', effect: 'allow', resource: '*', action: '*' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('evaluatePolicies breaks an equal-priority tie by preferring the first-registered candidate', () => {
    const policies = [
      makePolicy({ id: 'first', effect: 'allow', resource: '*', action: '*', priority: 5 }),
      makePolicy({ id: 'second', effect: 'deny', resource: '*', action: '*', priority: 5 }),
    ];
    expect(evaluatePolicies(policies, { resource: '/x', action: 'GET' })).toEqual({ effect: 'allow', matchedPolicyId: 'first' });
  });

  it('activatePolicy() throws PolicyNotFoundError for an unknown policy', async () => {
    const { engine } = setup();
    await expect(engine.activatePolicy(ORG, 'missing')).rejects.toBeInstanceOf(PolicyNotFoundError);
  });

  it('createPolicy() accepts an explicit priority', async () => {
    const { engine } = setup();
    const policy = await engine.createPolicy(ORG, { name: 'High Priority', effect: 'allow', resource: '*', action: '*', priority: 10 });
    expect(policy.priority).toBe(10);
  });

  it('matchesPattern rejects a value that only partially matches a non-wildcard pattern', () => {
    expect(matchesPattern('/crm/customers', '/crm/customers/extra')).toBe(false);
  });

  it('evaluate() considers policies from multiple resources, only matching the exact one queried', async () => {
    const { engine } = setup();
    await engine.createPolicy(ORG, { name: 'Allow CRM', effect: 'allow', resource: '/crm/*', action: 'GET' });
    await engine.createPolicy(ORG, { name: 'Allow HR', effect: 'allow', resource: '/hr/*', action: 'GET' });
    expect((await engine.evaluate(ORG, { resource: '/crm/customers', action: 'GET' })).effect).toBe('allow');
    expect((await engine.evaluate(ORG, { resource: '/finance/accounts', action: 'GET' })).effect).toBe('deny');
  });
});
