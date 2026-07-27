import { describe, expect, it } from 'vitest';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createMarketingAnalyticsRepository } from '../src/marketing-analytics/repository.impl.js';
import { average, createMarketingAnalyticsEngine } from '../src/marketing-analytics/engine.impl.js';

const ORG = 'org-1';

describe('average (pure)', () => {
  it('computes the arithmetic mean', () => {
    expect(average([10, 20, 30])).toBe(20);
  });

  it('returns 0 for an empty array', () => {
    expect(average([])).toBe(0);
  });
});

function setup() {
  const repository = createMarketingAnalyticsRepository();
  return { repository };
}

describe('createMarketingAnalyticsEngine — fully offline (no Marketing Engine injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.cpl).toBe(0);
    expect(snapshot.cac).toBe(0);
    expect(snapshot.roi).toBe(0);
    expect(snapshot.leadSourceEffectiveness).toEqual({});
  });
});

describe('createMarketingAnalyticsEngine — with a real Marketing Engine', () => {
  async function seedCampaign() {
    const marketing = createMarketingRuntime();
    const campaign = await marketing.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await marketing.metrics.recordMetrics(ORG, campaign.id, {
      impressions: 1000,
      clicks: 100,
      conversions: 10,
      customersAcquired: 5,
      cost: '500',
      revenue: '1500',
    });

    const lead = await marketing.leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'referral', campaignId: campaign.id });
    await marketing.leadScoring.scoreLead(ORG, lead.id);

    return { marketing, campaign };
  }

  it('aggregates real per-campaign CPL/CAC/ROI', async () => {
    const { marketing } = await seedCampaign();
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, { marketing });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.cpl).toBe(50);
    expect(snapshot.cac).toBe(100);
    expect(snapshot.roi).toBe(200);
  });

  it('computes campaign effectiveness keyed by campaign id', async () => {
    const { marketing, campaign } = await seedCampaign();
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, { marketing });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.campaignEffectiveness[campaign.id]).toBe(200);
  });

  it('computes an attribution summary from real conversion counts', async () => {
    const { marketing, campaign } = await seedCampaign();
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, { marketing });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.attributionSummary[campaign.id]).toBe(10);
  });

  it('computes lead source effectiveness from real, scored leads', async () => {
    const { marketing } = await seedCampaign();
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, { marketing });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.leadSourceEffectiveness.referral).toBeGreaterThan(0);
  });
});

describe('createMarketingAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createMarketingAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
