import { describe, expect, it, vi } from 'vitest';
import { createCampaignRepository } from '../src/campaign/repository.impl.js';
import { canTransitionCampaign, createCampaignLifecycle } from '../src/campaign/lifecycle.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { CampaignNotFoundError, InvalidCampaignTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createMarketingEventBus()) {
  const repository = createCampaignRepository();
  const lifecycle = createCampaignLifecycle(repository, eventBus);
  return { repository, lifecycle, eventBus };
}

describe('canTransitionCampaign', () => {
  it('allows the full happy-path lifecycle', () => {
    expect(canTransitionCampaign('draft', 'scheduled')).toBe(true);
    expect(canTransitionCampaign('draft', 'active')).toBe(true);
    expect(canTransitionCampaign('scheduled', 'active')).toBe(true);
    expect(canTransitionCampaign('active', 'paused')).toBe(true);
    expect(canTransitionCampaign('paused', 'active')).toBe(true);
    expect(canTransitionCampaign('active', 'completed')).toBe(true);
    expect(canTransitionCampaign('paused', 'completed')).toBe(true);
  });

  it('allows archiving from every non-archived status', () => {
    for (const status of ['draft', 'scheduled', 'active', 'paused', 'completed'] as const) {
      expect(canTransitionCampaign(status, 'archived')).toBe(true);
    }
  });

  it('forbids leaving archived and skipping straight to completed from draft', () => {
    expect(canTransitionCampaign('archived', 'draft')).toBe(false);
    expect(canTransitionCampaign('draft', 'completed')).toBe(false);
  });
});

describe('createCampaignLifecycle', () => {
  it('create() creates a draft campaign', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    expect(campaign.status).toBe('draft');
    expect(campaign.tags).toEqual([]);
  });

  it('supports all 9 deterministic campaign types', async () => {
    const { lifecycle } = setup();
    const types = ['email', 'social', 'sms', 'whatsapp', 'webinar', 'event', 'paid_ads', 'organic', 'referral'] as const;
    for (const campaignType of types) {
      const campaign = await lifecycle.create(ORG, { name: `Campaign ${campaignType}`, campaignType });
      expect(campaign.campaignType).toBe(campaignType);
    }
  });

  it('update() merges fields on a draft campaign', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    const updated = await lifecycle.update(ORG, campaign.id, { budget: '5000.00', currency: 'USD' });
    expect(updated.budget).toBe('5000.00');
    expect(updated.name).toBe('Spring Launch');
  });

  it('update() rejects an active campaign', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.launch(ORG, campaign.id);
    await expect(lifecycle.update(ORG, campaign.id, { name: 'X' })).rejects.toBeInstanceOf(InvalidCampaignTransitionError);
  });

  it('schedule() moves draft -> scheduled and stamps scheduledAt/endAt', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    const scheduled = await lifecycle.schedule(ORG, campaign.id, { scheduledAt: '2026-03-01T00:00:00.000Z', endAt: '2026-03-31T00:00:00.000Z' });
    expect(scheduled.status).toBe('scheduled');
    expect(scheduled.scheduledAt).toBe('2026-03-01T00:00:00.000Z');
    expect(scheduled.endAt).toBe('2026-03-31T00:00:00.000Z');
  });

  it('launch() moves draft -> active directly and stamps launchedAt', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    const launched = await lifecycle.launch(ORG, campaign.id);
    expect(launched.status).toBe('active');
    expect(launched.launchedAt).toBeDefined();
  });

  it('launch() moves scheduled -> active', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.schedule(ORG, campaign.id, { scheduledAt: '2026-03-01T00:00:00.000Z' });
    const launched = await lifecycle.launch(ORG, campaign.id);
    expect(launched.status).toBe('active');
  });

  it('pause() and resume() round-trip', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.launch(ORG, campaign.id);
    const paused = await lifecycle.pause(ORG, campaign.id);
    expect(paused.status).toBe('paused');
    expect(paused.pausedAt).toBeDefined();
    const resumed = await lifecycle.resume(ORG, campaign.id);
    expect(resumed.status).toBe('active');
  });

  it('complete() moves active -> completed and stamps completedAt', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.launch(ORG, campaign.id);
    const completed = await lifecycle.complete(ORG, campaign.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('complete() moves paused -> completed', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.launch(ORG, campaign.id);
    await lifecycle.pause(ORG, campaign.id);
    const completed = await lifecycle.complete(ORG, campaign.id);
    expect(completed.status).toBe('completed');
  });

  it('archive() is terminal from any non-archived status', async () => {
    const { lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    const archived = await lifecycle.archive(ORG, campaign.id);
    expect(archived.status).toBe('archived');
    await expect(lifecycle.archive(ORG, campaign.id)).rejects.toBeInstanceOf(InvalidCampaignTransitionError);
  });

  it('throws CampaignNotFoundError for an unknown campaign', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.launch(ORG, 'missing')).rejects.toBeInstanceOf(CampaignNotFoundError);
  });

  it('get() returns null for an unknown campaign', async () => {
    const { lifecycle } = setup();
    expect(await lifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('publishes campaign.created, campaign.launched, campaign.paused, and campaign.completed', async () => {
    const eventBus = createMarketingEventBus();
    const created = vi.fn();
    const launched = vi.fn();
    const paused = vi.fn();
    const completed = vi.fn();
    eventBus.subscribe('campaign.created', created);
    eventBus.subscribe('campaign.launched', launched);
    eventBus.subscribe('campaign.paused', paused);
    eventBus.subscribe('campaign.completed', completed);

    const { lifecycle } = setup(eventBus);
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    await lifecycle.launch(ORG, campaign.id);
    await lifecycle.pause(ORG, campaign.id);
    await lifecycle.resume(ORG, campaign.id);
    await lifecycle.complete(ORG, campaign.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(launched).toHaveBeenCalledTimes(1);
    expect(paused).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const campaign = await lifecycle.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    expect(await repository.findById('org-2', campaign.id)).toBeNull();
  });
});
