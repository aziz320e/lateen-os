/** @module queries/marketplace-queries */
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
  SearchMarketplaceQuery,
  SearchMarketplaceResult,
} from './types.js';

/** Real, read-only CQRS query port over the Marketplace's own aggregates. */
export interface MarketplaceQueries {
  findExtensions(query: FindExtensionsQuery): Promise<FindExtensionsResult>;
  findPlugins(query: FindPluginsQuery): Promise<FindPluginsResult>;
  findPackages(query: FindPackagesQuery): Promise<FindPackagesResult>;
  findCatalog(query: FindCatalogQuery): Promise<FindCatalogResult>;
  findConfigurations(query: FindConfigurationsQuery): Promise<FindConfigurationsResult>;
  findCompatibility(query: FindCompatibilityQuery): Promise<FindCompatibilityResult>;
  searchMarketplace(query: SearchMarketplaceQuery): Promise<SearchMarketplaceResult>;
}
