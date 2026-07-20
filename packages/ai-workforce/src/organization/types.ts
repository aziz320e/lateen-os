/** @module organization/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  DepartmentId,
  EmployeeId,
  OrganizationId,
  TeamId,
  WorkerId,
  WorkforceOrgUnitId,
} from '../shared/identifiers.js';

export type { WorkforceOrgUnitId };

export type OrgUnitType = 'department' | 'team' | 'squad' | 'program';

/** Organizational unit grouping workers. */
export interface WorkforceOrgUnit extends TenantAuditableEntity<WorkforceOrgUnitId> {
  readonly name: string;
  readonly type: OrgUnitType;
  readonly departmentId?: DepartmentId;
  readonly parentUnitId?: WorkforceOrgUnitId;
  readonly leadEmployeeId?: EmployeeId;
  readonly workerIds: readonly WorkerId[];
  readonly teamIds: readonly TeamId[];
}

/** Reporting relationship between workers and human supervisors. */
export interface ReportingLine {
  readonly workerId: WorkerId;
  readonly supervisorEmployeeId: EmployeeId;
  readonly departmentId?: DepartmentId;
  readonly effectiveFrom: string;
  readonly effectiveUntil?: string;
}

export type { OrganizationId, WorkerId, TeamId };
