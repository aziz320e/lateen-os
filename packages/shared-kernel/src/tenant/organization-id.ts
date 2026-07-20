/**
 * Organization identifier — primary tenant root in Business DNA.
 *
 * @module tenant/organization-id
 */

import type { TenantId } from './tenant-id.js';

/** Identifies an Organization aggregate (tenant root). */
export type OrganizationId = TenantId;
