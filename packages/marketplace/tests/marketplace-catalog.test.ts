import { describe, expect, it } from 'vitest';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { computeRunningAverage, createMarketplaceCatalogEngine } from '../src/marketplace-catalog/engine.impl.js';
import { createCatalogEntryRepository } from '../src/marketplace-catalog/repository.impl.js';
import { CatalogEntryNotFoundError, InvalidRatingError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createMarketplaceEventBus();
  const engine = createMarketplaceCatalogEngine(createCatalogEntryRepository(), eventBus);
  return { engine, eventBus };
}

describe('computeRunningAverage (pure)', () => {
  it('the first rating becomes the average', () => {
    expect(computeRunningAverage(0, 0, 5)).toBe(5);
  });

  it('averages two ratings correctly', () => {
    expect(computeRunningAverage(4, 1, 2)).toBe(3);
  });

  it('rounds to 2 decimal places', () => {
    expect(computeRunningAverage(5, 1, 4)).toBe(4.5);
    expect(computeRunningAverage(5, 2, 4)).toBeCloseTo(4.67, 2);
  });
});

describe('MarketplaceCatalogEngine', () => {
  it('publishToCatalog() starts at 0 rating and 0 downloads', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    expect(entry.ratingAverage).toBe(0);
    expect(entry.ratingCount).toBe(0);
    expect(entry.downloadCount).toBe(0);
  });

  it('publishes catalog.updated on publishToCatalog', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('catalog.updated', (payload) => (seen = payload));
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    expect(seen).toEqual({ organizationId: ORG, catalogEntryId: entry.id });
  });

  it('recordRating() updates the running average and increments ratingCount', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    const first = await engine.recordRating(ORG, entry.id, 4);
    expect(first.ratingAverage).toBe(4);
    expect(first.ratingCount).toBe(1);
    const second = await engine.recordRating(ORG, entry.id, 2);
    expect(second.ratingAverage).toBe(3);
    expect(second.ratingCount).toBe(2);
  });

  it('recordRating() throws InvalidRatingError for a score below 1', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await expect(engine.recordRating(ORG, entry.id, 0)).rejects.toBeInstanceOf(InvalidRatingError);
  });

  it('recordRating() throws InvalidRatingError for a score above 5', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await expect(engine.recordRating(ORG, entry.id, 6)).rejects.toBeInstanceOf(InvalidRatingError);
  });

  it('recordRating() accepts every score in the valid 1-5 range', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    for (const score of [1, 2, 3, 4, 5]) {
      await expect(engine.recordRating(ORG, entry.id, score)).resolves.toBeTruthy();
    }
  });

  it('recordRating() throws CatalogEntryNotFoundError for an unknown entry', async () => {
    const { engine } = setup();
    await expect(engine.recordRating(ORG, 'missing', 5)).rejects.toBeInstanceOf(CatalogEntryNotFoundError);
  });

  it('recordDownload() increments downloadCount', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    const first = await engine.recordDownload(ORG, entry.id);
    expect(first.downloadCount).toBe(1);
    const second = await engine.recordDownload(ORG, entry.id);
    expect(second.downloadCount).toBe(2);
  });

  it('recordDownload() throws CatalogEntryNotFoundError for an unknown entry', async () => {
    const { engine } = setup();
    await expect(engine.recordDownload(ORG, 'missing')).rejects.toBeInstanceOf(CatalogEntryNotFoundError);
  });

  it('getCatalogEntry()/listCatalog() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getCatalogEntry(ORG, 'missing')).toBeNull();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    expect(await engine.getCatalogEntry(ORG, entry.id)).toEqual(entry);
    expect(await engine.listCatalog(ORG)).toHaveLength(1);
  });

  it('findByCategory() filters by category', async () => {
    const { engine } = setup();
    await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.other', name: 'Other', category: 'analytics', publisher: 'Acme' });
    expect(await engine.findByCategory(ORG, 'productivity')).toHaveLength(1);
  });

  it('findByPublisher() filters by publisher', async () => {
    const { engine } = setup();
    await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.publishToCatalog(ORG, { extensionKey: 'com.other.widget', name: 'Widget 2', category: 'productivity', publisher: 'Other Co' });
    expect(await engine.findByPublisher(ORG, 'Acme')).toHaveLength(1);
  });

  it('catalog entries are isolated per organization', async () => {
    const { engine } = setup();
    await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.publishToCatalog('org-2', { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    expect(await engine.listCatalog(ORG)).toHaveLength(1);
    expect(await engine.listCatalog('org-2')).toHaveLength(1);
  });

  it('publishes catalog.updated on both recordRating and recordDownload', async () => {
    const { engine, eventBus } = setup();
    let count = 0;
    eventBus.subscribe('catalog.updated', () => (count += 1));
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.recordRating(ORG, entry.id, 5);
    await engine.recordDownload(ORG, entry.id);
    expect(count).toBe(3);
  });

  it('recordRating() and recordDownload() do not affect each other’s counters', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.recordRating(ORG, entry.id, 5);
    const afterRating = await engine.recordDownload(ORG, entry.id);
    expect(afterRating.ratingCount).toBe(1);
    expect(afterRating.downloadCount).toBe(1);
  });

  it('findByCategory() returns an empty array for a category with no entries', async () => {
    const { engine } = setup();
    expect(await engine.findByCategory(ORG, 'never-used')).toEqual([]);
  });

  it('findByPublisher() returns an empty array for a publisher with no entries', async () => {
    const { engine } = setup();
    expect(await engine.findByPublisher(ORG, 'never-published')).toEqual([]);
  });

  it('three ratings average correctly with rounding', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Widget', category: 'productivity', publisher: 'Acme' });
    await engine.recordRating(ORG, entry.id, 5);
    await engine.recordRating(ORG, entry.id, 4);
    const third = await engine.recordRating(ORG, entry.id, 3);
    expect(third.ratingAverage).toBe(4);
    expect(third.ratingCount).toBe(3);
  });

  it('getCatalogEntry() returns null for an entry id from a different organization', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    expect(await engine.getCatalogEntry('org-2', entry.id)).toBeNull();
  });

  it('publishToCatalog() persists category and publisher verbatim', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'developer-tools', publisher: 'Acme Labs' });
    expect(entry.category).toBe('developer-tools');
    expect(entry.publisher).toBe('Acme Labs');
  });

  it('multiple catalog entries can be listed together', async () => {
    const { engine } = setup();
    await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await engine.publishToCatalog(ORG, { extensionKey: 'b', name: 'B', category: 'productivity', publisher: 'Acme' });
    expect(await engine.listCatalog(ORG)).toHaveLength(2);
  });

  it('recordRating() is isolated per organization', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await expect(engine.recordRating('org-2', entry.id, 5)).rejects.toBeInstanceOf(CatalogEntryNotFoundError);
  });

  it('recordDownload() is isolated per organization', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await expect(engine.recordDownload('org-2', entry.id)).rejects.toBeInstanceOf(CatalogEntryNotFoundError);
  });

  it('computeRunningAverage handles a boundary score of 1 correctly', () => {
    expect(computeRunningAverage(0, 0, 1)).toBe(1);
  });

  it('computeRunningAverage handles a boundary score of 5 correctly', () => {
    expect(computeRunningAverage(0, 0, 5)).toBe(5);
  });

  it('findByCategory() and findByPublisher() are both isolated per organization', async () => {
    const { engine } = setup();
    await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    expect(await engine.findByCategory('org-2', 'productivity')).toEqual([]);
    expect(await engine.findByPublisher('org-2', 'Acme')).toEqual([]);
  });

  it('a catalog entry’s extensionKey is preserved verbatim, distinct from its display name', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'com.acme.widget', name: 'Acme Widget Pro', category: 'productivity', publisher: 'Acme' });
    expect(entry.extensionKey).toBe('com.acme.widget');
    expect(entry.name).toBe('Acme Widget Pro');
  });

  it('five ratings average correctly across a mixed set of scores', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    for (const score of [5, 5, 5, 1, 1]) {
      await engine.recordRating(ORG, entry.id, score);
    }
    const final = await engine.getCatalogEntry(ORG, entry.id);
    expect(final?.ratingAverage).toBe(3.4);
    expect(final?.ratingCount).toBe(5);
  });

  it('downloadCount and ratingCount both start and remain 0 until acted upon independently', async () => {
    const { engine } = setup();
    const entry = await engine.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await engine.recordDownload(ORG, entry.id);
    const final = await engine.getCatalogEntry(ORG, entry.id);
    expect(final?.downloadCount).toBe(1);
    expect(final?.ratingCount).toBe(0);
  });
});
