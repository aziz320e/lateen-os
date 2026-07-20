import { parseExtensionManifest, type ExtensionManifest } from '@lateen-os/extension-system';
import type { ExtensionListing, Publisher, Release } from '../domain/types';

const now = new Date().toISOString();

export const SEED_PUBLISHERS: Omit<Publisher, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'lateen-os',
    displayName: 'Lateen OS',
    description: 'Official Lateen OS publisher',
    website: 'https://lateen.os',
    verification: 'verified',
    organizationId: '00000000-0000-4000-8000-000000000001',
    publicProfile: { logo: '/publishers/lateen-os.png' },
    developerProfile: { supportEmail: 'dev@lateen.os' },
  },
  {
    slug: 'community',
    displayName: 'Community Extensions',
    description: 'Community-contributed extensions',
    verification: 'verified',
    publicProfile: {},
    developerProfile: {},
  },
];

function manifest(
  partial: Pick<
    ExtensionManifest,
    'id' | 'name' | 'displayName' | 'version' | 'author' | 'license' | 'description' | 'type'
  > &
    Partial<ExtensionManifest>,
): ExtensionManifest {
  return parseExtensionManifest(JSON.stringify(partial));
}

export interface SeedExtension {
  publisherSlug: string;
  listing: Omit<ExtensionListing, 'id' | 'publisherId' | 'createdAt' | 'updatedAt'>;
  releases: Omit<Release, 'id' | 'extensionId'>[];
}

export const SEED_EXTENSIONS: SeedExtension[] = [
  {
    publisherSlug: 'lateen-os',
    listing: {
      extensionId: 'stripe-connector',
      manifest: manifest({
        id: 'stripe-connector',
        name: 'stripe-connector',
        displayName: 'Stripe Connector',
        version: '1.0.0',
        author: 'Lateen OS',
        license: 'MIT',
        description: 'Connect Stripe payments to Lateen OS',
        category: 'integration',
        type: 'connector',
        engineVersion: '1.0.0',
        sdkVersion: '1.0.0',
        permissions: ['integration:read', 'integration:write'],
        dependencies: [],
        connectors: ['stripe'],
      }),
      category: 'connector',
      extensionType: 'connector',
      visibility: 'published',
      distribution: 'public',
      tags: ['payments', 'stripe', 'connector'],
      capability: 'payments',
      documentation: 'https://docs.lateen.os/extensions/stripe-connector',
      screenshots: [],
      videos: [],
    },
    releases: [
      {
        version: '1.0.0',
        channel: 'stable',
        manifest: manifest({
          id: 'stripe-connector',
          name: 'stripe-connector',
          displayName: 'Stripe Connector',
          version: '1.0.0',
          author: 'Lateen OS',
          license: 'MIT',
          description: 'Connect Stripe payments to Lateen OS',
          category: 'integration',
          type: 'connector',
          engineVersion: '1.0.0',
          sdkVersion: '1.0.0',
          permissions: ['integration:read', 'integration:write'],
          dependencies: [],
          connectors: ['stripe'],
        }),
        releaseNotes: 'Initial stable release',
        permissions: ['integration:read', 'integration:write'],
        dependencies: [],
        compatibility: { engineVersion: '1.0.0', sdkVersion: '1.0.0' },
        publishedAt: now,
      },
    ],
  },
  {
    publisherSlug: 'lateen-os',
    listing: {
      extensionId: 'sales-dashboard',
      manifest: manifest({
        id: 'sales-dashboard',
        name: 'sales-dashboard',
        displayName: 'Sales Dashboard',
        version: '2.1.0',
        author: 'Lateen OS',
        license: 'MIT',
        description: 'Executive sales analytics dashboard widget pack',
        category: 'analytics',
        type: 'dashboard',
        engineVersion: '1.0.0',
        sdkVersion: '1.0.0',
        permissions: ['analytics:read'],
        dependencies: [],
        widgets: ['revenue-chart', 'pipeline-funnel'],
      }),
      category: 'dashboard',
      extensionType: 'dashboard',
      visibility: 'published',
      distribution: 'public',
      tags: ['analytics', 'sales', 'dashboard'],
      industry: 'retail',
      documentation: 'https://docs.lateen.os/extensions/sales-dashboard',
      screenshots: ['/extensions/sales-dashboard/preview.png'],
      videos: [],
    },
    releases: [
      {
        version: '2.1.0',
        channel: 'stable',
        manifest: manifest({
          id: 'sales-dashboard',
          name: 'sales-dashboard',
          displayName: 'Sales Dashboard',
          version: '2.1.0',
          author: 'Lateen OS',
          license: 'MIT',
          description: 'Executive sales analytics dashboard widget pack',
          category: 'analytics',
          type: 'dashboard',
          engineVersion: '1.0.0',
          sdkVersion: '1.0.0',
          permissions: ['analytics:read'],
          dependencies: [],
          widgets: ['revenue-chart', 'pipeline-funnel'],
        }),
        releaseNotes: 'Added pipeline funnel widget',
        permissions: ['analytics:read'],
        dependencies: [],
        compatibility: { engineVersion: '1.0.0', sdkVersion: '1.0.0' },
        publishedAt: now,
      },
    ],
  },
  {
    publisherSlug: 'community',
    listing: {
      extensionId: 'inventory-ai-worker',
      manifest: manifest({
        id: 'inventory-ai-worker',
        name: 'inventory-ai-worker',
        displayName: 'Inventory AI Worker',
        version: '0.9.0',
        author: 'Community',
        license: 'Apache-2.0',
        description: 'AI worker for inventory forecasting and reorder suggestions',
        category: 'ai',
        type: 'ai-worker',
        engineVersion: '1.0.0',
        sdkVersion: '1.0.0',
        permissions: ['ai:invoke', 'inventory:read'],
        dependencies: [],
        workers: ['inventory-forecast'],
      }),
      category: 'ai-worker',
      extensionType: 'ai-worker',
      visibility: 'published',
      distribution: 'public',
      tags: ['ai', 'inventory', 'forecasting'],
      industry: 'retail',
      capability: 'inventory-forecast',
      documentation: 'https://community.lateen.os/inventory-ai-worker',
      screenshots: [],
      videos: [],
    },
    releases: [
      {
        version: '0.9.0',
        channel: 'beta',
        manifest: manifest({
          id: 'inventory-ai-worker',
          name: 'inventory-ai-worker',
          displayName: 'Inventory AI Worker',
          version: '0.9.0',
          author: 'Community',
          license: 'Apache-2.0',
          description: 'AI worker for inventory forecasting and reorder suggestions',
          category: 'ai',
          type: 'ai-worker',
          engineVersion: '1.0.0',
          sdkVersion: '1.0.0',
          permissions: ['ai:invoke', 'inventory:read'],
          dependencies: [],
          workers: ['inventory-forecast'],
        }),
        releaseNotes: 'Beta release with forecasting worker',
        permissions: ['ai:invoke', 'inventory:read'],
        dependencies: [],
        compatibility: { engineVersion: '1.0.0', sdkVersion: '1.0.0' },
        publishedAt: now,
      },
    ],
  },
];
