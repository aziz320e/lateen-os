/**
 * Marketplace Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Package
 * Registry, the Plugin Registry, the Extension Sandbox, the Extension
 * Registry (composed over all three of the above for install/upgrade
 * validation), Extension Configuration, Extension Events, the
 * Marketplace Catalog, the Relationship Layer, the query layer, and
 * the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link MarketplaceRuntime} surface.
 *
 * @module runtime
 */
import { createMarketplaceEventBus, type MarketplaceEventBus } from './events/index.js';
import {
  createExtensionConfigRepository,
  createExtensionConfigurationEngine,
  type ExtensionConfigurationEngine,
} from './extension-configuration/index.js';
import { createEventDeclarationRepository, createExtensionEventsEngine, type ExtensionEventsEngine } from './extension-events/index.js';
import { createExtensionRegistryEngine, createExtensionRepository, type ExtensionRegistryEngine } from './extension-registry/index.js';
import { createExtensionSandboxEngine, createSandboxProfileRepository, type ExtensionSandboxEngine } from './extension-sandbox/index.js';
import { createCatalogEntryRepository, createMarketplaceCatalogEngine, type MarketplaceCatalogEngine } from './marketplace-catalog/index.js';
import { createPackageRegistryEngine, createPackageVersionRepository, type PackageRegistryEngine } from './package-registry/index.js';
import { createPluginRegistryEngine, createPluginRepository, type PluginRegistryEngine } from './plugin-registry/index.js';
import { createMarketplaceQueries, type MarketplaceQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { nowIso } from './shared/id.js';

export interface MarketplaceRuntimeDeps {
  readonly eventBus?: MarketplaceEventBus;
  readonly now?: () => string;
  readonly apiGateway?: RelationshipManagementDeps['apiGateway'];
  readonly adminConsole?: RelationshipManagementDeps['adminConsole'];
  readonly aiRuntime?: RelationshipManagementDeps['aiRuntime'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly observability?: RelationshipManagementDeps['observability'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface MarketplaceRuntime {
  readonly extensions: ExtensionRegistryEngine;
  readonly plugins: PluginRegistryEngine;
  readonly packages: PackageRegistryEngine;
  readonly sandbox: ExtensionSandboxEngine;
  readonly configuration: ExtensionConfigurationEngine;
  readonly extensionEvents: ExtensionEventsEngine;
  readonly catalog: MarketplaceCatalogEngine;
  readonly relationshipManagement: RelationshipManagement;
  readonly queries: MarketplaceQueries;
  /** Typed event bus — subscribe to extension/plugin/catalog/configuration/compatibility events. */
  readonly events: MarketplaceEventBus;
}

/** Creates a real, in-memory {@link MarketplaceRuntime}. */
export function createMarketplaceRuntime(deps: MarketplaceRuntimeDeps = {}): MarketplaceRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createMarketplaceEventBus();

  const packageVersionRepository = createPackageVersionRepository();
  const pluginRepository = createPluginRepository();
  const sandboxProfileRepository = createSandboxProfileRepository();
  const extensionRepository = createExtensionRepository();
  const extensionConfigRepository = createExtensionConfigRepository();
  const eventDeclarationRepository = createEventDeclarationRepository();
  const catalogEntryRepository = createCatalogEntryRepository();

  const packages = createPackageRegistryEngine(packageVersionRepository, now);
  const plugins = createPluginRegistryEngine(pluginRepository, eventBus, now);
  const sandbox = createExtensionSandboxEngine(sandboxProfileRepository, now);
  const extensions = createExtensionRegistryEngine(extensionRepository, packages, plugins, sandbox, eventBus, now);
  const configuration = createExtensionConfigurationEngine(extensionConfigRepository, eventBus, now);
  const extensionEvents = createExtensionEventsEngine(eventDeclarationRepository, eventBus, now);
  const catalog = createMarketplaceCatalogEngine(catalogEntryRepository, eventBus, now);

  const relationshipManagement = createRelationshipManagement({
    apiGateway: deps.apiGateway,
    adminConsole: deps.adminConsole,
    aiRuntime: deps.aiRuntime,
    workflow: deps.workflow,
    analytics: deps.analytics,
    observability: deps.observability,
    communicationHub: deps.communicationHub,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createMarketplaceQueries({
    extensionRepository,
    pluginRepository,
    packageVersionRepository,
    catalogEntryRepository,
    extensionConfigRepository,
  });

  return {
    extensions,
    plugins,
    packages,
    sandbox,
    configuration,
    extensionEvents,
    catalog,
    relationshipManagement,
    queries,
    events: eventBus,
  };
}
