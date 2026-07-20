/** @module decision/repository */
import type { OrganizationId, DecisionRecordId, EmployeeId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DecisionRecord, DecisionRecordStatus } from './types.js';

export interface DecisionRecordRepository extends Repository<DecisionRecord, DecisionRecordId> {
  findByOwner(
    organizationId: OrganizationId,
    ownerId: EmployeeId,
  ): Promise<readonly DecisionRecord[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: DecisionRecordStatus,
  ): Promise<readonly DecisionRecord[]>;
}
