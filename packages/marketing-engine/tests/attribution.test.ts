import { describe, expect, it } from 'vitest';
import { createTouchpointRepository } from '../src/attribution/repository.impl.js';
import { computeAttribution, createAttributionEngine } from '../src/attribution/engine.impl.js';
import type { Touchpoint } from '../src/attribution/types.js';

const ORG = 'org-1';

function touchpoint(campaignId: string, occurredAt: string): Touchpoint {
  return { id: `tp-${campaignId}-${occurredAt}`, organizationId: ORG, leadId: 'lead-1', campaignId, occurredAt, createdAt: occurredAt };
}

describe('computeAttribution (pure)', () => {
  it('returns no credits for an empty touchpoint list', () => {
    expect(computeAttribution([], 'linear')).toEqual([]);
  });

  it('first_touch credits the earliest campaign fully, regardless of input order', () => {
    const touchpoints = [touchpoint('b', '2026-01-02T00:00:00.000Z'), touchpoint('a', '2026-01-01T00:00:00.000Z')];
    expect(computeAttribution(touchpoints, 'first_touch')).toEqual([{ campaignId: 'a', weight: 1 }]);
  });

  it('last_touch credits the latest campaign fully, regardless of input order', () => {
    const touchpoints = [touchpoint('b', '2026-01-02T00:00:00.000Z'), touchpoint('a', '2026-01-01T00:00:00.000Z')];
    expect(computeAttribution(touchpoints, 'last_touch')).toEqual([{ campaignId: 'b', weight: 1 }]);
  });

  it('linear splits credit evenly across every touchpoint', () => {
    const touchpoints = [
      touchpoint('a', '2026-01-01T00:00:00.000Z'),
      touchpoint('b', '2026-01-02T00:00:00.000Z'),
      touchpoint('c', '2026-01-03T00:00:00.000Z'),
    ];
    const credits = computeAttribution(touchpoints, 'linear');
    expect(credits).toEqual([
      { campaignId: 'a', weight: 0.3333 },
      { campaignId: 'b', weight: 0.3333 },
      { campaignId: 'c', weight: 0.3333 },
    ]);
  });

  it('linear sums credit for a campaign touched more than once', () => {
    const touchpoints = [
      touchpoint('a', '2026-01-01T00:00:00.000Z'),
      touchpoint('a', '2026-01-02T00:00:00.000Z'),
      touchpoint('b', '2026-01-03T00:00:00.000Z'),
    ];
    const credits = computeAttribution(touchpoints, 'linear');
    const total = credits.reduce((sum, credit) => sum + credit.weight, 0);
    expect(total).toBeCloseTo(1, 4);
    expect(credits.find((c) => c.campaignId === 'a')?.weight).toBeCloseTo(2 / 3, 4);
  });
});

function setup() {
  const repository = createTouchpointRepository();
  const engine = createAttributionEngine(repository);
  return { repository, engine };
}

describe('createAttributionEngine', () => {
  it('recordTouchpoint() stores a real touchpoint', async () => {
    const { engine } = setup();
    const touchpoint = await engine.recordTouchpoint(ORG, 'lead-1', 'campaign-1');
    expect(touchpoint.leadId).toBe('lead-1');
    expect(touchpoint.campaignId).toBe('campaign-1');
  });

  it('recordTouchpoint() honors an explicit occurredAt', async () => {
    const { engine } = setup();
    const touchpoint = await engine.recordTouchpoint(ORG, 'lead-1', 'campaign-1', '2020-01-01T00:00:00.000Z');
    expect(touchpoint.occurredAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('computeAttributionForLead() attributes across every recorded touchpoint', async () => {
    const { engine } = setup();
    await engine.recordTouchpoint(ORG, 'lead-1', 'campaign-a', '2026-01-01T00:00:00.000Z');
    await engine.recordTouchpoint(ORG, 'lead-1', 'campaign-b', '2026-01-02T00:00:00.000Z');

    const credits = await engine.computeAttributionForLead(ORG, 'lead-1', 'first_touch');
    expect(credits).toEqual([{ campaignId: 'campaign-a', weight: 1 }]);
  });

  it('computeAttributionForLead() returns no credits for a lead with no touchpoints', async () => {
    const { engine } = setup();
    expect(await engine.computeAttributionForLead(ORG, 'missing-lead', 'linear')).toEqual([]);
  });

  it('is organization-scoped', async () => {
    const { engine } = setup();
    await engine.recordTouchpoint(ORG, 'lead-1', 'campaign-a');
    expect(await engine.computeAttributionForLead('org-2', 'lead-1', 'first_touch')).toEqual([]);
  });
});
