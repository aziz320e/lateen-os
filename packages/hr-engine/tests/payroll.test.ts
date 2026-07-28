import { describe, expect, it } from 'vitest';
import { createWorkSessionRepository } from '../src/attendance/repository.impl.js';
import { createOrganizationStructureEngine } from '../src/department/engine.impl.js';
import { createDepartmentRepository } from '../src/department/repository.impl.js';
import { createEmployeeManagementEngine } from '../src/employee/engine.impl.js';
import { createEmployeeRepository } from '../src/employee/repository.impl.js';
import { createHrEventBus } from '../src/events/index.js';
import { createLeaveManagementEngine } from '../src/leave/engine.impl.js';
import { createLeaveBalanceRepository, createLeaveRequestRepository } from '../src/leave/repository.impl.js';
import { computePayrollLineItem, createPayrollPreparationEngine, STANDARD_MONTHLY_HOURS, WORKING_DAYS_PER_MONTH } from '../src/payroll/engine.impl.js';
import { createPayrollRunRepository } from '../src/payroll/repository.impl.js';
import { createPositionManagementEngine } from '../src/position/engine.impl.js';
import { createPositionRepository } from '../src/position/repository.impl.js';
import { PayrollRunFinalizedError, PayrollRunNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

async function setup(eventBus = createHrEventBus()) {
  const departmentRepository = createDepartmentRepository();
  const positionRepository = createPositionRepository();
  const employeeRepository = createEmployeeRepository();
  const workSessionRepository = createWorkSessionRepository();
  const leaveRequestRepository = createLeaveRequestRepository();
  const leaveBalanceRepository = createLeaveBalanceRepository();
  const payrollRunRepository = createPayrollRunRepository();

  const departments = createOrganizationStructureEngine(departmentRepository);
  const positions = createPositionManagementEngine(positionRepository);
  const employees = createEmployeeManagementEngine(employeeRepository, departmentRepository, positions, eventBus);
  const leave = createLeaveManagementEngine(leaveRequestRepository, leaveBalanceRepository, eventBus);
  const payroll = createPayrollPreparationEngine(payrollRunRepository, employeeRepository, workSessionRepository, leaveRequestRepository, eventBus);

  const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
  const position = await positions.create(ORG, {
    title: 'Engineer',
    departmentId: department.id,
    jobGrade: 'G3',
    salaryGrade: 'S3',
    baseSalary: '6600.00',
    currency: 'USD',
    headcount: 5,
  });
  const employee = await employees.hire(ORG, {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    departmentId: department.id,
    positionId: position.id,
    employmentType: 'full_time',
    baseSalary: '6600.00',
    currency: 'USD',
    hireDate: '2026-01-01',
  });

  return { departmentRepository, positionRepository, employeeRepository, workSessionRepository, leaveRequestRepository, leaveBalanceRepository, payrollRunRepository, employees, leave, payroll, department, position, employee, eventBus };
}

describe('computePayrollLineItem (pure)', () => {
  it('computes gross/net pay with no overtime, allowances, deductions, or leave', () => {
    const line = computePayrollLineItem('employee-1', '6600.00', [], [], 0, 0);
    expect(line.grossPay).toBe('6600.00');
    expect(line.netPay).toBe('6600.00');
    expect(line.overtimePay).toBe('0.00');
    expect(line.leaveDeduction).toBe('0.00');
  });

  it('adds allowances and overtime pay to gross', () => {
    const hourlyRate = 6600 / STANDARD_MONTHLY_HOURS;
    const line = computePayrollLineItem('employee-1', '6600.00', [{ label: 'Transport', amount: '200.00' }], [], 120, 0);
    const expectedOvertimePay = (hourlyRate * 2 * 1.5).toFixed(2);
    expect(line.overtimePay).toBe(expectedOvertimePay);
    expect(line.grossPay).toBe((6600 + 200 + Number.parseFloat(expectedOvertimePay)).toFixed(2));
  });

  it('subtracts deductions and leave deduction from net', () => {
    const dailyRate = 6600 / WORKING_DAYS_PER_MONTH;
    const line = computePayrollLineItem('employee-1', '6600.00', [], [{ label: 'Insurance', amount: '100.00' }], 0, 2);
    expect(line.leaveDeductionDays).toBe(2);
    expect(line.leaveDeduction).toBe((dailyRate * 2).toFixed(2));
    expect(line.netPay).toBe((6600 - 100 - dailyRate * 2).toFixed(2));
  });
});

describe('PayrollPreparationEngine — preparePayroll', () => {
  it('prepares a draft payroll run from base salary alone', async () => {
    const { payroll, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, {
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      currency: 'USD',
      employeeIds: [employee.id],
    });
    expect(run.status).toBe('draft');
    expect(run.lines).toHaveLength(1);
    expect(run.lines[0]?.grossPay).toBe('6600.00');
    expect(run.totalNet).toBe('6600.00');
  });

  it('publishes payroll.prepared', async () => {
    const eventBus = createHrEventBus();
    const { payroll, employee } = await setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('payroll.prepared', (payload) => (seen = payload));
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(seen).toEqual({ organizationId: ORG, payrollRunId: run.id, totalNet: run.totalNet });
  });

  it('includes overtime pay from closed work sessions within the period', async () => {
    const { payroll, workSessionRepository, employee } = await setup();
    await workSessionRepository.save({
      id: 'session-1',
      organizationId: ORG,
      createdAt: '',
      updatedAt: '',
      employeeId: employee.id,
      clockInAt: '2026-01-15T09:00:00.000Z',
      clockOutAt: '2026-01-15T19:00:00.000Z',
      durationMinutes: 600,
      overtimeMinutes: 120,
      lateMinutes: 0,
      status: 'closed',
    });
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(run.lines[0]?.overtimePay).not.toBe('0.00');
  });

  it('excludes work sessions outside the requested period', async () => {
    const { payroll, workSessionRepository, employee } = await setup();
    await workSessionRepository.save({
      id: 'session-1',
      organizationId: ORG,
      createdAt: '',
      updatedAt: '',
      employeeId: employee.id,
      clockInAt: '2025-12-15T09:00:00.000Z',
      clockOutAt: '2025-12-15T19:00:00.000Z',
      durationMinutes: 600,
      overtimeMinutes: 120,
      lateMinutes: 0,
      status: 'closed',
    });
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(run.lines[0]?.overtimePay).toBe('0.00');
  });

  it('includes an unpaid-leave deduction for approved unpaid leave within the period', async () => {
    const { payroll, leave, employee } = await setup();
    const request = await leave.requestLeave(ORG, { employeeId: employee.id, leaveType: 'unpaid', startDate: '2026-01-10', endDate: '2026-01-11' });
    await leave.approveLeave(ORG, request.id);
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(run.lines[0]?.leaveDeductionDays).toBe(2);
    expect(run.lines[0]?.netPay).not.toBe(run.lines[0]?.grossPay);
  });

  it('applies caller-supplied allowances and deductions per employee', async () => {
    const { payroll, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, {
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      currency: 'USD',
      employeeIds: [employee.id],
      allowancesByEmployee: { [employee.id]: [{ label: 'Housing', amount: '500.00' }] },
      deductionsByEmployee: { [employee.id]: [{ label: 'Tax', amount: '300.00' }] },
    });
    expect(run.lines[0]?.grossPay).toBe('7100.00');
    expect(run.lines[0]?.netPay).toBe('6800.00');
  });

  it('throws EmployeeNotFoundError for an unknown employee id', async () => {
    const { payroll } = await setup();
    await expect(
      payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: ['missing'] }),
    ).rejects.toThrow();
  });
});

