import { describe, expect, it, vi } from 'vitest';
import { createContentRepository } from '../src/content/repository.impl.js';
import { createContentLibrary } from '../src/content/library.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { ContentItemNotFoundError, InvalidContentTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createMarketingEventBus()) {
  const repository = createContentRepository();
  const library = createContentLibrary(repository, eventBus);
  return { repository, library, eventBus };
}

describe('createContentLibrary', () => {
  it('createContent() creates a draft item', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    expect(item.status).toBe('draft');
  });

  it('supports all 4 deterministic content types', async () => {
    const { library } = setup();
    const types = ['template', 'asset', 'landing_page', 'media_reference'] as const;
    for (const contentType of types) {
      const item = await library.createContent(ORG, { title: `Item ${contentType}`, contentType });
      expect(item.contentType).toBe(contentType);
    }
  });

  it('updateContent() merges fields on a draft item', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    const updated = await library.updateContent(ORG, item.id, { body: 'Updated body' });
    expect(updated.body).toBe('Updated body');
  });

  it('updateContent() rejects a published item', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    await library.publishContent(ORG, item.id);
    await expect(library.updateContent(ORG, item.id, { title: 'X' })).rejects.toBeInstanceOf(InvalidContentTransitionError);
  });

  it('publishContent() moves draft -> published', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    const published = await library.publishContent(ORG, item.id);
    expect(published.status).toBe('published');
  });

  it('publishContent() rejects an already-published item', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    await library.publishContent(ORG, item.id);
    await expect(library.publishContent(ORG, item.id)).rejects.toBeInstanceOf(InvalidContentTransitionError);
  });

  it('archiveContent() is terminal', async () => {
    const { library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    const archived = await library.archiveContent(ORG, item.id);
    expect(archived.status).toBe('archived');
    await expect(library.archiveContent(ORG, item.id)).rejects.toBeInstanceOf(InvalidContentTransitionError);
  });

  it('throws ContentItemNotFoundError for an unknown item', async () => {
    const { library } = setup();
    await expect(library.publishContent(ORG, 'missing')).rejects.toBeInstanceOf(ContentItemNotFoundError);
  });

  it('getContent() returns null for an unknown item', async () => {
    const { library } = setup();
    expect(await library.getContent(ORG, 'missing')).toBeNull();
  });

  it('listByCampaign() returns every item linked to a campaign', async () => {
    const { library } = setup();
    await library.createContent(ORG, { title: 'Asset A', contentType: 'asset', campaignId: 'campaign-1' });
    await library.createContent(ORG, { title: 'Asset B', contentType: 'asset', campaignId: 'campaign-1' });
    await library.createContent(ORG, { title: 'Asset C', contentType: 'asset', campaignId: 'campaign-2' });

    const items = await library.listByCampaign(ORG, 'campaign-1');
    expect(items).toHaveLength(2);
  });

  it('publishes content.created', async () => {
    const eventBus = createMarketingEventBus();
    const created = vi.fn();
    eventBus.subscribe('content.created', created);
    const { library } = setup(eventBus);
    await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    await Promise.resolve();
    expect(created).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, library } = setup();
    const item = await library.createContent(ORG, { title: 'Spring Email Template', contentType: 'template' });
    expect(await repository.findById('org-2', item.id)).toBeNull();
  });
});
