/**
 * Real Payroll Preparation engine — deterministic gross/net pay
 * figures composed from this package's own Employee, Attendance
 * (overtime), and Leave (unpaid-leave deduction) data. **Preparation
 * only** — this engine never posts to a General Ledger or creates any
 * accounting record; it produces the numbers a caller can then choose
 * to push through Finance Engine's own public API via the
 * Relationship Layer.
 *
 * @module payroll/engine.impl
 */
import type { WorkSessionRepository } from '../attendance/repository.js';
import type { EmployeeRepository } from '../employee/repository.js';
import type { EmployeeId } from '../employee/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import type { LeaveRequestRepository } from '../leave/repository.js';
import { addAmounts, multiplyAmount, subtractAmounts, sumAmounts, toMoney } from '../shared/decimal.js';
import { EmployeeNotFoundError, PayrollRunFinalizedError, PayrollRunNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PayrollRunId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';
import type { PayrollRunRepository } from './repository.js';
import type { PayrollAdjustment, PayrollLineItem, PayrollRun, PayrollRunStatus } from './types.js';

/** Deterministic standard hours/month used to derive an hourly rate from a monthly base salary. */
export const STANDARD_MONTHLY_HOURS = 160;
/** Deterministic overtime pay multiplier. */
export const OVERTIME_MULTIPLIER = 1.5;
/** Deterministic working days/month used to derive a daily rate for unpaid-leave deduction. */
export const WORKING_DAYS_PER_MONTH = 22;

/** Pure: gross/net payroll figures for one employee over one period. */
export function computePayrollLineItem(
  employeeId: EmployeeId,
  baseSalary: string,
  allowances: readonly PayrollAdjustment[],
  deductions: readonly PayrollAdjustment[],
  overtimeMinutes: number,
  leaveDeductionDays: number,
): PayrollLineItem {
  const hourlyRate = Number.parseFloat(baseSalary) / STANDARD_MONTHLY_HOURS;
  const overtimeHours = overtimeMinutes / 60;
  const overtimePay = toMoney(hourlyRate * overtimeHours * OVERTIME_MULTIPLIER);

  const dailyRate = Number.parseFloat(baseSalary) / WORKING_DAYS_PER_MONTH;
  const leaveDeduction = toMoney(dailyRate * leaveDeductionDays);

  const allowanceTotal = sumAmounts(allowances.map((allowance) => allowance.amount));
  const deductionTotal = sumAmounts(deductions.map((deduction) => deduction.amount));

  const grossPay = addAmounts(addAmounts(baseSalary, allowanceTotal), overtimePay);
  const netPay = subtractAmounts(subtractAmounts(grossPay, deductionTotal), leaveDeduction);

  return {
    employeeId,
    baseSalary,
    allowances,
    deductions,
    overtimePay,
    leaveDeductionDays,
    leaveDeduction,
    grossPay,
    netPay,
  };
}

export interface PreparePayrollInput {
  readonly periodStart: ISODate;
  readonly periodEnd: ISODate;
  readonly currency: CurrencyCode;
  readonly employeeIds: readonly EmployeeId[];
  readonly allowancesByEmployee?: Readonly<Record<string, readonly PayrollAdjustment[]>>;
  readonly deductionsByEmployee?: Readonly<Record<string, readonly PayrollAdjustment[]>>;
}

export interface PayrollPreparationEngine {
  /** Composes Employee base salary, Attendance overtime, and Leave unpaid-days into one deterministic, persisted `PayrollRun`. Publishes `payroll.prepared`. */
  preparePayroll(organizationId: OrganizationId, input: PreparePayrollInput): Promise<PayrollRun>;
  finalizePayrollRun(organizationId: OrganizationId, payrollRunId: PayrollRunId): Promise<PayrollRun>;
  getPayrollRun(organizationId: OrganizationId, payrollRunId: PayrollRunId): Promise<PayrollRun | null>;
  listPayrollRuns(organizationId: OrganizationId): Promise<readonly PayrollRun[]>;
  findByStatus(organizationId: OrganizationId, status: PayrollRunStatus): Promise<readonly PayrollRun[]>;
}

/** Creates a real {@link PayrollPreparationEngine}. */
export function createPayrollPreparationEngine(
  payrollRunRepository: PayrollRunRepository,
  employeeRepository: EmployeeRepository,
  workSessionRepository: WorkSessionRepository,
  leaveRequestRepository: LeaveRequestRepository,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): PayrollPreparationEngine {
  async function requirePayrollRun(organizationId: OrganizationId, payrollRunId: PayrollRunId): Promise<PayrollRun> {
    const run = await payrollRunRepository.findById(organizationId, payrollRunId);
    if (!run) throw new PayrollRunNotFoundError(payrollRunId);
    return run;
  }

  return {
    async preparePayroll(organizationId, input) {
      const lines: PayrollLineItem[] = [];

      for (const employeeId of input.employeeIds) {
        const employee = await employeeRepository.findById(organizationId, employeeId);
        if (!employee) throw new EmployeeNotFoundError(employeeId);

        const sessions = await workSessionRepository.findByEmployee(organizationId, employeeId);
        const overtimeMinutes = sessions
          .filter((session) => session.status === 'closed' && session.clockInAt >= input.periodStart && session.clockInAt <= input.periodEnd)
          .reduce((total, session) => total + (session.overtimeMinutes ?? 0), 0);

        const leaveRequests = await leaveRequestRepository.findByEmployee(organizationId, employeeId);
        const leaveDeductionDays = leaveRequests
          .filter(
            (request) =>
              request.leaveType === 'unpaid' &&
              (request.status === 'approved' || request.status === 'completed') &&
              request.startDate >= input.periodStart &&
              request.startDate <= input.periodEnd,
          )
          .reduce((total, request) => total + request.daysRequested, 0);

        const allowances = input.allowancesByEmployee?.[employeeId] ?? [];
        const deductions = input.deductionsByEmployee?.[employeeId] ?? [];

        lines.push(computePayrollLineItem(employeeId, employee.baseSalary, allowances, deductions, overtimeMinutes, leaveDeductionDays));
      }

      const timestamp = now();
      const run: PayrollRun = {
        id: generateId('payroll-run'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        currency: input.currency,
        lines,
        totalGross: sumAmounts(lines.map((line) => line.grossPay)),
        totalNet: sumAmounts(lines.map((line) => line.netPay)),
        status: 'draft',
      };
      await payrollRunRepository.save(run);
      eventBus?.publish('payroll.prepared', { organizationId, payrollRunId: run.id, totalNet: run.totalNet });
      return run;
    },

    async finalizePayrollRun(organizationId, payrollRunId) {
      const run = await requirePayrollRun(organizationId, payrollRunId);
      if (run.status === 'finalized') throw new PayrollRunFinalizedError(payrollRunId);
      const updated: PayrollRun = { ...run, status: 'finalized', updatedAt: now() };
      await payrollRunRepository.save(updated);
      return updated;
    },

    async getPayrollRun(organizationId, payrollRunId) {
      return payrollRunRepository.findById(organizationId, payrollRunId);
    },

    async listPayrollRuns(organizationId) {
      return payrollRunRepository.findAll(organizationId);
    },

    async findByStatus(organizationId, status) {
      return payrollRunRepository.findByStatus(organizationId, status);
    },
  };
}
