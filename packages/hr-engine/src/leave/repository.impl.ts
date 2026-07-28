/** Real, in-memory Leave Management repositories. @module leave/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { LeaveBalanceRepository, LeaveRequestRepository } from './repository.js';
import type { LeaveBalance, LeaveRequest } from './types.js';

/** Creates a real, in-memory {@link LeaveRequestRepository}. */
export function createLeaveRequestRepository(seed?: readonly LeaveRequest[]): LeaveRequestRepository {
  const repo = createInMemoryRepository<LeaveRequest>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((request) => request.employeeId === employeeId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((request) => request.status === status);
    },
  };
}

/** Creates a real, in-memory {@link LeaveBalanceRepository}. */
export function createLeaveBalanceRepository(seed?: readonly LeaveBalance[]): LeaveBalanceRepository {
  const repo = createInMemoryRepository<LeaveBalance>({ seed });
  return {
    ...repo,
    async findByEmployeeAndType(organizationId, employeeId, leaveType, year) {
      return (
        repo.list(organizationId).find((balance) => balance.employeeId === employeeId && balance.leaveType === leaveType && balance.year === year) ??
        null
      );
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((balance) => balance.employeeId === employeeId);
    },
  };
}
