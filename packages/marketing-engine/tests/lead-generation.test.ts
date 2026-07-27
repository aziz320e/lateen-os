import { describe, expect, it, vi } from 'vitest';
import { createMarketingLeadRepository } from '../src/lead-generation/repository.impl.js';
import { createLeadGenerationService } from '../src/lead-generation/service.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { MarketingLeadNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createMarketingEventBus()) {
  const repository = createMarketingLeadRepository();
  const service = createLeadGenerationService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createLeadGenerationService', () => {
  it('generateLead() captures a lead with a new status', async () => {
    const { service } = setup();
    const lead = await service.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    expect(lead.status).toBe('new');
    expect(lead.tags).toEqual([]);
  });

  it('supports all 5 deterministic lead sources', async () => {
    const { service } = setup();
    const sources = ['inbound', 'outbound', 'referral', 'event', 'manual_import'] as const;
    for (const source of sources) {
      const lead = await service.generateLead(ORG, { name: `Lead ${source}`, source });
      expect(lead.source).toBe(source);
    }
  });

  it('generateLead() attributes a lead to a campaign', async () => {
    const { service } = setup();
    const lead = await service.generateLead(ORG, { name: 'Jordan Lee', source: 'referral', campaignId: 'campaign-1' });
    expect(lead.campaignId).toBe('campaign-1');
  });

  it('archiveLead() sets status archived', async () => {
    const { service } = setup();
    const lead = await service.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    const archived = await service.archiveLead(ORG, lead.id);
    expect(archived.status).toBe('archived');
  });

  it('throws MarketingLeadNotFoundError for an unknown lead', async () => {
    const { service } = setup();
    await expect(service.archiveLead(ORG, 'missing')).rejects.toBeInstanceOf(MarketingLeadNotFoundError);
  });

  it('get() returns null for an unknown lead', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByCampaign() returns every lead attributed to a campaign', async () => {
    const { service } = setup();
    await service.generateLead(ORG, { name: 'A', source: 'inbound', campaignId: 'campaign-1' });
    await service.generateLead(ORG, { name: 'B', source: 'outbound', campaignId: 'campaign-1' });
    await service.generateLead(ORG, { name: 'C', source: 'event', campaignId: 'campaign-2' });

    const leads = await service.listByCampaign(ORG, 'campaign-1');
    expect(leads).toHaveLength(2);
  });

  it('publishes lead.generated', async () => {
    const eventBus = createMarketingEventBus();
    const generated = vi.fn();
    eventBus.subscribe('lead.generated', generated);
    const { service } = setup(eventBus);
    await service.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    await Promise.resolve();
    expect(generated).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const lead = await service.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    expect(await repository.findById('org-2', lead.id)).toBeNull();
  });
});
