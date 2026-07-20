/** Marketplace domain contracts — distribution platform only, no business logic. */
import type { ExtensionManifest } from '@lateen-os/extension-system';

export type ReleaseChannel = 'stable' | 'beta' | 'alpha' | 'nightly';
export type DistributionVisibility = 'public' | 'private' | 'enterprise';
export type LicenseType = 'free' | 'commercial' | 'trial' | 'enterprise' | 'subscription' | 'seat-based';
export type ExtensionVisibility = 'published' | 'unpublished' | 'archived';
export type PublisherVerificationStatus = 'unverified' | 'pending' | 'verified';

export type MarketplaceExtensionCategory =
  | 'application'
  | 'service'
  | 'connector'
  | 'workflow'
  | 'mission'
  | 'ai-worker'
  | 'industry-pack'
  | 'dashboard'
  | 'widget'
  | 'theme';

export interface Publisher {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  website?: string;
  verification: PublisherVerificationStatus;
  organizationId?: string;
  publicProfile: Record<string, unknown>;
  developerProfile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ExtensionListing {
  id: string;
  extensionId: string;
  publisherId: string;
  manifest: ExtensionManifest;
  category: MarketplaceExtensionCategory;
  extensionType: ExtensionManifest['type'];
  visibility: ExtensionVisibility;
  distribution: DistributionVisibility;
  tags: string[];
  industry?: string;
  capability?: string;
  documentation?: string;
  screenshots: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  extensionId: string;
  version: string;
  channel: ReleaseChannel;
  manifest: ExtensionManifest;
  packageUrl?: string;
  checksum?: string;
  releaseNotes?: string;
  permissions: string[];
  dependencies: ExtensionManifest['dependencies'];
  compatibility: CompatibilityInfo;
  publishedAt: string;
  archivedAt?: string;
}

export interface CompatibilityInfo {
  engineVersion: string;
  sdkVersion: string;
  minPlatformVersion?: string;
  maxPlatformVersion?: string;
}

export interface License {
  id: string;
  releaseId: string;
  type: LicenseType;
  priceCents: number;
  currency: string;
  trialDays?: number;
  seatLimit?: number;
  metadata: Record<string, unknown>;
}

export interface Review {
  id: string;
  extensionId: string;
  releaseId?: string;
  organizationId: string;
  authorId: string;
  rating: number;
  comment?: string;
  verifiedInstall: boolean;
  createdAt: string;
}

export interface Download {
  id: string;
  extensionId: string;
  releaseId: string;
  organizationId?: string;
  downloadedAt: string;
}

export interface Installation {
  id: string;
  extensionId: string;
  organizationId: string;
  version: string;
  channel: ReleaseChannel;
  status: 'installed' | 'pending' | 'failed' | 'rolled-back';
  installedAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  query?: string;
  category?: MarketplaceExtensionCategory;
  tags?: string[];
  publisher?: string;
  industry?: string;
  capability?: string;
  connector?: string;
  aiWorker?: boolean;
  channel?: ReleaseChannel;
  visibility?: DistributionVisibility;
}

export interface SearchResult {
  extensions: ExtensionListing[];
  total: number;
  facets: {
    categories: Record<string, number>;
    tags: Record<string, number>;
    publishers: Record<string, number>;
  };
}

export interface InstallRequest {
  extensionId: string;
  organizationId: string;
  version?: string;
  channel?: ReleaseChannel;
  approvePermissions?: string[];
}

export interface InstallResult {
  installation: Installation;
  release: Release;
  resolvedDependencies: string[];
  permissionWarnings: string[];
}

export interface PublishRequest {
  publisherId: string;
  manifest: ExtensionManifest;
  channel?: ReleaseChannel;
  visibility?: ExtensionVisibility;
  distribution?: DistributionVisibility;
  releaseNotes?: string;
  packageUrl?: string;
  license?: Omit<License, 'id' | 'releaseId'>;
}

export interface PublishResult {
  extension: ExtensionListing;
  release: Release;
}

export interface RatingSummary {
  extensionId: string;
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}
