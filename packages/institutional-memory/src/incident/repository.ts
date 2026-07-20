/** @module incident/repository */
import type { OrganizationId, IncidentRecordId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { IncidentRecord, IncidentRecordStatus, IncidentSeverity } from './types.js';

export interface IncidentRecordRepository extends Repository<IncidentRecord, IncidentRecordId> {
  findBySeverity(
    organizationId: OrganizationId,
    severity: IncidentSeverity,
  ): Promise<readonly IncidentRecord[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: IncidentRecordStatus,
  ): Promise<readonly IncidentRecord[]>;
}
