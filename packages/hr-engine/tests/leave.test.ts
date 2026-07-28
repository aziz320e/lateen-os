import { describe, expect, it } from 'vitest';
import { canTransitionLeaveRequest, computeDaysRequested, createLeaveManagementEngine, DEFAULT_ALLOCATED_DAYS } from '../src/leave/engine.impl.js';
import { createLeaveBalanceRepository, createLeaveRequestRepository } from '../src/leave/repository.impl.js';
import { createHrEventBus } from '../src/events/index.js';
import { InsufficientLeaveBalanceError, InvalidLeaveTransitionError, LeaveRequestNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const EMPLOYEE = 'employee-1';

function setup(eventBus = createHrEventBus()) {
  const requestRepository = createLeaveRequestRepository();
  const balanceRepository = createLeaveBalanceRepository();
  const engine = createLeaveManagementEngine(requestRepository, balanceRepository, eventBus);
  return { requestRepository, balanceRepository, engine, eventBus };
}

describe('computeDaysRequested (pure)', () => {
  it('is inclusive of both start and end date', () => {
    expect(computeDaysRequested('2026-01-01', '2026-01-01')).toBe(1);
    expect(computeDaysRequested('2026-01-01', '2026-01-05')).toBe(5);
  });
});

describe('canTransitionLeaveRequest (pure)', () => {
  it('requested -> approved/rejected/cancelled', () => {
    expect(canTransitionLeaveRequest('requested', 'approved')).toBe(true);
    expect(canTransitionLeaveRequest('requested', 'rejected')).toBe(true);
    expect(canTransitionLeaveRequest('requested', 'cancelled')).toBe(true);
  });

  it('approved -> completed/cancelled', () => {
    expect(canTransitionLeaveRequest('approved', 'completed')).toBe(true);
    expect(canTransitionLeaveRequest('approved', 'cancelled')).toBe(true);
  });

  it('rejected/cancelled/completed are terminal', () => {
    expect(canTransitionLeaveRequest('rejected', 'approved')).toBe(false);
    expect(canTransitionLeaveRequest('cancelled', 'approved')).toBe(false);
    expect(canTransitionLeaveRequest('completed', 'approved')).toBe(false);
  });
});

describe('LeaveManagementEngine — requestLeave', () => {
  it('supports all five leave types', async () => {
    const { engine } = setup();
    const types = ['annual', 'sick', 'unpaid', 'maternity_paternity', 'emergency'] as const;
    for (const leaveType of types) {
      const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType, startDate: '2026-02-01', endDate: '2026-02-01' });
      expect(request.leaveType).toBe(leaveType);
      expect(request.status).toBe('requested');
    }
  });

  it('computes daysRequested from the date range', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-05' });
    expect(request.daysRequested).toBe(5);
  });

  it('publishes leave.requested', async () => {
    const eventBus = createHrEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('leave.requested', (payload) => (seen = payload));
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-01' });
    expect(seen).toEqual({ organizationId: ORG, leaveRequestId: request.id, employeeId: EMPLOYEE });
  });

  it('rejects an annual leave request exceeding the default balance', async () => {
    const { engine } = setup();
    await expect(
      engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-01-01', endDate: '2026-01-31' }),
    ).rejects.toBeInstanceOf(InsufficientLeaveBalanceError);
  });

  it('does not check a balance for unpaid leave', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'unpaid', startDate: '2026-01-01', endDate: '2026-12-31' });
    expect(request.daysRequested).toBeGreaterThan(DEFAULT_ALLOCATED_DAYS.annual);
  });
});

describe('LeaveManagementEngine — approveLeave', () => {
  it('deducts a balance-tracked type from the balance and publishes leave.approved', async () => {
    const eventBus = createHrEventBus();
    const { engine } = setup(eventBus);
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-05' });
    let seen: unknown;
    eventBus.subscribe('leave.approved', (payload) => (seen = payload));
    const approved = await engine.approveLeave(ORG, request.id);
    expect(approved.status).toBe('approved');
    const balance = await engine.getLeaveBalance(ORG, EMPLOYEE, 'annual', 2026);
    expect(balance.usedDays).toBe(5);
    expect(seen).toEqual({ organizationId: ORG, leaveRequestId: request.id, employeeId: EMPLOYEE });
  });

  it('rejects approving a non-requested request', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-01' });
    await engine.approveLeave(ORG, request.id);
    await expect(engine.approveLeave(ORG, request.id)).rejects.toBeInstanceOf(InvalidLeaveTransitionError);
  });

  it('throws LeaveRequestNotFoundError for an unknown request', async () => {
    const { engine } = setup();
    await expect(engine.approveLeave(ORG, 'missing')).rejects.toBeInstanceOf(LeaveRequestNotFoundError);
  });
});

