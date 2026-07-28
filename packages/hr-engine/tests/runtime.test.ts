import { describe, expect, it } from 'vitest';
import { createHrRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createHrRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createHrRuntime();
    const department = await runtime.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    expect(department.status).toBe('active');
    expect(await runtime.relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createHrRuntime();
    let seen: unknown;
    runtime.events.subscribe('employee.hired', (payload) => (seen = payload));
    const department = await runtime.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await runtime.positions.create(ORG, {
      title: 'Engineer',
      departmentId: department.id,
      jobGrade: 'G1',
      salaryGrade: 'S1',
      baseSalary: '5000.00',
      currency: 'USD',
      headcount: 2,
    });
    const employee = await runtime.employees.hire(ORG, {
      firstName: 'A',
      lastName: 'B',
      email: 'a@x.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '5000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });
    expect(seen).toEqual({ organizationId: ORG, employeeId: employee.id, departmentId: department.id, positionId: position.id });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createHrEventBus } = await import('../src/events/index.js');
    const eventBus = createHrEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createHrRuntime({ eventBus, now: fixedNow });
    const department = await runtime.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    expect(department.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createHrRuntime();
    await runtime.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const result = await runtime.queries.findDepartments({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('payroll.preparePayroll() sees employees hired through employees and overtime recorded through attendance', async () => {
    const runtime = createHrRuntime();
    const department = await runtime.organizationStructure.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await runtime.positions.create(ORG, {
      title: 'Engineer',
      departmentId: department.id,
      jobGrade: 'G1',
      salaryGrade: 'S1',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    const employee = await runtime.employees.hire(ORG, {
      firstName: 'A',
      lastName: 'B',
      email: 'a@x.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '6000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });
    const session = await runtime.attendance.clockIn(ORG, employee.id, { at: '2026-01-15T09:00:00.000Z' });
    await runtime.attendance.clockOut(ORG, session.id, { at: '2026-01-15T19:00:00.000Z' });

    const run = await runtime.payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(run.lines[0]?.overtimePay).not.toBe('0.00');
  });

  it('training completions and performance evaluations are independently accessible off the same runtime', async () => {
    const runtime = createHrRuntime();
    const course = await runtime.training.createCourse(ORG, { title: 'Onboarding', durationHours: 1 });
    await runtime.training.recordCompletion(ORG, { employeeId: 'employee-1', courseId: course.id, completedAt: '2026-01-01' });
    const period = await runtime.performance.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    const evaluation = await runtime.performance.createEvaluation(ORG, { employeeId: 'employee-1', reviewPeriodId: period.id, objectiveRatings: [] });
    expect((await runtime.queries.findTraining({ organizationId: ORG })).total).toBe(1);
    expect((await runtime.queries.findPerformance({ organizationId: ORG })).total).toBe(1);
    expect(evaluation.employeeId).toBe('employee-1');
  });

  it('leave.approveLeave() balance deduction is visible through leave.getLeaveBalance()', async () => {
    const runtime = createHrRuntime();
    const request = await runtime.leave.requestLeave(ORG, { employeeId: 'employee-1', leaveType: 'sick', startDate: '2026-02-01', endDate: '2026-02-02' });
    await runtime.leave.approveLeave(ORG, request.id);
    const balance = await runtime.leave.getLeaveBalance(ORG, 'employee-1', 'sick', 2026);
    expect(balance.usedDays).toBe(2);
  });

  it('searchHr() finds records created through the runtime engines', async () => {
    const runtime = createHrRuntime();
    await runtime.organizationStructure.create(ORG, { code: 'UNIQUE', name: 'UniqueDeptName', unitType: 'department' });
    const result = await runtime.queries.searchHr({ organizationId: ORG, keyword: 'UniqueDeptName' });
    expect(result.total).toBe(1);
  });
});
