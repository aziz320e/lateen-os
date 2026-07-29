/**
 * Real Marketplace Catalog — categories, publishers, ratings, and
 * download counts. Metadata only, deterministic aggregation, never a
 * recommendation or ranking model.
 *
 * @module marketplace-catalog/engine.impl
 */
import type { MarketplaceEventBus } from '../events/marketplace-event-bus.js';
import { CatalogEntryNotFoundError, InvalidRatingError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CatalogEntryId, OrganizationId } from '../shared/identifiers.js';
import type { CatalogEntryRepository } from './repository.js';
import type { CatalogEntry } from './types.js';

/** Deterministic running mean: the new average after adding `newScore` to `currentCount` prior ratings, rounded to 2 decimal places. */
export function computeRunningAverage(currentAverage: number, currentCount: number, newScore: number): number {
  const total = currentAverage * currentCount + newScore;
  return Math.round((total / (currentCount + 1)) * 100) / 100;
}

export interface PublishToCatalogInput {
  readonly extensionKey: string;
  readonly name: string;
  readonly category: string;
  readonly publisher: string;
}

export interface MarketplaceCatalogEngine {
  publishToCatalog(organizationId: OrganizationId, input: PublishToCatalogInput): Promise<CatalogEntry>;
  recordRating(organizationId: OrganizationId, catalogEntryId: CatalogEntryId, score: number): Promise<CatalogEntry>;
  recordDownload(organizationId: OrganizationId, catalogEntryId: CatalogEntryId): Promise<CatalogEntry>;
  getCatalogEntry(organizationId: OrganizationId, catalogEntryId: CatalogEntryId): Promise<CatalogEntry | null>;
  findByCategory(organizationId: OrganizationId, category: string): Promise<readonly CatalogEntry[]>;
  findByPublisher(organizationId: OrganizationId, publisher: string): Promise<readonly CatalogEntry[]>;
  listCatalog(organizationId: OrganizationId): Promise<readonly CatalogEntry[]>;
}

/** Creates a real {@link MarketplaceCatalogEngine}. */
export function createMarketplaceCatalogEngine(repository: CatalogEntryRepository, eventBus?: MarketplaceEventBus, now: () => string = nowIso): MarketplaceCatalogEngine {
  async function requireEntry(organizationId: OrganizationId, catalogEntryId: CatalogEntryId): Promise<CatalogEntry> {
    const entry = await repository.findById(organizationId, catalogEntryId);
    if (!entry) throw new CatalogEntryNotFoundError(catalogEntryId);
    return entry;
  }

  return {
    async publishToCatalog(organizationId, input) {
      const timestamp = now();
      const entry: CatalogEntry = {
        id: generateId('marketplace-catalog'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        extensionKey: input.extensionKey,
        name: input.name,
        category: input.category,
        publisher: input.publisher,
        ratingAverage: 0,
        ratingCount: 0,
        downloadCount: 0,
      };
      await repository.save(entry);
      eventBus?.publish('catalog.updated', { organizationId, catalogEntryId: entry.id });
      return entry;
    },

    async recordRating(organizationId, catalogEntryId, score) {
      if (score < 1 || score > 5) throw new InvalidRatingError(score);
      const entry = await requireEntry(organizationId, catalogEntryId);
      const updated: CatalogEntry = {
        ...entry,
        ratingAverage: computeRunningAverage(entry.ratingAverage, entry.ratingCount, score),
        ratingCount: entry.ratingCount + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('catalog.updated', { organizationId, catalogEntryId: updated.id });
      return updated;
    },

    async recordDownload(organizationId, catalogEntryId) {
      const entry = await requireEntry(organizationId, catalogEntryId);
      const updated: CatalogEntry = { ...entry, downloadCount: entry.downloadCount + 1, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('catalog.updated', { organizationId, catalogEntryId: updated.id });
      return updated;
    },

    async getCatalogEntry(organizationId, catalogEntryId) {
      return repository.findById(organizationId, catalogEntryId);
    },

    async findByCategory(organizationId, category) {
      return repository.findByCategory(organizationId, category);
    },

    async findByPublisher(organizationId, publisher) {
      return repository.findByPublisher(organizationId, publisher);
    },

    async listCatalog(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