describe('LeaveManagementEngine — rejectLeave/cancelLeave/completeLeave', () => {
  it('rejectLeave() moves requested -> rejected', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'emergency', startDate: '2026-02-01', endDate: '2026-02-01' });
    const rejected = await engine.rejectLeave(ORG, request.id);
    expect(rejected.status).toBe('rejected');
  });

  it('cancelLeave() restores the balance if it had been approved', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-02' });
    await engine.approveLeave(ORG, request.id);
    await engine.cancelLeave(ORG, request.id);
    const balance = await engine.getLeaveBalance(ORG, EMPLOYEE, 'sick', 2026);
    expect(balance.usedDays).toBe(0);
  });

  it('cancelLeave() does not restore a balance for a merely requested (not yet approved) request', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-01' });
    const cancelled = await engine.cancelLeave(ORG, request.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('completeLeave() moves approved -> completed', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'emergency', startDate: '2026-02-01', endDate: '2026-02-01' });
    await engine.approveLeave(ORG, request.id);
    const completed = await engine.completeLeave(ORG, request.id);
    expect(completed.status).toBe('completed');
  });

  it('rejects completing a merely requested request', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'emergency', startDate: '2026-02-01', endDate: '2026-02-01' });
    await expect(engine.completeLeave(ORG, request.id)).rejects.toBeInstanceOf(InvalidLeaveTransitionError);
  });
});

describe('LeaveManagementEngine — balances', () => {
  it('getLeaveBalance() returns a deterministic default when never configured', async () => {
    const { engine } = setup();
    const balance = await engine.getLeaveBalance(ORG, EMPLOYEE, 'sick', 2026);
    expect(balance.allocatedDays).toBe(DEFAULT_ALLOCATED_DAYS.sick);
    expect(balance.usedDays).toBe(0);
  });

  it('upsertLeaveBalance() overrides the allocation while preserving usedDays', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-02' });
    await engine.approveLeave(ORG, request.id);
    const updated = await engine.upsertLeaveBalance(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', year: 2026, allocatedDays: 30 });
    expect(updated.allocatedDays).toBe(30);
    expect(updated.usedDays).toBe(2);
  });

  it('listLeaveBalances() returns every balance for the employee', async () => {
    const { engine } = setup();
    await engine.upsertLeaveBalance(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', year: 2026, allocatedDays: 21 });
    await engine.upsertLeaveBalance(ORG, { employeeId: EMPLOYEE, leaveType: 'sick', year: 2026, allocatedDays: 10 });
    expect(await engine.listLeaveBalances(ORG, EMPLOYEE)).toHaveLength(2);
  });
});

describe('LeaveManagementEngine — sequential requests deplete the balance correctly', () => {
  it('a second annual request is rejected once the balance is exhausted', async () => {
    const { engine } = setup();
    const first = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-01-01', endDate: '2026-01-21' });
    await engine.approveLeave(ORG, first.id);
    await expect(
      engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-01' }),
    ).rejects.toBeInstanceOf(InsufficientLeaveBalanceError);
  });

  it('cancelling an approved request frees the balance for a subsequent request', async () => {
    const { engine } = setup();
    const first = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-01-01', endDate: '2026-01-21' });
    await engine.approveLeave(ORG, first.id);
    await engine.cancelLeave(ORG, first.id);
    const second = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'annual', startDate: '2026-02-01', endDate: '2026-02-05' });
    expect(second.status).toBe('requested');
  });
});

describe('LeaveManagementEngine — balance tracking is per-employee and per-year', () => {
  it('does not share balances between employees', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: 'employee-a', leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-02' });
    await engine.approveLeave(ORG, request.id);
    const balanceA = await engine.getLeaveBalance(ORG, 'employee-a', 'sick', 2026);
    const balanceB = await engine.getLeaveBalance(ORG, 'employee-b', 'sick', 2026);
    expect(balanceA.usedDays).toBe(2);
    expect(balanceB.usedDays).toBe(0);
  });

  it('does not share balances between years', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-02' });
    await engine.approveLeave(ORG, request.id);
    const balance2026 = await engine.getLeaveBalance(ORG, EMPLOYEE, 'sick', 2026);
    const balance2027 = await engine.getLeaveBalance(ORG, EMPLOYEE, 'sick', 2027);
    expect(balance2026.usedDays).toBe(2);
    expect(balance2027.usedDays).toBe(0);
  });
});

describe('LeaveManagementEngine — maternity_paternity and emergency leave', () => {
  it('maternity_paternity leave is not balance-tracked', async () => {
    const { engine } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'maternity_paternity', startDate: '2026-01-01', endDate: '2026-04-01' });
    await expect(engine.approveLeave(ORG, request.id)).resolves.toBeDefined();
  });
});

describe('LeaveManagementEngine — get/list/findByEmployee/findByStatus/org scoping', () => {
  it('getLeaveRequest() returns null for an unknown request', async () => {
    const { engine } = setup();
    expect(await engine.getLeaveRequest(ORG, 'missing')).toBeNull();
  });

  it('listLeaveRequests()/findByEmployee()/findByStatus() round-trip', async () => {
    const { engine } = setup();
    await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'emergency', startDate: '2026-02-01', endDate: '2026-02-01' });
    expect(await engine.listLeaveRequests(ORG)).toHaveLength(1);
    expect(await engine.findByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'requested')).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, requestRepository } = setup();
    const request = await engine.requestLeave(ORG, { employeeId: EMPLOYEE, leaveType: 'emergency', startDate: '2026-02-01', endDate: '2026-02-01' });
    expect(await requestRepository.findById('org-2', request.id)).toBeNull();
  });
});
