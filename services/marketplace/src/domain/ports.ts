import type {
  ExtensionListing,
  InstallResult,
  License,
  PublishRequest,
  Publisher,
  RatingSummary,
  Release,
  Review,
  SearchFilters,
  SearchResult,
} from './types';

export interface PublisherRepositoryPort {
  list(): Promise<Publisher[]>;
  findById(id: string): Promise<Publisher | null>;
  findBySlug(slug: string): Promise<Publisher | null>;
  create(publisher: Omit<Publisher, 'id' | 'createdAt' | 'updatedAt'>): Promise<Publisher>;
}

export interface ExtensionRepositoryPort {
  list(): Promise<ExtensionListing[]>;
  findById(id: string): Promise<ExtensionListing | null>;
  findByExtensionId(extensionId: string): Promise<ExtensionListing | null>;
  search(filters: SearchFilters): Promise<SearchResult>;
  create(listing: Omit<ExtensionListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExtensionListing>;
  update(id: string, patch: Partial<ExtensionListing>): Promise<ExtensionListing>;
}

export interface ReleaseRepositoryPort {
  listByExtension(extensionId: string): Promise<Release[]>;
  findLatest(extensionId: string, channel?: Release['channel']): Promise<Release | null>;
  findByVersion(extensionId: string, version: string, channel?: Release['channel']): Promise<Release | null>;
  create(release: Omit<Release, 'id'>): Promise<Release>;
}

export interface ReviewRepositoryPort {
  listByExtension(extensionId: string): Promise<Review[]>;
  create(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review>;
  getRatingSummary(extensionId: string): Promise<RatingSummary>;
}

export interface InstallationRepositoryPort {
  find(extensionId: string, organizationId: string): Promise<InstallResult['installation'] | null>;
  upsert(installation: InstallResult['installation']): Promise<InstallResult['installation']>;
}

export interface LicenseRepositoryPort {
  findByRelease(releaseId: string): Promise<License | null>;
  create(license: Omit<License, 'id'>): Promise<License>;
}

export interface MarketplaceRepositories {
  publishers: PublisherRepositoryPort;
  extensions: ExtensionRepositoryPort;
  releases: ReleaseRepositoryPort;
  reviews: ReviewRepositoryPort;
  installations: InstallationRepositoryPort;
  licenses: LicenseRepositoryPort;
}

export interface PublishInput extends PublishRequest {}
