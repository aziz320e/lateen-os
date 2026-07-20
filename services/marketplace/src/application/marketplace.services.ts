import { randomUUID } from 'node:crypto';
import {
  parseExtensionManifest,
  type ExtensionManifest,
} from '@lateen-os/extension-system';
import type {
  ExtensionListing,
  InstallRequest,
  InstallResult,
  PublishRequest,
  PublishResult,
  Review,
  SearchFilters,
  SearchResult,
} from '../domain/types';
import type { MarketplaceRepositories } from '../domain/ports';

function mapCategory(type: ExtensionManifest['type']): ExtensionListing['category'] {
  const map: Record<string, ExtensionListing['category']> = {
    application: 'application',
    service: 'service',
    connector: 'connector',
    workflow: 'workflow',
    mission: 'mission',
    'ai-worker': 'ai-worker',
    'industry-pack': 'industry-pack',
    dashboard: 'dashboard',
    widget: 'widget',
    theme: 'theme',
    plugin: 'service',
  };
  return map[type] ?? 'application';
}

export class PublisherService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  listPublishers() {
    return this.repos.publishers.list();
  }

  getPublisher(id: string) {
    return this.repos.publishers.findById(id);
  }

  getPublisherBySlug(slug: string) {
    return this.repos.publishers.findBySlug(slug);
  }
}

export class ExtensionService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  listExtensions() {
    return this.repos.extensions.list();
  }

  async getExtension(id: string) {
    return this.repos.extensions.findById(id);
  }

  async getExtensionBySlug(extensionId: string) {
    return this.repos.extensions.findByExtensionId(extensionId);
  }
}

export class SearchService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  search(filters: SearchFilters): Promise<SearchResult> {
    return this.repos.extensions.search(filters);
  }
}

export class ReleaseService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  async listReleases(extensionId: string) {
    const listing = await this.repos.extensions.findByExtensionId(extensionId);
    if (!listing) return [];
    return this.repos.releases.listByExtension(listing.id);
  }

  async getLatestRelease(extensionId: string, channel?: Release['channel']) {
    const listing = await this.repos.extensions.findByExtensionId(extensionId);
    if (!listing) return null;
    return this.repos.releases.findLatest(listing.id, channel);
  }
}

type Release = import('../domain/types').Release;

export class PublishService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  async publish(input: PublishRequest): Promise<PublishResult> {
    const manifest = parseExtensionManifest(JSON.stringify(input.manifest));

    const publisher = await this.repos.publishers.findById(input.publisherId);
    if (!publisher) throw new Error(`Publisher not found: ${input.publisherId}`);

    let listing = await this.repos.extensions.findByExtensionId(manifest.id);
    if (!listing) {
      listing = await this.repos.extensions.create({
        extensionId: manifest.id,
        publisherId: publisher.id,
        manifest,
        category: mapCategory(manifest.type),
        extensionType: manifest.type,
        visibility: input.visibility ?? 'published',
        distribution: input.distribution ?? 'public',
        tags: [],
        documentation: manifest.homepage,
        screenshots: [],
        videos: [],
      });
    } else {
      listing = await this.repos.extensions.update(listing.id, {
        manifest,
        visibility: input.visibility ?? listing.visibility,
        distribution: input.distribution ?? listing.distribution,
      });
    }

    const release = await this.repos.releases.create({
      extensionId: listing.id,
      version: manifest.version,
      channel: input.channel ?? 'stable',
      manifest,
      packageUrl: input.packageUrl,
      releaseNotes: input.releaseNotes,
      permissions: manifest.permissions,
      dependencies: manifest.dependencies,
      compatibility: {
        engineVersion: manifest.engineVersion,
        sdkVersion: manifest.sdkVersion,
      },
      publishedAt: new Date().toISOString(),
    });

    if (input.license) {
      await this.repos.licenses.create({ ...input.license, releaseId: release.id });
    }

    return { extension: listing, release };
  }
}

export class InstallService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  async install(request: InstallRequest): Promise<InstallResult> {
    const listing = await this.repos.extensions.findByExtensionId(request.extensionId);
    if (!listing) throw new Error(`Extension not found: ${request.extensionId}`);

    const release =
      request.version
        ? await this.repos.releases.findByVersion(listing.id, request.version, request.channel ?? 'stable')
        : await this.repos.releases.findLatest(listing.id, request.channel ?? 'stable');

    if (!release) throw new Error(`No release found for ${request.extensionId}`);

    const resolvedDependencies = release.dependencies.map((d) => d.id);
    const permissionWarnings = release.permissions.filter(
      (p) => !(request.approvePermissions ?? []).includes(p),
    );

    const installation = await this.repos.installations.upsert({
      id: randomUUID(),
      extensionId: request.extensionId,
      organizationId: request.organizationId,
      version: release.version,
      channel: release.channel,
      status: permissionWarnings.length > 0 ? 'pending' : 'installed',
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { installation, release, resolvedDependencies, permissionWarnings };
  }
}

export class ReviewService {
  constructor(private readonly repos: MarketplaceRepositories) {}

  async listReviews(extensionId: string) {
    const listing = await this.repos.extensions.findByExtensionId(extensionId);
    if (!listing) return [];
    return this.repos.reviews.listByExtension(listing.id);
  }

  async createReview(
    extensionId: string,
    input: Omit<Review, 'id' | 'createdAt' | 'extensionId'>,
  ): Promise<Review> {
    const listing = await this.repos.extensions.findByExtensionId(extensionId);
    if (!listing) throw new Error(`Extension not found: ${extensionId}`);
    return this.repos.reviews.create({ ...input, extensionId: listing.id });
  }

  async getRatingSummary(extensionId: string) {
    const listing = await this.repos.extensions.findByExtensionId(extensionId);
    if (!listing) {
      return { extensionId, averageRating: 0, totalReviews: 0, distribution: {} };
    }
    return this.repos.reviews.getRatingSummary(listing.id);
  }
}
