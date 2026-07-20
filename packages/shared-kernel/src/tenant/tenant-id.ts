/**
 * Tenant identifier — the isolation boundary for multi-tenant Lateen OS.
 *
 * @module tenant/tenant-id
 */

import type { Identifier } from '../identity/identifier.js';

/** Identifies a tenant (organization) in the multi-tenant platform. */
export type TenantId = Identifier;
