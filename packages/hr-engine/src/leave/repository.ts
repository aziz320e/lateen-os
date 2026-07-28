/** @module leave/repository */
import type { EmployeeId } from '../employee/types.js';
import type { Repository } from '../shared/repository.js';
import type { LeaveBalanceId, LeaveRequestId, OrganizationId } from '../shared/identifiers.js';
import type { LeaveBalance, LeaveRequest, LeaveRequestStatus, LeaveType } from './types.js';

export interface LeaveRequestRepository extends Repository<LeaveRequest, LeaveRequestId> {
  findAll(organizationId: OrganizationId): Promise<readonly LeaveRequest[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly LeaveRequest[]>;
  findByStatus(organizationId: OrganizationId, status: LeaveRequestStatus): Promise<readonly LeaveRequest[]>;
}

export interface LeaveBalanceRepository extends Repository<LeaveBalance, LeaveBalanceId> {
  findByEmployeeAndType(organizationId: OrganizationId, employeeId: EmployeeId, leaveType: LeaveType, year: number): Promise<LeaveBalance | null>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly LeaveBalance[]>;
}
