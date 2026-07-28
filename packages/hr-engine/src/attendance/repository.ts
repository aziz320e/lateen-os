/** @module attendance/repository */
import type { EmployeeId } from '../employee/types.js';
import type { Repository } from '../shared/repository.js';
import type { AbsenceRecordId, HolidayId, OrganizationId, WorkSessionId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { AbsenceRecord, Holiday, WorkSession } from './types.js';

export interface WorkSessionRepository extends Repository<WorkSession, WorkSessionId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkSession[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly WorkSession[]>;
  findOpenByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<WorkSession | null>;
}

export interface AbsenceRecordRepository extends Repository<AbsenceRecord, AbsenceRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly AbsenceRecord[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly AbsenceRecord[]>;
}

export interface HolidayRepository extends Repository<Holiday, HolidayId> {
  findAll(organizationId: OrganizationId): Promise<readonly Holiday[]>;
  findByDate(organizationId: OrganizationId, date: ISODate): Promise<Holiday | null>;
}
