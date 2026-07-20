/**
 * Audit metadata for auditable domain entities.
 *
 * @module audit/audit-info
 */

import type { Identifier } from '../identity/identifier.js';
import type { Timestamp } from '../time/timestamp.js';

/** Creation and modification audit trail on a domain entity. */
export interface AuditInfo {
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly createdBy?: Identifier;
  readonly updatedBy?: Identifier;
}
