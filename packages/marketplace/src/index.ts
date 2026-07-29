/**
 * @lateen-os/marketplace — Marketplace / Extension Platform
 *
 * A real, deterministic, framework-agnostic extension platform: the
 * Extension Registry (install/uninstall/enable/disable/upgrade), the
 * Plugin Registry (capabilities/permissions/compatibility), the
 * Package Registry (versions/dependencies/real content-integrity
 * signatures), the Extension Sandbox (deterministic capability/
 * permission/isolation metadata — no code execution anywhere), Extension
 * Configuration (defaults/overrides/validation), Extension Events
 * (declared subscriptions/publications/compatibility), and the
 * Marketplace Catalog (categories/publishers/ratings/downloads —
 * metadata only). See `runtime.ts`'s `createMarketplaceRuntime()` for
 * the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as extensionRegistry from './extension-registry/index.js';
export * as pluginRegistry from './plugin-registry/index.js';
export * as packageRegistry from './package-registry/index.js';
export * as extensionSandbox from './extension-sandbox/index.js';
export * as extensionConfiguration from './extension-configuration/index.js';
export * as extensionEvents from './extension-events/index.js';
export * as marketplaceCatalog from './marketplace-catalog/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createMarketplaceRuntime,
  type MarketplaceRuntime,
  type MarketplaceRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Extension, ExtensionStatus } from './extension-registry/types.js';
export type { Plugin, PluginStatus } from './plugin-registry/types.js';
export type { PackageVersion, PackageDependency } from './package-registry/types.js';
export type { SandboxProfile, IsolationLevel } from './extension-sandbox/types.js';
export type { ExtensionConfigEntry, ConfigFieldSchema, ConfigFieldType } from './extension-configuration/types.js';
export type { EventDeclaration, EventDeclarationDirection } from './extension-events/types.js';
export type { CatalogEntry } from './marketplace-catalog/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionExtension,
  type ExtensionRegistryEngine,
  type InstallExtensionInput,
  type UpgradeExtensionInput,
  type ValidateExtensionResult,
} from './extension-registry/engine.impl.js';
export {
  canTransitionPlugin,
  type PluginRegistryEngine,
  type RegisterPluginInput,
  type CompatibilityResult,
} from './plugin-registry/engine.impl.js';
export {
  computeSignature,
  type PackageRegistryEngine,
  type PublishVersionInput,
} from './package-registry/engine.impl.js';
export {
  type ExtensionSandboxEngine,
  type CreateSandboxProfileInput,
} from './extension-sandbox/engine.impl.js';
export {
  validateExtensionConfig,
  type ExtensionConfigurationEngine,
  type SetConfigInput,
  type ValidationResult,
} from './extension-configuration/engine.impl.js';
export {
  type ExtensionEventsEngine,
  type DeclareEventInput,
  type EventCompatibilityResult,
} from './extension-events/engine.impl.js';
export {
  computeRunningAverage,
  type MarketplaceCatalogEngine,
  type PublishToCatalogInput,
} from './marketplace-catalog/engine.impl.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { ExtensionRepository } from './extension-registry/repository.js';
export type { PluginRepository } from './plugin-registry/repository.js';
export type { PackageVersionRepository } from './package-registry/repository.js';
export type { SandboxProfileRepository } from './extension-sandbox/repository.js';
export type { ExtensionConfigRepository } from './extension-configuration/repository.js';
export type { EventDeclarationRepository } from './extension-events/repository.js';
export type { CatalogEntryRepository } from './marketplace-catalog/repository.js';

/** Relationship Layer (all 8 required sibling package integrations). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { MarketplaceQueries } from './queries/marketplace-queries.js';

/** Typed event bus. */
export type { MarketplaceDomainEvent } from './events/marketplace-events.js';
export { MARKETPLACE_EVENT_NAMES } from './events/marketplace-events.js';
export type { MarketplaceEventBus } from './events/marketplace-event-bus.js';
