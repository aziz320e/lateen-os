/** @module audit/repository */
import type { Repository } from '../shared/repository.js';
import type { AuditEntryId, OrganizationId } from '../shared/identifiers.js';
import type { AuditEntry } from './types.js';

export interface AuditEntryRepository extends Repository<AuditEntry, AuditEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly AuditEntry[]>;
}
