import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { computeHealthScore, computeHealthTier, createCustomerHealthEngine } from '../src/health/engine.impl.js';
import { createHealthSnapshotRepository } from '../src/health/repository.impl.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createCustomerHealthEngine(createHealthSnapshotRepository(), eventBus);
  return { engine, eventBus };
}

const FULL_HEALTH_COMPONENTS = { usageScore: 100, communicationScore: 100, projectScore: 100, paymentScore: 100, engagementScore: 100, renewalScore: 100 };

describe('computeHealthScore (pure)', () => {
  it('averages all six equally-weighted components', () => {
    expect(computeHealthScore(FULL_HEALTH_COMPONENTS)).toBe(100);
    expect(computeHealthScore({ usageScore: 0, communicationScore: 0, projectScore: 0, paymentScore: 0, engagementScore: 0, renewalScore: 0 })).toBe(0);
  });

  it('rounds to the nearest whole point', () => {
    expect(computeHealthScore({ usageScore: 100, communicationScore: 0, projectScore: 0, paymentScore: 0, engagementScore: 0, renewalScore: 0 })).toBe(17);
  });
});

describe('computeHealthTier (pure)', () => {
  it('bands scores deterministically', () => {
    expect(computeHealthTier(100)).toBe('healthy');
    expect(computeHealthTier(75)).toBe('healthy');
    expect(computeHealthTier(74)).toBe('neutral');
    expect(computeHealthTier(50)).toBe('neutral');
    expect(computeHealthTier(49)).toBe('at_risk');
    expect(computeHealthTier(25)).toBe('at_risk');
    expect(computeHealthTier(24)).toBe('critical');
    expect(computeHealthTier(0)).toBe('critical');
  });
});

describe('CustomerHealthEngine', () => {
  it('recordSnapshot() computes overallScore and tier', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    expect(snapshot.overallScore).toBe(100);
    expect(snapshot.tier).toBe('healthy');
  });

  it('publishes customer.health.updated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('customer.health.updated', (payload) => (seen = payload));
    const snapshot = await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    expect(seen).toEqual({ organizationId: ORG, healthSnapshotId: snapshot.id, customerId: 'customer-1', overallScore: 100, tier: 'healthy' });
  });

  it('a critical-health customer computes the critical tier', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 5,
      communicationScore: 5,
      projectScore: 5,
      paymentScore: 5,
      engagementScore: 5,
      renewalScore: 5,
    });
    expect(snapshot.tier).toBe('critical');
  });

  it('getLatest() returns the most recently recorded snapshot', async () => {
    const { engine } = setup();
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', usageScore: 50, communicationScore: 50, projectScore: 50, paymentScore: 50, engagementScore: 50, renewalScore: 50 });
    const second = await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    const latest = await engine.getLatest(ORG, 'customer-1');
    expect(latest?.id).toBe(second.id);
  });

  it('getLatest() returns null when no snapshot exists for the customer', async () => {
    const { engine } = setup();
    expect(await engine.getLatest(ORG, 'unknown-customer')).toBeNull();
  });

  it('findByCustomer() returns every snapshot recorded for a customer', async () => {
    const { engine } = setup();
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    await engine.recordSnapshot(ORG, { customerId: 'customer-2', ...FULL_HEALTH_COMPONENTS });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const snapshot = await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    expect(await engine.get(ORG, snapshot.id)).toEqual(snapshot);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('snapshots are isolated per organization', async () => {
    const { engine } = setup();
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    await engine.recordSnapshot('org-2', { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a neutral-health customer computes the neutral tier', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 60,
      communicationScore: 60,
      projectScore: 60,
      paymentScore: 60,
      engagementScore: 60,
      renewalScore: 60,
    });
    expect(snapshot.tier).toBe('neutral');
  });

  it('an at-risk customer computes the at_risk tier', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 30,
      communicationScore: 30,
      projectScore: 30,
      paymentScore: 30,
      engagementScore: 30,
      renewalScore: 30,
    });
    expect(snapshot.tier).toBe('at_risk');
  });

  it('recordSnapshot() preserves every individual component score on the snapshot', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 90,
      communicationScore: 80,
      projectScore: 70,
      paymentScore: 60,
      engagementScore: 50,
      renewalScore: 40,
    });
    expect(snapshot.usageScore).toBe(90);
    expect(snapshot.communicationScore).toBe(80);
    expect(snapshot.projectScore).toBe(70);
    expect(snapshot.paymentScore).toBe(60);
    expect(snapshot.engagementScore).toBe(50);
    expect(snapshot.renewalScore).toBe(40);
  });

  it('boundary score 75 exactly is healthy, not neutral', () => {
    expect(computeHealthTier(75)).toBe('healthy');
  });

  it('boundary score 50 exactly is neutral, not at_risk', () => {
    expect(computeHealthTier(50)).toBe('neutral');
  });

  it('boundary score 25 exactly is at_risk, not critical', () => {
    expect(computeHealthTier(25)).toBe('at_risk');
  });

  it('computeHealthScore handles mixed component scores deterministically', () => {
    expect(computeHealthScore({ usageScore: 100, communicationScore: 100, projectScore: 0, paymentScore: 0, engagementScore: 0, renewalScore: 0 })).toBe(33);
  });

  it('findByCustomer() returns an empty list for a customer with no snapshots', async () => {
    const { engine } = setup();
    expect(await engine.findByCustomer(ORG, 'unknown-customer')).toEqual([]);
  });

  it('list() returns an empty array for an organization with no snapshots', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('multiple customers can each have independent health histories', async () => {
    const { engine } = setup();
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    await engine.recordSnapshot(ORG, { customerId: 'customer-2', usageScore: 10, communicationScore: 10, projectScore: 10, paymentScore: 10, engagementScore: 10, renewalScore: 10 });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(1);
    expect(await engine.findByCustomer(ORG, 'customer-2')).toHaveLength(1);
  });

  it('getLatest() picks the more recently inserted snapshot when timestamps tie', async () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const engine = createCustomerHealthEngine(createHealthSnapshotRepository(), undefined, fixedNow);
    await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    const second = await engine.recordSnapshot(ORG, { customerId: 'customer-1', usageScore: 10, communicationScore: 10, projectScore: 10, paymentScore: 10, engagementScore: 10, renewalScore: 10 });
    const latest = await engine.getLatest(ORG, 'customer-1');
    expect(latest?.id).toBe(second.id);
  });

  it('health snapshots accept an injected clock for deterministic createdAt', async () => {
    const fixedNow = () => '2026-05-01T00:00:00.000Z';
    const engine = createCustomerHealthEngine(createHealthSnapshotRepository(), undefined, fixedNow);
    const snapshot = await engine.recordSnapshot(ORG, { customerId: 'customer-1', ...FULL_HEALTH_COMPONENTS });
    expect(snapshot.createdAt).toBe('2026-05-01T00:00:00.000Z');
  });

  it('recordSnapshot() with a real skewed profile (strong usage, weak payment) computes correctly', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 95,
      communicationScore: 85,
      projectScore: 90,
      paymentScore: 10,
      engagementScore: 80,
      renewalScore: 75,
    });
    expect(snapshot.overallScore).toBe(73);
    expect(snapshot.tier).toBe('neutral');
  });

  it('recordSnapshot() with all zero scores computes overallScore 0 and tier critical', async () => {
    const { engine } = setup();
    const snapshot = await engine.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 0,
      communicationScore: 0,
      projectScore: 0,
      paymentScore: 0,
      engagementScore: 0,
      renewalScore: 0,
    });
    expect(snapshot.overallScore).toBe(0);
    expect(snapshot.tier).toBe('critical');
  });
});
