/**
 * Real {@link MarketplaceQueries} implementation — a CQRS read layer
 * composed over the Marketplace repositories. Repositories are taken
 * as constructor dependencies but never returned to callers.
 *
 * @module queries/marketplace-queries.impl
 */
import type { CatalogEntryRepository } from '../marketplace-catalog/repository.js';
import type { ExtensionConfigRepository } from '../extension-configuration/repository.js';
import type { ExtensionRepository } from '../extension-registry/repository.js';
import type { PackageVersionRepository } from '../package-registry/repository.js';
import type { PluginRepository } from '../plugin-registry/repository.js';
import type { MarketplaceQueries } from './marketplace-queries.js';
import type {
  FindCatalogQuery,
  FindCatalogResult,
  FindCompatibilityQuery,
  FindCompatibilityResult,
  FindConfigurationsQuery,
  FindConfigurationsResult,
  FindExtensionsQuery,
  FindExtensionsResult,
  FindPackagesQuery,
  FindPackagesResult,
  FindPluginsQuery,
  FindPluginsResult,
  SearchMarketplaceMatch,
  SearchMarketplaceQuery,
  SearchMarketplaceResult,
} from './types.js';

export interface MarketplaceQueriesDeps {
  readonly extensionRepository: ExtensionRepository;
  readonly pluginRepository: PluginRepository;
  readonly packageVersionRepository: PackageVersionRepository;
  readonly catalogEntryRepository: CatalogEntryRepository;
  readonly extensionConfigRepository: ExtensionConfigRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link MarketplaceQueries} read port over the given repositories. */
export function createMarketplaceQueries(deps: MarketplaceQueriesDeps): MarketplaceQueries {
  return {
    async findExtensions(query: FindExtensionsQuery): Promise<FindExtensionsResult> {
      let extensions = await deps.extensionRepository.findAll(query.organizationId);
      if (query.status) extensions = extensions.filter((extension) => extension.status === query.status);
      return { extensions: paginate(extensions, query.offset, query.limit), total: extensions.length };
    },

    async findPlugins(query: FindPluginsQuery): Promise<FindPluginsResult> {
      let plugins = await deps.pluginRepository.findAll(query.organizationId);
      if (query.status) plugins = plugins.filter((plugin) => plugin.status === query.status);
      return { plugins: paginate(plugins, query.offset, query.limit), total: plugins.length };
    },

    async findPackages(query: FindPackagesQuery): Promise<FindPackagesResult> {
      const packages = query.extensionKey
        ? await deps.packageVersionRepository.findByExtensionKey(query.organizationId, query.extensionKey)
        : await deps.packageVersionRepository.findAll(query.organizationId);
      return { packages: paginate(packages, query.offset, query.limit), total: packages.length };
    },

    async findCatalog(query: FindCatalogQuery): Promise<FindCatalogResult> {
      let entries = await deps.catalogEntryRepository.findAll(query.organizationId);
      if (query.category) entries = entries.filter((entry) => entry.category === query.category);
      if (query.publisher) entries = entries.filter((entry) => entry.publisher === query.publisher);
      return { entries: paginate(entries, query.offset, query.limit), total: entries.length };
    },

    async findConfigurations(query: FindConfigurationsQuery): Promise<FindConfigurationsResult> {
      const all = await deps.extensionConfigRepository.findAll(query.organizationId);
      const configurations = query.extensionId ? all.filter((entry) => entry.extensionId === query.extensionId) : all;
      return { configurations: paginate(configurations, query.offset, query.limit), total: configurations.length };
    },

    async findCompatibility(query: FindCompatibilityQuery): Promise<FindCompatibilityResult> {
      let plugins = await deps.pluginRepository.findAll(query.organizationId);
      if (query.pluginId) plugins = plugins.filter((plugin) => plugin.id === query.pluginId);
      const compatibility = plugins.map((plugin) => ({ pluginId: plugin.id, key: plugin.key, compatibleVersionRange: plugin.compatibleVersionRange }));
      return { compatibility: paginate(compatibility, query.offset, query.limit), total: compatibility.length };
    },

    async searchMarketplace(query: SearchMarketplaceQuery): Promise<SearchMarketplaceResult> {
      const [extensions, plugins, catalogEntries] = await Promise.all([
        deps.extensionRepository.findAll(query.organizationId),
        deps.pluginRepository.findAll(query.organizationId),
        deps.catalogEntryRepository.findAll(query.organizationId),
      ]);

      const matches: SearchMarketplaceMatch[] = [];
      for (const extension of extensions) {
        const score = Math.max(scoreLabel(extension.name, query.keyword), scoreLabel(extension.key, query.keyword));
        if (score > 0) matches.push({ recordType: 'extension', id: extension.id, label: extension.name, score });
      }
      for (const plugin of plugins) {
        const score = Math.max(scoreLabel(plugin.name, query.keyword), scoreLabel(plugin.key, query.keyword));
        if (score > 0) matches.push({ recordType: 'plugin', id: plugin.id, label: plugin.name, score });
      }
      for (const entry of catalogEntries) {
        const score = scoreLabel(entry.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'catalog', id: entry.id, label: entry.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
