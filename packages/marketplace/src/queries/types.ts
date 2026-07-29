/** @module queries/types */
import type { CatalogEntry } from '../marketplace-catalog/types.js';
import type { ExtensionConfigEntry } from '../extension-configuration/types.js';
import type { Extension, ExtensionStatus } from '../extension-registry/types.js';
import type { PackageVersion } from '../package-registry/types.js';
import type { Plugin, PluginId, PluginStatus } from '../plugin-registry/types.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { ExtensionId, OrganizationId } from '../shared/identifiers.js';

export interface FindExtensionsQuery extends OrganizationScopedQuery {
  readonly status?: ExtensionStatus;
}

export interface FindExtensionsResult {
  readonly extensions: readonly Extension[];
  readonly total: number;
}

export interface FindPluginsQuery extends OrganizationScopedQuery {
  readonly status?: PluginStatus;
}

export interface FindPluginsResult {
  readonly plugins: readonly Plugin[];
  readonly total: number;
}

export interface FindPackagesQuery extends OrganizationScopedQuery {
  readonly extensionKey?: string;
}

export interface FindPackagesResult {
  readonly packages: readonly PackageVersion[];
  readonly total: number;
}

export interface FindCatalogQuery extends OrganizationScopedQuery {
  readonly category?: string;
  readonly publisher?: string;
}

export interface FindCatalogResult {
  readonly entries: readonly CatalogEntry[];
  readonly total: number;
}

export interface FindConfigurationsQuery extends OrganizationScopedQuery {
  readonly extensionId?: ExtensionId;
}

export interface FindConfigurationsResult {
  readonly configurations: readonly ExtensionConfigEntry[];
  readonly total: number;
}

export interface CompatibilityRecord {
  readonly pluginId: PluginId;
  readonly key: string;
  readonly compatibleVersionRange: string;
}

export interface FindCompatibilityQuery extends OrganizationScopedQuery {
  readonly pluginId?: PluginId;
}

export interface FindCompatibilityResult {
  readonly compatibility: readonly CompatibilityRecord[];
  readonly total: number;
}

export type SearchMarketplaceRecordType = 'extension' | 'plugin' | 'catalog';

export interface SearchMarketplaceQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export interface SearchMarketplaceMatch {
  readonly recordType: SearchMarketplaceRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchMarketplaceResult {
  readonly matches: readonly SearchMarketplaceMatch[];
  readonly total: number;
}

export type { OrganizationId };
