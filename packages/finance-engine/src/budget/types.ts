/** @module budget/types */
import type { AccountId } from '../account/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { BudgetId, BudgetRevisionId, DepartmentId, FiscalYearId, ProjectId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';

export type { BudgetId, BudgetRevisionId };

export type BudgetScope = 'annual' | 'department' | 'project';
export type BudgetStatus = 'draft' | 'approved' | 'revised' | 'closed';

export interface BudgetLine {
  readonly accountId: AccountId;
  readonly plannedAmount: string;
}

/** A planned spend/revenue envelope for a fiscal year, optionally scoped to one department or project. */
export interface Budget extends TenantAuditableEntity<BudgetId> {
  readonly name: string;
  readonly scope: BudgetScope;
  readonly fiscalYearId: FiscalYearId;
  readonly departmentId?: DepartmentId;
  readonly projectId?: ProjectId;
  readonly lines: readonly BudgetLine[];
  readonly currency: CurrencyCode;
  readonly status: BudgetStatus;
  readonly currentVersion: number;
}

/** An immutable snapshot of a {@link Budget}'s lines at one point in its revision history. */
export interface BudgetRevision extends TenantAuditableEntity<BudgetRevisionId> {
  readonly budgetId: BudgetId;
  readonly version: number;
  readonly lines: readonly BudgetLine[];
  readonly reason?: string;
}

export interface BudgetVarianceLine {
  readonly accountId: AccountId;
  readonly plannedAmount: string;
  readonly actualAmount: string;
  readonly variance: string;
  readonly variancePct: string;
}

/** Deterministic actual-vs-budget comparison, one line per budgeted account. */
export interface BudgetVarianceReport {
  readonly budgetId: BudgetId;
  readonly lines: readonly BudgetVarianceLine[];
  readonly totalPlanned: string;
  readonly totalActual: string;
  readonly totalVariance: string;
}
