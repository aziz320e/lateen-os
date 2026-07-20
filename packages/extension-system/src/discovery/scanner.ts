/** @module discovery/scanner */
import fg from 'fast-glob';
import { join } from 'node:path';
import { loadExtensionManifest } from '../manifest/parser.js';
import { EXTENSION_MANIFEST_FILENAME, type ExtensionManifest } from '../manifest/types.js';

export interface DiscoveredExtension {
  readonly manifest: ExtensionManifest;
  readonly path: string;
  readonly source: 'extensions' | 'packages' | 'apps' | 'services' | 'marketplace';
}

export interface DiscoveryOptions {
  readonly workspaceRoot: string;
  readonly includeMarketplaceCache?: boolean;
}

const DISCOVERY_PATTERNS = {
  extensions: 'extensions/*/extension.json',
  packages: 'packages/*/extension.json',
  apps: 'apps/*/extension.json',
  services: 'services/*/extension.json',
  marketplace: '.lateen/marketplace/*/extension.json',
} as const;

export class ExtensionDiscovery {
  async discover(options: DiscoveryOptions): Promise<readonly DiscoveredExtension[]> {
    const root = options.workspaceRoot;
    const patterns: Array<{ source: DiscoveredExtension['source']; pattern: string }> = [
      { source: 'extensions', pattern: DISCOVERY_PATTERNS.extensions },
      { source: 'packages', pattern: DISCOVERY_PATTERNS.packages },
      { source: 'apps', pattern: DISCOVERY_PATTERNS.apps },
      { source: 'services', pattern: DISCOVERY_PATTERNS.services },
    ];

    if (options.includeMarketplaceCache) {
      patterns.push({ source: 'marketplace', pattern: DISCOVERY_PATTERNS.marketplace });
    }

    const discovered: DiscoveredExtension[] = [];

    for (const { source, pattern } of patterns) {
      const files = await fg(pattern, { cwd: root, absolute: true, onlyFiles: true });
      for (const manifestFile of files) {
        const path = join(manifestFile, '..');
        try {
          const manifest = loadExtensionManifest(path);
          discovered.push({ manifest, path, source });
        } catch {
          // skip invalid manifests during discovery scan
        }
      }
    }

    return discovered;
  }

  async findById(workspaceRoot: string, id: string): Promise<DiscoveredExtension | undefined> {
    const all = await this.discover({ workspaceRoot, includeMarketplaceCache: true });
    return all.find((item) => item.manifest.id === id);
  }
}

export function createExtensionDiscovery(): ExtensionDiscovery {
  return new ExtensionDiscovery();
}

export { EXTENSION_MANIFEST_FILENAME, DISCOVERY_PATTERNS };
