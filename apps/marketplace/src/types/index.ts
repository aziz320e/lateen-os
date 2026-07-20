import type { ExtensionManifest } from '@lateen-os/extension-system';

export interface ExtensionListing {
  id: string;
  extensionId: string;
  publisherId: string;
  manifest: ExtensionManifest;
  category: string;
  extensionType: string;
  visibility: string;
  distribution: string;
  tags: string[];
  industry?: string;
  capability?: string;
  documentation?: string;
  screenshots: string[];
  videos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Publisher {
  id: string;
  slug: string;
  displayName: string;
  description?: string;
  website?: string;
  verification: string;
}

export interface Release {
  id: string;
  extensionId: string;
  version: string;
  channel: string;
  manifest: ExtensionManifest;
  releaseNotes?: string;
  permissions: string[];
  dependencies: ExtensionManifest['dependencies'];
  publishedAt: string;
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

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  verifiedInstall: boolean;
  createdAt: string;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}
