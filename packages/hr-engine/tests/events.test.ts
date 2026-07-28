import { describe, expect, it } from 'vitest';
import { createHrEventBus, HR_EVENT_NAMES } from '../src/events/index.js';

describe('HrEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('employee.hired', (payload) => (seen = payload));
    bus.publish('employee.hired', { organizationId: 'org-1', employeeId: 'e1', departmentId: 'd1', positionId: 'p1' });
    expect(seen).toEqual({ organizationId: 'org-1', employeeId: 'e1', departmentId: 'd1', positionId: 'p1' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createHrEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('leave.requested', { organizationId: 'org-1', leaveRequestId: 'l1', employeeId: 'e1' });
    bus.publish('leave.approved', { organizationId: 'org-1', leaveRequestId: 'l1', employeeId: 'e1' });
    expect(names).toEqual(['leave.requested', 'leave.approved']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createHrEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('employee.terminated', () => (count += 1));
    bus.publish('employee.terminated', { organizationId: 'org-1', employeeId: 'e1' });
    unsubscribe();
    bus.publish('employee.terminated', { organizationId: 'org-1', employeeId: 'e1' });
    expect(count).toBe(1);
  });

  it('delivers employee.promoted with its payload', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('employee.promoted', (payload) => (seen = payload));
    bus.publish('employee.promoted', { organizationId: 'org-1', employeeId: 'e1', positionId: 'p1' });
    expect(seen).toEqual({ organizationId: 'org-1', employeeId: 'e1', positionId: 'p1' });
  });

  it('delivers attendance.recorded with its payload', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('attendance.recorded', (payload) => (seen = payload));
    bus.publish('attendance.recorded', { organizationId: 'org-1', employeeId: 'e1', workSessionId: 'w1', durationMinutes: 480 });
    expect(seen).toEqual({ organizationId: 'org-1', employeeId: 'e1', workSessionId: 'w1', durationMinutes: 480 });
  });

  it('delivers performance.completed with its payload', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('performance.completed', (payload) => (seen = payload));
    bus.publish('performance.completed', { organizationId: 'org-1', evaluationId: 'ev1', employeeId: 'e1', overallRating: 4.5 });
    expect(seen).toEqual({ organizationId: 'org-1', evaluationId: 'ev1', employeeId: 'e1', overallRating: 4.5 });
  });

  it('delivers training.completed with its payload', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('training.completed', (payload) => (seen = payload));
    bus.publish('training.completed', { organizationId: 'org-1', trainingCompletionId: 't1', employeeId: 'e1', courseId: 'c1' });
    expect(seen).toEqual({ organizationId: 'org-1', trainingCompletionId: 't1', employeeId: 'e1', courseId: 'c1' });
  });

  it('delivers payroll.prepared with its payload', () => {
    const bus = createHrEventBus();
    let seen: unknown;
    bus.subscribe('payroll.prepared', (payload) => (seen = payload));
    bus.publish('payroll.prepared', { organizationId: 'org-1', payrollRunId: 'pr1', totalNet: '5000.00' });
    expect(seen).toEqual({ organizationId: 'org-1', payrollRunId: 'pr1', totalNet: '5000.00' });
  });

  it('HR_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(HR_EVENT_NAMES)).toEqual([
      'employee.hired',
      'employee.transferred',
      'employee.promoted',
      'employee.terminated',
      'attendance.recorded',
      'leave.requested',
      'leave.approved',
      'performance.completed',
      'training.completed',
      'payroll.prepared',
    ]);
  });
});
