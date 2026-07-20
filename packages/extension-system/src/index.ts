/**
 * @lateen-os/extension-system — Lateen OS Extension System
 *
 * Discover, validate, load, version, and manage third-party extensions.
 * No business logic. Managed by the Kernel.
 *
 * @packageDocumentation
 */

export * from './manifest/index.js';
export * from './registry/index.js';
export * from './loader/index.js';
export * from './resolver/index.js';
export * from './validator/index.js';
export * from './permissions/index.js';
export * from './lifecycle/index.js';
export * from './dependencies/index.js';
export * from './sandbox/index.js';
export * from './hooks/index.js';
export * from './events/index.js';
export * from './configuration/index.js';
export * from './discovery/index.js';
export * from './installer/index.js';
export * from './queries/index.js';
export * from './kernel/index.js';
export * from './cli/index.js';

export { ExtensionSystem, createExtensionSystem } from './system/extension-system.js';
export { registerExtensionCommands } from './cli/register.js';
export { registerMarketplaceCommands } from './cli/marketplace.js';
export { registerProvisioningCommands } from './cli/provisioning.js';
export { registerGatewayCommands } from './cli/gateway.js';

export { parseExtensionManifest, loadExtensionManifest, serializeExtensionManifest } from './manifest/parser.js';
export { EXTENSION_MANIFEST_FILENAME, PLATFORM_ENGINE_VERSION, PLATFORM_SDK_VERSION } from './manifest/types.js';
export type { InstalledExtension, ExtensionRegistrySnapshot } from './registry/types.js';
export type { ExtensionLifecycleState, ExtensionRegistryStatus } from './lifecycle/types.js';
export type { ExtensionPermission } from './permissions/types.js';
export type { ExtensionDomainEvent } from './events/types.js';
export { EXTENSION_EVENT_NAMES } from './events/types.js';
export type { ExtensionQueries } from './queries/extension-queries.js';
