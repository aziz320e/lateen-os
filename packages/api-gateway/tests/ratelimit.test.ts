import { describe, expect, it } from 'vitest';
import { createGatewayEventBus } from '../src/events/index.js';
import { createRateLimitEngine, isWindowExpired } from '../src/ratelimit/engine.impl.js';
import { createQuotaRepository, createRateLimitCounterRepository, createRateLimitPolicyRepository } from '../src/ratelimit/repository.impl.js';
import { QuotaNotFoundError, RateLimitPolicyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(now?: () => string) {
  const eventBus = createGatewayEventBus();
  const engine = createRateLimitEngine(createRateLimitPolicyRepository(), createRateLimitCounterRepository(), createQuotaRepository(), eventBus, now);
  return { engine, eventBus };
}

describe('isWindowExpired (pure)', () => {
  it('returns false while within the window', () => {
    expect(isWindowExpired('2026-01-01T00:00:00.000Z', '2026-01-01T00:00:30.000Z', 60)).toBe(false);
  });

  it('returns true once the window has elapsed', () => {
    expect(isWindowExpired('2026-01-01T00:00:00.000Z', '2026-01-01T00:01:00.000Z', 60)).toBe(true);
  });
});

describe('RateLimitEngine — rate limiting', () => {
  it('createPolicy() persists window/threshold configuration', async () => {
    const { engine } = setup();
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 10 });
    expect(policy.windowSeconds).toBe(60);
    expect(policy.maxRequests).toBe(10);
  });

  it('checkAndConsume() allows requests up to the threshold', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 3 });
    for (let i = 0; i < 3; i += 1) {
      const result = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
      expect(result.exceeded).toBe(false);
    }
  });

  it('checkAndConsume() flags the request that exceeds the threshold and publishes ratelimit.exceeded', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine, eventBus } = setup(fixedNow);
    let seen: unknown;
    eventBus.subscribe('ratelimit.exceeded', (payload) => (seen = payload));
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 2 });
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    const third = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(third.exceeded).toBe(true);
    expect(seen).toEqual({ organizationId: ORG, policyId: policy.id, principalId: 'principal-1' });
  });

  it('checkAndConsume() reports the correct remaining count', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 5 });
    const result = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(result.remaining).toBe(4);
  });

  it('remaining floors at 0 once exceeded', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 1 });
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    const second = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(second.remaining).toBe(0);
  });

  it('the counter resets once the window has elapsed', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const { engine } = setup(() => current);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 1 });
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    const withinWindow = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(withinWindow.exceeded).toBe(true);

    current = '2026-01-01T00:01:00.000Z';
    const afterReset = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(afterReset.exceeded).toBe(false);
    expect(afterReset.counter.count).toBe(1);
  });

  it('different principals have independent counters', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 1 });
    const a = await engine.checkAndConsume(ORG, policy.id, 'principal-a');
    const b = await engine.checkAndConsume(ORG, policy.id, 'principal-b');
    expect(a.exceeded).toBe(false);
    expect(b.exceeded).toBe(false);
  });

  it('checkAndConsume() throws RateLimitPolicyNotFoundError for an unknown policy', async () => {
    const { engine } = setup();
    await expect(engine.checkAndConsume(ORG, 'missing', 'principal-1')).rejects.toBeInstanceOf(RateLimitPolicyNotFoundError);
  });

  it('getPolicy()/listPolicies() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getPolicy(ORG, 'missing')).toBeNull();
    const policy = await engine.createPolicy(ORG, { name: 'X', windowSeconds: 60, maxRequests: 1 });
    expect(await engine.getPolicy(ORG, policy.id)).toEqual(policy);
    expect(await engine.listPolicies(ORG)).toHaveLength(1);
  });
});

