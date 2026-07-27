import { describe, expect, it } from 'vitest';
import { createSalesRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createSalesRuntime();

  const oppA = await runtime.opportunities.create(ORG, { name: 'Acme Corp — Annual Contract', amount: '5000.00', customerId: 'customer-1' });
  await runtime.opportunities.qualify(ORG, oppA.id);
  const oppB = await runtime.opportunities.create(ORG, { name: 'Globex — Pilot', amount: '1000.00' });
  await runtime.opportunities.closeLost(ORG, oppB.id);

  const quoteA = await runtime.quotes.createQuote(ORG, {
    title: 'Acme Corp — Signage Quote',
    opportunityId: oppA.id,
    currency: 'USD',
    lineItems: [{ description: 'Sign', quantity: '1', unitPrice: '5000.00' }],
  });

  const forecastA = await runtime.forecast.generateForecast(ORG);

  const activityA = await runtime.activities.log(ORG, { activityType: 'call', subject: 'Kickoff', relatedTo: { entityType: 'opportunity', entityId: oppA.id } });

  const taskA = await runtime.tasks.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: oppA.id });

  return { runtime, oppA, oppB, quoteA, forecastA, activityA, taskA };
}

describe('createSalesQueries via createSalesRuntime', () => {
  it('findOpportunities() filters by stage', async () => {
    const { runtime, oppA } = await seed();
    const result = await runtime.queries.findOpportunities({ organizationId: ORG, stage: 'qualified' });
    expect(result.opportunities.map((opportunity) => opportunity.id)).toEqual([oppA.id]);
  });

  it('findOpportunities() filters by customerId', async () => {
    const { runtime, oppA } = await seed();
    const result = await runtime.queries.findOpportunities({ organizationId: ORG, customerId: 'customer-1' });
    expect(result.opportunities.map((opportunity) => opportunity.id)).toEqual([oppA.id]);
  });

  it('findOpportunities() paginates via offset/limit while total reflects the full match set', async () => {
    const runtime = createSalesRuntime();
    await runtime.opportunities.create(ORG, { name: 'A' });
    await runtime.opportunities.create(ORG, { name: 'B' });
    await runtime.opportunities.create(ORG, { name: 'C' });
    const page = await runtime.queries.findOpportunities({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.opportunities).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findQuotes() filters by opportunityId', async () => {
    const { runtime, oppA, quoteA } = await seed();
    const result = await runtime.queries.findQuotes({ organizationId: ORG, opportunityId: oppA.id });
    expect(result.quotes.map((quote) => quote.id)).toEqual([quoteA.id]);
  });

  it('findForecasts() returns every generated snapshot', async () => {
    const { runtime, forecastA } = await seed();
    const result = await runtime.queries.findForecasts({ organizationId: ORG });
    expect(result.forecasts.map((forecast) => forecast.id)).toContain(forecastA.id);
  });

  it('findPipeline() groups every opportunity by stage, including empty stages', async () => {
    const { runtime, oppA, oppB } = await seed();
    const result = await runtime.queries.findPipeline({ organizationId: ORG });
    expect(Object.keys(result.groupedByStage).sort()).toEqual(
      ['new', 'discovery', 'qualified', 'proposal', 'negotiation', 'verbal_commit', 'won', 'lost'].sort(),
    );
    expect(result.groupedByStage.qualified.map((opportunity) => opportunity.id)).toEqual([oppA.id]);
    expect(result.groupedByStage.lost.map((opportunity) => opportunity.id)).toEqual([oppB.id]);
    expect(result.groupedByStage.won).toEqual([]);
    expect(result.total).toBe(2);
  });

  it('findActivities() filters by related entity and returns most recent first', async () => {
    const { runtime, oppA, activityA } = await seed();
    await runtime.activities.log(ORG, {
      activityType: 'email',
      subject: 'Follow up',
      relatedTo: { entityType: 'opportunity', entityId: oppA.id },
      occurredAt: '2099-01-01T00:00:00.000Z',
    });

    const result = await runtime.queries.findActivities({ organizationId: ORG, relatedEntityType: 'opportunity', relatedEntityId: oppA.id });
    expect(result.total).toBe(2);
    expect(result.activities[0]?.subject).toBe('Follow up');
    expect(result.activities.map((activity) => activity.id)).toContain(activityA.id);
  });

  it('findActivities() filters by activityType', async () => {
    const { runtime, oppA } = await seed();
    await runtime.activities.log(ORG, { activityType: 'demo', subject: 'Product demo', relatedTo: { entityType: 'opportunity', entityId: oppA.id } });
    const result = await runtime.queries.findActivities({ organizationId: ORG, activityType: 'demo' });
    expect(result.total).toBe(1);
    expect(result.activities[0]?.subject).toBe('Product demo');
  });

  it('findTasks() filters by opportunityId and taskType', async () => {
    const { runtime, oppA, taskA } = await seed();
    const result = await runtime.queries.findTasks({ organizationId: ORG, opportunityId: oppA.id, taskType: 'proposal_approval' });
    expect(result.tasks.map((task) => task.id)).toEqual([taskA.id]);
  });

  it('findTasks() filters by status', async () => {
    const { runtime, taskA } = await seed();
    await runtime.tasks.completeTask(ORG, taskA.id, { approved: true });
    const result = await runtime.queries.findTasks({ organizationId: ORG, status: 'completed' });
    expect(result.tasks.map((task) => task.id)).toEqual([taskA.id]);
  });

  it('searchSales() ranks an exact match above a substring match', async () => {
    const runtime = createSalesRuntime();
    await runtime.opportunities.create(ORG, { name: 'Acme' });
    await runtime.opportunities.create(ORG, { name: 'Acme Corp' });

    const result = await runtime.queries.searchSales({ organizationId: ORG, keyword: 'Acme' });
    expect(result.matches[0]?.label).toBe('Acme');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchSales() searches across opportunities and quotes', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchSales({ organizationId: ORG, keyword: 'Acme' });
    const recordTypes = new Set(result.matches.map((match) => match.recordType));
    expect(recordTypes.has('opportunity')).toBe(true);
    expect(recordTypes.has('quote')).toBe(true);
  });

  it('searchSales() respects an explicit limit', async () => {
    const runtime = createSalesRuntime();
    await runtime.opportunities.create(ORG, { name: 'Acme One' });
    await runtime.opportunities.create(ORG, { name: 'Acme Two' });
    const result = await runtime.queries.searchSales({ organizationId: ORG, keyword: 'Acme', limit: 1 });
    expect(result.matches).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('searchSales() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchSales({ organizationId: ORG, keyword: 'Nonexistent' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findOpportunities({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
