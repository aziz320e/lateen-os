/** @module meeting/repository */
import type { OrganizationId, MeetingRecordId, EmployeeId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MeetingRecord, MeetingRecordStatus } from './types.js';

export interface MeetingRecordRepository extends Repository<MeetingRecord, MeetingRecordId> {
  findByAttendee(
    organizationId: OrganizationId,
    employeeId: EmployeeId,
  ): Promise<readonly MeetingRecord[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: MeetingRecordStatus,
  ): Promise<readonly MeetingRecord[]>;
}
