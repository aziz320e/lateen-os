/**
 * Branch identifier — organizational subdivision within a tenant.
 *
 * @module tenant/branch-id
 */

import type { Identifier } from '../identity/identifier.js';

/** Identifies a Branch aggregate scoped to an organization. */
export type BranchId = Identifier;
