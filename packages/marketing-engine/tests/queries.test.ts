import { describe, expect, it } from 'vitest';
import { createMarketingRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createMarketingRuntime();

  const campaignA = await runtime.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
  await runtime.campaigns.launch(ORG, campaignA.id);
  const campaignB = await runtime.campaigns.create(ORG, { name: 'Referral Push', campaignType: 'referral' });

  const audienceA = await runtime.audiences.createAudience(ORG, { name: 'VIP', audienceType: 'static', staticMemberIds: ['customer-1'] });

  const templateA = await runtime.content.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
  const assetA = await runtime.content.createContent(ORG, { title: 'Spring Banner', contentType: 'asset', campaignId: campaignA.id });

  const leadA = await runtime.leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound', campaignId: campaignA.id });
  await runtime.leadScoring.scoreLead(ORG, leadA.id);

  await runtime.metrics.recordMetrics(ORG, campaignA.id, { impressions: 1000, conversions: 10, cost: '100.00' });

  const calendarA = await runtime.calendar.scheduleEntry(ORG, { title: 'Spring Window', campaignId: campaignA.id, startAt: '2026-03-01T00:00:00.000Z' });

  return { runtime, campaignA, campaignB, audienceA, templateA, assetA, leadA, calendarA };
}

describe('createMarketingQueries via createMarketingRuntime', () => {
  it('findCampaigns() filters by status', async () => {
    const { runtime, campaignA } = await seed();
    const result = await runtime.queries.findCampaigns({ organizationId: ORG, status: 'active' });
    expect(result.campaigns.map((c) => c.id)).toEqual([campaignA.id]);
  });

  it('findCampaigns() filters by campaignType', async () => {
    const { runtime, campaignB } = await seed();
    const result = await runtime.queries.findCampaigns({ organizationId: ORG, campaignType: 'referral' });
    expect(result.campaigns.map((c) => c.id)).toEqual([campaignB.id]);
  });

  it('findCampaigns() paginates via offset/limit while total reflects the full match set', async () => {
    const runtime = createMarketingRuntime();
    await runtime.campaigns.create(ORG, { name: 'A', campaignType: 'email' });
    await runtime.campaigns.create(ORG, { name: 'B', campaignType: 'email' });
    await runtime.campaigns.create(ORG, { name: 'C', campaignType: 'email' });
    const page = await runtime.queries.findCampaigns({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.campaigns).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findAudiences() filters by audienceType', async () => {
    const { runtime, audienceA } = await seed();
    const result = await runtime.queries.findAudiences({ organizationId: ORG, audienceType: 'static' });
    expect(result.audiences.map((a) => a.id)).toEqual([audienceA.id]);
  });

  it('findAssets() returns only asset-like content, excluding templates', async () => {
    const { runtime, assetA, templateA } = await seed();
    const result = await runtime.queries.findAssets({ organizationId: ORG });
    const ids = result.assets.map((a) => a.id);
    expect(ids).toContain(assetA.id);
    expect(ids).not.toContain(templateA.id);
  });

  it('findAssets() filters by campaignId', async () => {
    const { runtime, campaignA, assetA } = await seed();
    const result = await runtime.queries.findAssets({ organizationId: ORG, campaignId: campaignA.id });
    expect(result.assets.map((a) => a.id)).toEqual([assetA.id]);
  });

  it('findContent() returns every content item including templates', async () => {
    const { runtime, templateA, assetA } = await seed();
    const result = await runtime.queries.findContent({ organizationId: ORG });
    const ids = result.content.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining([templateA.id, assetA.id]));
  });

  it('findContent() filters by contentType', async () => {
    const { runtime, templateA } = await seed();
    const result = await runtime.queries.findContent({ organizationId: ORG, contentType: 'template' });
    expect(result.content.map((c) => c.id)).toEqual([templateA.id]);
  });

  it('findLeads() filters by campaignId and minScore', async () => {
    const { runtime, campaignA, leadA } = await seed();
    const result = await runtime.queries.findLeads({ organizationId: ORG, campaignId: campaignA.id, minScore: 0 });
    expect(result.leads.map((l) => l.id)).toEqual([leadA.id]);
  });

  it('findLeads() filters by source', async () => {
    const { runtime, leadA } = await seed();
    const result = await runtime.queries.findLeads({ organizationId: ORG, source: 'inbound' });
    expect(result.leads.map((l) => l.id)).toEqual([leadA.id]);
  });

  it('findMetrics() returns the snapshot for one campaign', async () => {
    const { runtime, campaignA } = await seed();
    const result = await runtime.queries.findMetrics({ organizationId: ORG, campaignId: campaignA.id });
    expect(result.total).toBe(1);
    expect(result.metrics[0]?.cpl).toBe('10.00');
  });

  it('findMetrics() returns nothing for a campaign with no recorded metrics', async () => {
    const { runtime, campaignB } = await seed();
    const result = await runtime.queries.findMetrics({ organizationId: ORG, campaignId: campaignB.id });
    expect(result.total).toBe(0);
  });

  it('findCalendar() filters by campaignId and sorts by start time', async () => {
    const { runtime, campaignA, calendarA } = await seed();
    const result = await runtime.queries.findCalendar({ organizationId: ORG, campaignId: campaignA.id });
    expect(result.entries.map((e) => e.id)).toEqual([calendarA.id]);
  });

  it('searchMarketing() ranks an exact match above a substring match', async () => {
    const runtime = createMarketingRuntime();
    await runtime.campaigns.create(ORG, { name: 'Spring', campaignType: 'email' });
    await runtime.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    const result = await runtime.queries.searchMarketing({ organizationId: ORG, keyword: 'Spring' });
    expect(result.matches[0]?.label).toBe('Spring');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchMarketing() searches across campaigns and content', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchMarketing({ organizationId: ORG, keyword: 'Spring' });
    const recordTypes = new Set(result.matches.map((match) => match.recordType));
    expect(recordTypes.has('campaign')).toBe(true);
    expect(recordTypes.has('content')).toBe(true);
  });

  it('searchMarketing() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchMarketing({ organizationId: ORG, keyword: 'Nonexistent' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findCampaigns({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