describe('RateLimitEngine — quota management', () => {
  it('createQuota() starts with 0 usedRequests', async () => {
    const { engine } = setup();
    const quota = await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 30, maxRequests: 1000 });
    expect(quota.usedRequests).toBe(0);
  });

  it('consumeQuota() increments usage', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const quota = await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 30, maxRequests: 1000 });
    const result = await engine.consumeQuota(ORG, quota.id);
    expect(result.quota.usedRequests).toBe(1);
    expect(result.exceeded).toBe(false);
  });

  it('consumeQuota() flags the request that exceeds the quota and publishes quota.exceeded', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine, eventBus } = setup(fixedNow);
    let seen: unknown;
    eventBus.subscribe('quota.exceeded', (payload) => (seen = payload));
    const quota = await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 30, maxRequests: 1 });
    await engine.consumeQuota(ORG, quota.id);
    const second = await engine.consumeQuota(ORG, quota.id);
    expect(second.exceeded).toBe(true);
    expect(seen).toEqual({ organizationId: ORG, quotaId: quota.id, principalId: 'principal-1' });
  });

  it('the quota resets once the period has elapsed', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const { engine } = setup(() => current);
    const quota = await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 1, maxRequests: 1 });
    await engine.consumeQuota(ORG, quota.id);
    const withinPeriod = await engine.consumeQuota(ORG, quota.id);
    expect(withinPeriod.exceeded).toBe(true);

    current = '2026-01-02T00:00:00.000Z';
    const afterReset = await engine.consumeQuota(ORG, quota.id);
    expect(afterReset.exceeded).toBe(false);
    expect(afterReset.quota.usedRequests).toBe(1);
  });

  it('consumeQuota() throws QuotaNotFoundError for an unknown quota', async () => {
    const { engine } = setup();
    await expect(engine.consumeQuota(ORG, 'missing')).rejects.toBeInstanceOf(QuotaNotFoundError);
  });

  it('listQuotasForPrincipal() returns only that principal’s quotas', async () => {
    const { engine } = setup();
    await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 30, maxRequests: 100 });
    await engine.createQuota(ORG, { principalId: 'principal-2', periodDays: 30, maxRequests: 100 });
    expect(await engine.listQuotasForPrincipal(ORG, 'principal-1')).toHaveLength(1);
  });

  it('getQuota() returns null for unknown id', async () => {
    const { engine } = setup();
    expect(await engine.getQuota(ORG, 'missing')).toBeNull();
  });

  it('rate limit policies are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createPolicy(ORG, { name: 'X', windowSeconds: 60, maxRequests: 1 });
    await engine.createPolicy('org-2', { name: 'X', windowSeconds: 60, maxRequests: 1 });
    expect(await engine.listPolicies(ORG)).toHaveLength(1);
    expect(await engine.listPolicies('org-2')).toHaveLength(1);
  });

  it('a policy with maxRequests: 0 exceeds on the very first request', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Blocked', windowSeconds: 60, maxRequests: 0 });
    const result = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(result.exceeded).toBe(true);
  });

  it('consumeQuota() after a period reset starts counting fresh from 1', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const { engine } = setup(() => current);
    const quota = await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 1, maxRequests: 10 });
    await engine.consumeQuota(ORG, quota.id);
    await engine.consumeQuota(ORG, quota.id);
    current = '2026-01-02T00:00:00.000Z';
    const afterReset = await engine.consumeQuota(ORG, quota.id);
    expect(afterReset.quota.usedRequests).toBe(1);
  });

  it('quotas are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createQuota(ORG, { principalId: 'principal-1', periodDays: 30, maxRequests: 100 });
    await engine.createQuota('org-2', { principalId: 'principal-1', periodDays: 30, maxRequests: 100 });
    expect(await engine.listQuotasForPrincipal(ORG, 'principal-1')).toHaveLength(1);
    expect(await engine.listQuotasForPrincipal('org-2', 'principal-1')).toHaveLength(1);
  });

  it('the rate limit window does not reset a single tick before it fully elapses', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const { engine } = setup(() => current);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 1 });
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    current = '2026-01-01T00:00:59.000Z';
    const stillWithinWindow = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(stillWithinWindow.exceeded).toBe(true);
  });

  it('checkAndConsume() reports remaining as maxRequests - 1 - 1 after two consecutive requests', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const { engine } = setup(fixedNow);
    const policy = await engine.createPolicy(ORG, { name: 'Standard', windowSeconds: 60, maxRequests: 5 });
    await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    const second = await engine.checkAndConsume(ORG, policy.id, 'principal-1');
    expect(second.remaining).toBe(3);
  });
});
