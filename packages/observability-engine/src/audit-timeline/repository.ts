/** @module audit-timeline/repository */
import type { Repository } from '../shared/repository.js';
import type { AuditTimelineEntryId, OrganizationId } from '../shared/identifiers.js';
import type { AuditTimelineEntry, AuditTimelineSource } from './types.js';

export interface AuditTimelineRepository extends Repository<AuditTimelineEntry, AuditTimelineEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly AuditTimelineEntry[]>;
  findBySource(organizationId: OrganizationId, source: AuditTimelineSource): Promise<readonly AuditTimelineEntry[]>;
}
