/**
 * Cross-cutting graph primitives.
 *
 * @module shared/primitives
 */

import type { OrganizationId } from './identifiers.js';

/** Human-readable label on a graph node or edge. */
export type GraphLabel = string;

/** Tenant scope for all graph elements. */
export interface GraphTenantScoped {
  readonly organizationId: OrganizationId;
}

/** Arbitrary metadata attached to graph elements. */
export type GraphProperties = Readonly<Record<string, unknown>>;
