import { randomUUID } from 'node:crypto';
import type {
  ExtensionListing,
  InstallResult,
  License,
  Publisher,
  RatingSummary,
  Release,
  Review,
  SearchFilters,
  SearchResult,
} from '../domain/types';
import type {
  ExtensionRepositoryPort,
  InstallationRepositoryPort,
  LicenseRepositoryPort,
  MarketplaceRepositories,
  PublisherRepositoryPort,
  ReleaseRepositoryPort,
  ReviewRepositoryPort,
} from '../domain/ports';
import { SEED_EXTENSIONS, SEED_PUBLISHERS } from '../catalog/seed-catalog';

function isoNow(): string {
  return new Date().toISOString();
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function buildFacets(extensions: ExtensionListing[]): SearchResult['facets'] {
  const categories: Record<string, number> = {};
  const tags: Record<string, number> = {};
  const publishers: Record<string, number> = {};

  for (const ext of extensions) {
    categories[ext.category] = (categories[ext.category] ?? 0) + 1;
    for (const tag of ext.tags) {
      tags[tag] = (tags[tag] ?? 0) + 1;
    }
    publishers[ext.publisherId] = (publishers[ext.publisherId] ?? 0) + 1;
  }

  return { categories, tags, publishers };
}

export class InMemoryPublisherRepository implements PublisherRepositoryPort {
  private readonly items = new Map<string, Publisher>();

  constructor(seed = true) {
    if (seed) {
      for (const publisher of SEED_PUBLISHERS) {
        const id = randomUUID();
        this.items.set(id, { ...publisher, id, createdAt: isoNow(), updatedAt: isoNow() });
      }
    }
  }

  async list(): Promise<Publisher[]> {
    return [...this.items.values()];
  }

  async findById(id: string): Promise<Publisher | null> {
    return this.items.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Publisher | null> {
    return this.findBySlugSync(slug);
  }

  findBySlugSync(slug: string): Publisher | null {
    return [...this.items.values()].find((p) => p.slug === slug) ?? null;
  }

  async create(publisher: Omit<Publisher, 'id' | 'createdAt' | 'updatedAt'>): Promise<Publisher> {
    const id = randomUUID();
    const record: Publisher = { ...publisher, id, createdAt: isoNow(), updatedAt: isoNow() };
    this.items.set(id, record);
    return record;
  }
}

export class InMemoryExtensionRepository implements ExtensionRepositoryPort {
  private readonly items = new Map<string, ExtensionListing>();

  constructor(
    private readonly publishers: InMemoryPublisherRepository,
    seed = true,
  ) {
    if (seed) {
      this.seed();
    }
  }

  private seed(): void {
    for (const entry of SEED_EXTENSIONS) {
      const publisher = this.publishers.findBySlugSync(entry.publisherSlug);
      if (!publisher) continue;
      const id = randomUUID();
      this.items.set(id, {
        ...entry.listing,
        id,
        publisherId: publisher.id,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      });
    }
  }

  listSync(): ExtensionListing[] {
    return [...this.items.values()];
  }

  async list(): Promise<ExtensionListing[]> {
    return this.listSync();
  }

  async findById(id: string): Promise<ExtensionListing | null> {
    return this.items.get(id) ?? null;
  }

  async findByExtensionId(extensionId: string): Promise<ExtensionListing | null> {
    return [...this.items.values()].find((e) => e.extensionId === extensionId) ?? null;
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    let extensions = [...this.items.values()].filter((e) => e.visibility === 'published');

    if (filters.query) {
      extensions = extensions.filter(
        (e) =>
          matchesQuery(e.manifest.displayName, filters.query!) ||
          matchesQuery(e.manifest.description, filters.query!) ||
          e.tags.some((t) => matchesQuery(t, filters.query!)),
      );
    }
    if (filters.category) extensions = extensions.filter((e) => e.category === filters.category);
    if (filters.industry) extensions = extensions.filter((e) => e.industry === filters.industry);
    if (filters.capability) extensions = extensions.filter((e) => e.capability === filters.capability);
    if (filters.connector) extensions = extensions.filter((e) => e.extensionType === 'connector');
    if (filters.aiWorker) extensions = extensions.filter((e) => e.extensionType === 'ai-worker');
    if (filters.tags?.length) {
      extensions = extensions.filter((e) => filters.tags!.every((t) => e.tags.includes(t)));
    }
    if (filters.publisher) {
      const publisher = await this.publishers.findBySlug(filters.publisher);
      if (publisher) extensions = extensions.filter((e) => e.publisherId === publisher.id);
    }
    if (filters.visibility) extensions = extensions.filter((e) => e.distribution === filters.visibility);

    return { extensions, total: extensions.length, facets: buildFacets(extensions) };
  }

  async create(listing: Omit<ExtensionListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExtensionListing> {
    const id = randomUUID();
    const record: ExtensionListing = { ...listing, id, createdAt: isoNow(), updatedAt: isoNow() };
    this.items.set(id, record);
    return record;
  }

  async update(id: string, patch: Partial<ExtensionListing>): Promise<ExtensionListing> {
    const existing = this.items.get(id);
    if (!existing) throw new Error(`Extension not found: ${id}`);
    const updated = { ...existing, ...patch, updatedAt: isoNow() };
    this.items.set(id, updated);
    return updated;
  }
}

export class InMemoryReleaseRepository implements ReleaseRepositoryPort {
  private readonly items = new Map<string, Release>();

  constructor(
    private readonly extensions: InMemoryExtensionRepository,
    seed = true,
  ) {
    if (seed) {
      this.seed();
    }
  }

  private seed(): void {
    const listings = this.extensions.listSync();
    for (const entry of SEED_EXTENSIONS) {
      const listing = listings.find((l) => l.extensionId === entry.listing.extensionId);
      if (!listing) continue;
      for (const release of entry.releases) {
        const id = randomUUID();
        this.items.set(id, { ...release, id, extensionId: listing.id });
      }
    }
  }

  async listByExtension(extensionDbId: string): Promise<Release[]> {
    return [...this.items.values()].filter((r) => r.extensionId === extensionDbId);
  }

  async findLatest(extensionDbId: string, channel: Release['channel'] = 'stable'): Promise<Release | null> {
    const releases = (await this.listByExtension(extensionDbId)).filter((r) => r.channel === channel && !r.archivedAt);
    return releases.sort((a, b) => (a.version < b.version ? 1 : -1))[0] ?? null;
  }

  async findByVersion(
    extensionDbId: string,
    version: string,
    channel: Release['channel'] = 'stable',
  ): Promise<Release | null> {
    return (
      [...this.items.values()].find(
        (r) => r.extensionId === extensionDbId && r.version === version && r.channel === channel,
      ) ?? null
    );
  }

  async create(release: Omit<Release, 'id'>): Promise<Release> {
    const id = randomUUID();
    const record: Release = { ...release, id };
    this.items.set(id, record);
    return record;
  }
}

export class InMemoryReviewRepository implements ReviewRepositoryPort {
  private readonly items = new Map<string, Review>();

  async listByExtension(extensionDbId: string): Promise<Review[]> {
    return [...this.items.values()].filter((r) => r.extensionId === extensionDbId);
  }

  async create(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = randomUUID();
    const record: Review = { ...review, id, createdAt: isoNow() };
    this.items.set(id, record);
    return record;
  }

  async getRatingSummary(extensionDbId: string): Promise<RatingSummary> {
    const reviews = await this.listByExtension(extensionDbId);
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      distribution[review.rating] = (distribution[review.rating] ?? 0) + 1;
    }
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    return { extensionId: extensionDbId, averageRating, totalReviews, distribution };
  }
}

export class InMemoryInstallationRepository implements InstallationRepositoryPort {
  private readonly items = new Map<string, InstallResult['installation']>();

  private key(extensionId: string, organizationId: string): string {
    return `${extensionId}:${organizationId}`;
  }

  async find(extensionId: string, organizationId: string): Promise<InstallResult['installation'] | null> {
    return this.items.get(this.key(extensionId, organizationId)) ?? null;
  }

  async upsert(installation: InstallResult['installation']): Promise<InstallResult['installation']> {
    this.items.set(this.key(installation.extensionId, installation.organizationId), installation);
    return installation;
  }
}

export class InMemoryLicenseRepository implements LicenseRepositoryPort {
  private readonly items = new Map<string, License>();

  async findByRelease(releaseId: string): Promise<License | null> {
    return [...this.items.values()].find((l) => l.releaseId === releaseId) ?? null;
  }

  async create(license: Omit<License, 'id'>): Promise<License> {
    const id = randomUUID();
    const record: License = { ...license, id };
    this.items.set(id, record);
    return record;
  }
}

export function createInMemoryRepositories(seed = true): MarketplaceRepositories {
  const publishers = new InMemoryPublisherRepository(seed);
  const extensions = new InMemoryExtensionRepository(publishers, seed);
  const releases = new InMemoryReleaseRepository(extensions, seed);
  return {
    publishers,
    extensions,
    releases,
    reviews: new InMemoryReviewRepository(),
    installations: new InMemoryInstallationRepository(),
    licenses: new InMemoryLicenseRepository(),
  };
}