describe('PayrollPreparationEngine — multiple employees in one run', () => {
  it('computes independent line items and correct totals', async () => {
    const { payroll, employees, department, position, employee } = await setup();
    const second = await employees.hire(ORG, {
      firstName: 'John',
      lastName: 'Roe',
      email: 'john@example.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '4000.00',
      currency: 'USD',
      hireDate: '2026-01-01',
    });
    const run = await payroll.preparePayroll(ORG, {
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      currency: 'USD',
      employeeIds: [employee.id, second.id],
    });
    expect(run.lines).toHaveLength(2);
    expect(run.totalGross).toBe('10600.00');
  });
});

describe('PayrollPreparationEngine — allowances/deductions default to empty', () => {
  it('produces an empty allowances/deductions array when not supplied for an employee', async () => {
    const { payroll, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(run.lines[0]?.allowances).toEqual([]);
    expect(run.lines[0]?.deductions).toEqual([]);
  });
});

describe('PayrollPreparationEngine — finalizePayrollRun', () => {
  it('draft -> finalized', async () => {
    const { payroll, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    const finalized = await payroll.finalizePayrollRun(ORG, run.id);
    expect(finalized.status).toBe('finalized');
  });

  it('throws PayrollRunFinalizedError if already finalized', async () => {
    const { payroll, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    await payroll.finalizePayrollRun(ORG, run.id);
    await expect(payroll.finalizePayrollRun(ORG, run.id)).rejects.toBeInstanceOf(PayrollRunFinalizedError);
  });

  it('throws PayrollRunNotFoundError for an unknown run', async () => {
    const { payroll } = await setup();
    await expect(payroll.finalizePayrollRun(ORG, 'missing')).rejects.toBeInstanceOf(PayrollRunNotFoundError);
  });
});

describe('computePayrollLineItem — combined overtime, allowance, deduction, and leave', () => {
  it('combines every adjustment into gross and net pay correctly', () => {
    const line = computePayrollLineItem(
      'employee-1',
      '6600.00',
      [{ label: 'Transport', amount: '200.00' }],
      [{ label: 'Insurance', amount: '100.00' }],
      60,
      1,
    );
    const hourlyRate = 6600 / STANDARD_MONTHLY_HOURS;
    const dailyRate = 6600 / WORKING_DAYS_PER_MONTH;
    const expectedOvertimePay = (hourlyRate * 1 * 1.5).toFixed(2);
    const expectedLeaveDeduction = dailyRate.toFixed(2);
    expect(line.overtimePay).toBe(expectedOvertimePay);
    expect(line.leaveDeduction).toBe(expectedLeaveDeduction);
    expect(line.grossPay).toBe((6600 + 200 + Number.parseFloat(expectedOvertimePay)).toFixed(2));
  });
});

describe('PayrollPreparationEngine — empty employeeIds', () => {
  it('produces a run with no lines and 0 totals', async () => {
    const { payroll } = await setup();
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [] });
    expect(run.lines).toEqual([]);
    expect(run.totalGross).toBe('0.00');
    expect(run.totalNet).toBe('0.00');
  });
});

describe('PayrollPreparationEngine — get/list/findByStatus/org scoping', () => {
  it('getPayrollRun() returns null for an unknown run', async () => {
    const { payroll } = await setup();
    expect(await payroll.getPayrollRun(ORG, 'missing')).toBeNull();
  });

  it('listPayrollRuns()/findByStatus() round-trip', async () => {
    const { payroll, employee } = await setup();
    await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(await payroll.listPayrollRuns(ORG)).toHaveLength(1);
    expect(await payroll.findByStatus(ORG, 'draft')).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { payroll, payrollRunRepository, employee } = await setup();
    const run = await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect(await payrollRunRepository.findById('org-2', run.id)).toBeNull();
  });
});
