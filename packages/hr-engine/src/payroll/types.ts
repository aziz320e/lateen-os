/** @module payroll/types */
import type { EmployeeId } from '../employee/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PayrollRunId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';

export type { PayrollRunId };

export type PayrollRunStatus = 'draft' | 'finalized';

export interface PayrollAdjustment {
  readonly label: string;
  readonly amount: string;
}

/** One employee's deterministic payroll figures for the run's period. */
export interface PayrollLineItem {
  readonly employeeId: EmployeeId;
  readonly baseSalary: string;
  readonly allowances: readonly PayrollAdjustment[];
  readonly deductions: readonly PayrollAdjustment[];
  readonly overtimePay: string;
  readonly leaveDeductionDays: number;
  readonly leaveDeduction: string;
  readonly grossPay: string;
  readonly netPay: string;
}

/** A prepared payroll batch for a period. Preparation only — never posts to the General Ledger itself. */
export interface PayrollRun extends TenantAuditableEntity<PayrollRunId> {
  readonly periodStart: ISODate;
  readonly periodEnd: ISODate;
  readonly currency: CurrencyCode;
  readonly lines: readonly PayrollLineItem[];
  readonly totalGross: string;
  readonly totalNet: string;
  readonly status: PayrollRunStatus;
}
