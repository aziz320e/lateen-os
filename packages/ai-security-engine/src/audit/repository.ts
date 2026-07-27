/** @module audit/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { AuditCategory, AuditEvent, AuditEventId, AuditOutcome } from './types.js';

export interface AuditEventRepository {
  save(event: AuditEvent): Promise<void>;
  findById(organizationId: OrganizationId, eventId: AuditEventId): Promise<AuditEvent | null>;
  findAll(organizationId: OrganizationId): Promise<readonly AuditEvent[]>;
  findByCategory(organizationId: OrganizationId, category: AuditCategory): Promise<readonly AuditEvent[]>;
  findByActor(organizationId: OrganizationId, actorId: string): Promise<readonly AuditEvent[]>;
  findByOutcome(organizationId: OrganizationId, outcome: AuditOutcome): Promise<readonly AuditEvent[]>;
}
