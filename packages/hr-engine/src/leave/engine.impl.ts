/**
 * Real Leave Management engine — the 5 required leave types and the
 * required 5-status lifecycle (`requested`, `approved`, `rejected`,
 * `cancelled`, `completed`). `annual` and `sick` leave are
 * balance-tracked; `unpaid`, `maternity_paternity`, and `emergency`
 * are not — requesting them never checks a balance.
 *
 * @module leave/engine.impl
 */
import type { EmployeeId } from '../employee/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import { daysBetweenIso } from '../shared/date.js';
import { InsufficientLeaveBalanceError, InvalidLeaveTransitionError, LeaveRequestNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { LeaveRequestId, OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { LeaveBalanceRepository, LeaveRequestRepository } from './repository.js';
import type { LeaveBalance, LeaveRequest, LeaveRequestStatus, LeaveType } from './types.js';

const LEAVE_TRANSITIONS: Readonly<Record<LeaveRequestStatus, readonly LeaveRequestStatus[]>> = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
};

/** Whether a leave request may transition from one status to another. */
export function canTransitionLeaveRequest(from: LeaveRequestStatus, to: LeaveRequestStatus): boolean {
  return LEAVE_TRANSITIONS[from].includes(to);
}

/** Leave types whose usage is checked and deducted against a per-year balance. */
export const BALANCE_TRACKED_LEAVE_TYPES: ReadonlySet<LeaveType> = new Set(['annual', 'sick']);

/** Deterministic default annual allocation (days/year) for a balance-tracked leave type, absent an explicit override. */
export const DEFAULT_ALLOCATED_DAYS: Readonly<Record<'annual' | 'sick', number>> = { annual: 21, sick: 10 };

/** Pure: inclusive day count spanning `startDate`..`endDate`. */
export function computeDaysRequested(startDate: ISODate, endDate: ISODate): number {
  return daysBetweenIso(startDate, endDate) + 1;
}

export interface RequestLeaveInput {
  readonly employeeId: EmployeeId;
  readonly leaveType: LeaveType;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
  readonly reason?: string;
}

export interface UpsertLeaveBalanceInput {
  readonly employeeId: EmployeeId;
  readonly leaveType: LeaveType;
  readonly year: number;
  readonly allocatedDays: number;
}

export interface LeaveManagementEngine {
  /** Throws {@link InsufficientLeaveBalanceError} for a balance-tracked type with insufficient remaining days. */
  requestLeave(organizationId: OrganizationId, input: RequestLeaveInput): Promise<LeaveRequest>;
  approveLeave(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest>;
  rejectLeave(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest>;
  /** Restores the balance deduction if the request had already been `approved`. */
  cancelLeave(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest>;
  completeLeave(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest>;
  getLeaveRequest(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest | null>;
  listLeaveRequests(organizationId: OrganizationId): Promise<readonly LeaveRequest[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly LeaveRequest[]>;
  findByStatus(organizationId: OrganizationId, status: LeaveRequestStatus): Promise<readonly LeaveRequest[]>;

  /** The effective balance for a balance-tracked type/year — a deterministic default if none was ever configured or used. */
  getLeaveBalance(organizationId: OrganizationId, employeeId: EmployeeId, leaveType: LeaveType, year: number): Promise<LeaveBalance>;
  upsertLeaveBalance(organizationId: OrganizationId, input: UpsertLeaveBalanceInput): Promise<LeaveBalance>;
  listLeaveBalances(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly LeaveBalance[]>;
}

function yearOf(date: ISODate): number {
  return Number(date.slice(0, 4));
}

/** Creates a real {@link LeaveManagementEngine}. */
export function createLeaveManagementEngine(
  requestRepository: LeaveRequestRepository,
  balanceRepository: LeaveBalanceRepository,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): LeaveManagementEngine {
  async function requireRequest(organizationId: OrganizationId, leaveRequestId: LeaveRequestId): Promise<LeaveRequest> {
    const request = await requestRepository.findById(organizationId, leaveRequestId);
    if (!request) throw new LeaveRequestNotFoundError(leaveRequestId);
    return request;
  }

  async function effectiveBalance(organizationId: OrganizationId, employeeId: EmployeeId, leaveType: LeaveType, year: number): Promise<LeaveBalance> {
    const existing = await balanceRepository.findByEmployeeAndType(organizationId, employeeId, leaveType, year);
    if (existing) return existing;
    const timestamp = now();
    return {
      id: generateId('leave-balance'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      employeeId,
      leaveType,
      year,
      allocatedDays: DEFAULT_ALLOCATED_DAYS[leaveType as 'annual' | 'sick'] ?? 0,
      usedDays: 0,
    };
  }

  async function adjustUsedDays(organizationId: OrganizationId, employeeId: EmployeeId, leaveType: LeaveType, year: number, delta: number): Promise<void> {
    if (!BALANCE_TRACKED_LEAVE_TYPES.has(leaveType)) return;
    const balance = await effectiveBalance(organizationId, employeeId, leaveType, year);
    const updated: LeaveBalance = { ...balance, usedDays: Math.max(0, balance.usedDays + delta), updatedAt: now() };
    await balanceRepository.save(updated);
  }

  return {
    async requestLeave(organizationId, input) {
      const daysRequested = computeDaysRequested(input.startDate, input.endDate);

      if (BALANCE_TRACKED_LEAVE_TYPES.has(input.leaveType)) {
        const balance = await effectiveBalance(organizationId, input.employeeId, input.leaveType, yearOf(input.startDate));
        const remaining = balance.allocatedDays - balance.usedDays;
        if (daysRequested > remaining) {
          throw new InsufficientLeaveBalanceError(input.employeeId, daysRequested, remaining);
        }
      }

      const timestamp = now();
      const request: LeaveRequest = {
        id: generateId('leave-request'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        daysRequested,
        reason: input.reason,
        status: 'requested',
      };
      await requestRepository.save(request);
      eventBus?.publish('leave.requested', { organizationId, leaveRequestId: request.id, employeeId: request.employeeId });
      return request;
    },

    async approveLeave(organizationId, leaveRequestId) {
      const request = await requireRequest(organizationId, leaveRequestId);
      if (!canTransitionLeaveRequest(request.status, 'approved')) {
        throw new InvalidLeaveTransitionError(leaveRequestId, request.status, 'approved');
      }
      await adjustUsedDays(organizationId, request.employeeId, request.leaveType, yearOf(request.startDate), request.daysRequested);
      const updated: LeaveRequest = { ...request, status: 'approved', updatedAt: now() };
      await requestRepository.save(updated);
      eventBus?.publish('leave.approved', { organizationId, leaveRequestId, employeeId: request.employeeId });
      return updated;
    },

    async rejectLeave(organizationId, leaveRequestId) {
      const request = await requireRequest(organizationId, leaveRequestId);
      if (!canTransitionLeaveRequest(request.status, 'rejected')) {
        throw new InvalidLeaveTransitionError(leaveRequestId, request.status, 'rejected');
      }
      const updated: LeaveRequest = { ...request, status: 'rejected', updatedAt: now() };
      await requestRepository.save(updated);
      return updated;
    },

    async cancelLeave(organizationId, leaveRequestId) {
      const request = await requireRequest(organizationId, leaveRequestId);
      if (!canTransitionLeaveRequest(request.status, 'cancelled')) {
        throw new InvalidLeaveTransitionError(leaveRequestId, request.status, 'cancelled');
      }
      if (request.status === 'approved') {
        await adjustUsedDays(organizationId, request.employeeId, request.leaveType, yearOf(request.startDate), -request.daysRequested);
      }
      const updated: LeaveRequest = { ...request, status: 'cancelled', updatedAt: now() };
      await requestRepository.save(updated);
      return updated;
    },

    async completeLeave(organizationId, leaveRequestId) {
      const request = await requireRequest(organizationId, leaveRequestId);
      if (!canTransitionLeaveRequest(request.status, 'completed')) {
        throw new InvalidLeaveTransitionError(leaveRequestId, request.status, 'completed');
      }
      const updated: LeaveRequest = { ...request, status: 'completed', updatedAt: now() };
      await requestRepository.save(updated);
      return updated;
    },

    async getLeaveRequest(organizationId, leaveRequestId) {
      return requestRepository.findById(organizationId, leaveRequestId);
    },

    async listLeaveRequests(organizationId) {
      return requestRepository.findAll(organizationId);
    },

    async findByEmployee(organizationId, employeeId) {
      return requestRepository.findByEmployee(organizationId, employeeId);
    },

    async findByStatus(organizationId, status) {
      return requestRepository.findByStatus(organizationId, status);
    },

    async getLeaveBalance(organizationId, employeeId, leaveType, year) {
      return effectiveBalance(organizationId, employeeId, leaveType, year);
    },

    async upsertLeaveBalance(organizationId, input) {
      const existing = await balanceRepository.findByEmployeeAndType(organizationId, input.employeeId, input.leaveType, input.year);
      const timestamp = now();
      const balance: LeaveBalance = {
        id: existing?.id ?? generateId('leave-balance'),
        organizationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        year: input.year,
        allocatedDays: input.allocatedDays,
        usedDays: existing?.usedDays ?? 0,
      };
      await balanceRepository.save(balance);
      return balance;
    },

    async listLeaveBalances(organizationId, employeeId) {
      return balanceRepository.findByEmployee(organizationId, employeeId);
    },
  };
}
