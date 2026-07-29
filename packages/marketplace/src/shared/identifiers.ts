/**
 * Identifier types for the Marketplace bounded context.
 *
 * Sibling-owned entities referenced by this package (registered APIs,
 * admin organizations, AI Runtime agents, workflow definitions,
 * analytics KPIs, health checks, knowledge entries) are addressed by
 * plain `string` foreign keys — this package never redefines another
 * package's identifier namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Extension Registry. */
export type ExtensionId = Identifier;

/** Plugin Registry. */
export type PluginId = Identifier;

/** Package Registry. */
export type PackageVersionId = Identifier;

/** Extension Sandbox. */
export type SandboxProfileId = Identifier;

/** Extension Configuration. */
export type ExtensionConfigId = Identifier;

/** Extension Events. */
export type EventDeclarationId = Identifier;

/** Marketplace Catalog. */
export type CatalogEntryId = Identifier;
