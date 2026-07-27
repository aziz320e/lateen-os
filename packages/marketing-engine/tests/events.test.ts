import { describe, expect, it, vi } from 'vitest';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { MARKETING_EVENT_NAMES } from '../src/events/marketing-events.js';
import { createMarketingRuntime } from '../src/runtime.js';

describe('MARKETING_EVENT_NAMES', () => {
  it('declares exactly the 9 required event names', () => {
    expect(Object.values(MARKETING_EVENT_NAMES).sort()).toEqual(
      [
        'campaign.created',
        'campaign.launched',
        'campaign.paused',
        'campaign.completed',
        'lead.generated',
        'lead.scored',
        'content.created',
        'workflow.requested',
        'metrics.updated',
      ].sort(),
    );
  });
});

describe('createMarketingEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createMarketingEventBus();
    const campaignCreated = vi.fn();
    const leadGenerated = vi.fn();
    eventBus.subscribe('campaign.created', campaignCreated);
    eventBus.subscribe('lead.generated', leadGenerated);

    eventBus.publish('campaign.created', { campaignId: 'campaign-1', organizationId: 'org-1', name: 'Spring Launch' });

    expect(campaignCreated).toHaveBeenCalledTimes(1);
    expect(leadGenerated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createMarketingRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createMarketingRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(MARKETING_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';
    const campaign = await runtime.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await runtime.campaigns.launch(ORG, campaign.id);
    await runtime.campaigns.pause(ORG, campaign.id);
    await runtime.campaigns.complete(ORG, campaign.id);

    const lead = await runtime.leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    await runtime.leadScoring.scoreLead(ORG, lead.id);

    await runtime.content.createContent(ORG, { title: 'Template', contentType: 'template' });
    await runtime.workflows.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: campaign.id });
    await runtime.metrics.recordMetrics(ORG, campaign.id, { impressions: 100 });
    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(MARKETING_EVENT_NAMES)));
  });
});
