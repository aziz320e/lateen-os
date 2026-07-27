import { describe, expect, it } from 'vitest';
import { createMarketingRuntime } from '../src/runtime.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';

describe('createMarketingRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createMarketingRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      [
        'campaigns',
        'audiences',
        'leadGeneration',
        'leadScoring',
        'content',
        'calendar',
        'attribution',
        'metrics',
        'workflows',
        'relationships',
        'queries',
        'events',
      ].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createMarketingEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createMarketingRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const campaign = await runtime.campaigns.create('org-1', { name: 'Spring Launch', campaignType: 'email' });
    expect(campaign.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createMarketingRuntime();
    const campaign = await runtime.campaigns.create('org-1', { name: 'Spring Launch', campaignType: 'email' });
    const context = await runtime.relationships.getCustomerContext('org-1', 'customer-1');
    expect(context).toBeNull();
    const request = await runtime.workflows.generateRequest('org-1', { requestType: 'follow_up', campaignId: campaign.id });
    expect(request.workflowInstanceId).toBeUndefined();
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createMarketingRuntime();
    const runtimeB = createMarketingRuntime();
    await runtimeA.campaigns.create('org-1', { name: 'Spring Launch', campaignType: 'email' });

    const result = await runtimeB.queries.findCampaigns({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('lead scoring and lead generation share the same underlying lead data', async () => {
    const runtime = createMarketingRuntime();
    const lead = await runtime.leadGeneration.generateLead('org-1', { name: 'Jordan Lee', source: 'referral', engagementScore: 50 });
    const scored = await runtime.leadScoring.scoreLead('org-1', lead.id);
    const fetched = await runtime.leadGeneration.get('org-1', lead.id);
    expect(fetched?.score).toBe(scored.score);
  });
});
