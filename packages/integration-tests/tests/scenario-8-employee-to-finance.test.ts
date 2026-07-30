/**
 * Scenario 8 — HR operations flowing into the general ledger, composed
 * only through each engine's own real, public runtime API:
 *
 *   Seeded Employees -> Attendance (clock in/out) -> Leave (balance,
 *   request, approval) -> Payroll (a real PayrollRun that genuinely
 *   composes base salary + attendance + leave, per
 *   `PayrollPreparationEngine.preparePayroll`'s own contract) -> a real
 *   Finance tax-withholding calculation reached through HR's own
 *   Relationship Layer (`hr.relationships.recordPayrollTaxWithholding`,
 *   injected with `finance.tax` at composition time, exactly as the
 *   platform's dependency-injection rules require) -> a Finance journal
 *   entry recognizing the payroll expense.
 */
import { describe, expect, it } from 'vitest';
import { createSeededWorld } from './business-fixtures.js';

describe('Scenario 8: Employee -> Attendance -> Leave -> Payroll -> Finance', () => {
  it('runs attendance and leave into a real payroll run, then posts payroll expense to the ledger', async () => {
    const world = await createSeededWorld();
    const { organizationId, employees, accounts, runtimes } = world;
    const { hr, finance } = runtimes;
    const [employeeA, employeeB] = employees;
    if (!employeeA || !employeeB) throw new Error('seeded world must have at least two employees');

    // --- Attendance ---
    const sessionA = await hr.attendance.clockIn(organizationId, employeeA.id, {
      at: '2026-02-02T08:00:00.000Z',
      scheduledStartAt: '2026-02-02T08:00:00.000Z',
    });
    const closedA = await hr.attendance.clockOut(organizationId, sessionA.id, {
      at: '2026-02-02T17:30:00.000Z',
    });
    expect(closedA.status).toBe('closed');
    expect(closedA.overtimeMinutes).toBeGreaterThan(0);

    const sessionB = await hr.attendance.clockIn(organizationId, employeeB.id, {
      at: '2026-02-02T08:00:00.000Z',
    });
    await hr.attendance.clockOut(organizationId, sessionB.id, { at: '2026-02-02T16:00:00.000Z' });

    // --- Leave ---
    await hr.leave.upsertLeaveBalance(organizationId, {
      employeeId: employeeB.id,
      leaveType: 'annual',
      year: 2026,
      allocatedDays: 20,
    });
    const leaveRequest = await hr.leave.requestLeave(organizationId, {
      employeeId: employeeB.id,
      leaveType: 'annual',
      startDate: '2026-02-16',
      endDate: '2026-02-17',
      reason: 'Personal time off',
    });
    const approvedLeave = await hr.leave.approveLeave(organizationId, leaveRequest.id);
    expect(approvedLeave.status).toBe('approved');

    // --- Payroll ---
    const payrollRun = await hr.payroll.preparePayroll(organizationId, {
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
      currency: 'USD',
      employeeIds: [employeeA.id, employeeB.id],
    });
    expect(payrollRun.lines.length).toBe(2);
    expect(Number(payrollRun.totalGross)).toBeGreaterThan(0);

    const finalized = await hr.payroll.finalizePayrollRun(organizationId, payrollRun.id);
    expect(finalized.status).toBe('finalized');

    // --- Finance: real tax withholding via HR's own Relationship Layer ---
    const taxRule = await finance.tax.createTaxRule(organizationId, {
      name: 'Federal Payroll Withholding',
      taxType: 'SALES_TAX',
      ratePct: '15',
    });
    const withholding = await hr.relationships.recordPayrollTaxWithholding(organizationId, {
      taxRuleId: taxRule.id,
      taxableAmount: finalized.totalGross,
    });
    expect(withholding).not.toBeNull();
    expect(Number(withholding?.taxAmount)).toBeCloseTo(Number(finalized.totalGross) * 0.15, 2);

    // --- Finance: post the payroll expense ---
    const journalEntry = await finance.generalLedger.createJournalEntry(organizationId, {
      entryDate: '2026-02-28',
      memo: `Payroll run ${finalized.id}`,
      currency: 'USD',
      lines: [
        {
          accountId: accounts.payrollExpense.id,
          debit: finalized.totalGross,
          credit: '0.00',
          description: 'Gross payroll',
        },
        {
          accountId: accounts.cash.id,
          debit: '0.00',
          credit: finalized.totalGross,
          description: 'Payroll disbursed',
        },
      ],
    });
    const posted = await finance.generalLedger.postJournalEntry(organizationId, journalEntry.id);
    expect(posted.status).toBe('posted');
  });
});
