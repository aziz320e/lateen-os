/**
 * Real Budget engine — annual/department/project budgets with a
 * guarded lifecycle and full revision history, plus deterministic
 * actual-vs-budget variance computed directly from posted General
 * Ledger journal entries (intra-package composition — no new
 * accounting logic is introduced here).
 *
 * @module budget/engine.impl
 */
import type { AccountRepository } from '../account/repository.js';
import { computeAccountNetAmount } from '../journal-entry/engine.impl.js';
import type { JournalEntryRepository } from '../journal-entry/repository.js';
import { parseDecimal, subtractAmounts, sumAmounts, toMoney } from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { BudgetNotFoundError, InvalidBudgetTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { BudgetId, DepartmentId, FiscalYearId, OrganizationId, ProjectId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';
import type { BudgetRepository, BudgetRevisionRepository } from './repository.js';
import type { Budget, BudgetLine, BudgetRevision, BudgetScope, BudgetStatus, BudgetVarianceLine, BudgetVarianceReport } from './types.js';

const BUDGET_TRANSITIONS: Readonly<Record<BudgetStatus, readonly BudgetStatus[]>> = {
  draft: ['approved'],
  approved: ['revised', 'closed'],
  revised: ['approved', 'closed'],
  closed: [],
};

/** Whether a budget may transition from one status to another via `approve()`/`close()`. */
export function canTransitionBudget(from: BudgetStatus, to: BudgetStatus): boolean {
  return BUDGET_TRANSITIONS[from].includes(to);
}

/** Pure: variance and variance percentage of actual against planned (`0` percent when planned is `0`). */
export function computeVariance(plannedAmount: string, actualAmount: string): { variance: string; variancePct: string } {
  const variance = subtractAmounts(actualAmount, plannedAmount);
  const planned = parseDecimal(plannedAmount);
  const variancePct = planned === 0 ? '0.00' : toMoney((parseDecimal(variance) / Math.abs(planned)) * 100);
  return { variance, variancePct };
}

export interface CreateBudgetInput {
  readonly name: string;
  readonly scope: BudgetScope;
  readonly fiscalYearId: FiscalYearId;
  readonly departmentId?: DepartmentId;
  readonly projectId?: ProjectId;
  readonly lines: readonly BudgetLine[];
  readonly currency: CurrencyCode;
}

export interface BudgetEngine {
  createBudget(organizationId: OrganizationId, input: CreateBudgetInput): Promise<Budget>;
  reviseBudget(organizationId: OrganizationId, budgetId: BudgetId, lines: readonly BudgetLine[], reason?: string): Promise<Budget>;
  approveBudget(organizationId: OrganizationId, budgetId: BudgetId): Promise<Budget>;
  closeBudget(organizationId: OrganizationId, budgetId: BudgetId): Promise<Budget>;
  getBudget(organizationId: OrganizationId, budgetId: BudgetId): Promise<Budget | null>;
  listBudgets(organizationId: OrganizationId): Promise<readonly Budget[]>;
  getRevisionHistory(organizationId: OrganizationId, budgetId: BudgetId): Promise<readonly BudgetRevision[]>;

  /** Deterministic actual-vs-budget, summing posted journal entries dated within `[periodStart, periodEnd]`. */
  computeActualVsBudget(organizationId: OrganizationId, budgetId: BudgetId, periodStart: ISODate, periodEnd: ISODate): Promise<BudgetVarianceReport>;
}

/** Creates a real {@link BudgetEngine}. */
export function createBudgetEngine(
  repository: BudgetRepository,
  revisionRepository: BudgetRevisionRepository,
  journalEntryRepository: JournalEntryRepository,
  accountRepository: AccountRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): BudgetEngine {
  async function requireBudget(organizationId: OrganizationId, budgetId: BudgetId): Promise<Budget> {
    const budget = await repository.findById(organizationId, budgetId);
    if (!budget) throw new BudgetNotFoundError(budgetId);
    return budget;
  }

  async function snapshot(budget: Budget, reason?: string): Promise<void> {
    const revision: BudgetRevision = {
      id: generateId('budget-revision'),
      organizationId: budget.organizationId,
      createdAt: budget.updatedAt,
      updatedAt: budget.updatedAt,
      budgetId: budget.id,
      version: budget.currentVersion,
      lines: budget.lines,
      reason,
    };
    await revisionRepository.save(revision);
  }

  return {
    async createBudget(organizationId, input) {
      const timestamp = now();
      const budget: Budget = {
        id: generateId('budget'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        scope: input.scope,
        fiscalYearId: input.fiscalYearId,
        departmentId: input.departmentId,
        projectId: input.projectId,
        lines: input.lines,
        currency: input.currency,
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(budget);
      await snapshot(budget);
      return budget;
    },

    async reviseBudget(organizationId, budgetId, lines, reason) {
      const budget = await requireBudget(organizationId, budgetId);
      if (budget.status === 'closed') {
        throw new InvalidBudgetTransitionError(budgetId, budget.status, 'revised');
      }
      const updated: Budget = { ...budget, lines, status: 'revised', currentVersion: budget.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      await snapshot(updated, reason);
      eventBus?.publish('budget.updated', { organizationId, budgetId });
      return updated;
    },

    async approveBudget(organizationId, budgetId) {
      const budget = await requireBudget(organizationId, budgetId);
      if (!canTransitionBudget(budget.status, 'approved')) {
        throw new InvalidBudgetTransitionError(budgetId, budget.status, 'approved');
      }
      const updated: Budget = { ...budget, status: 'approved', currentVersion: budget.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async closeBudget(organizationId, budgetId) {
      const budget = await requireBudget(organizationId, budgetId);
      if (!canTransitionBudget(budget.status, 'closed')) {
        throw new InvalidBudgetTransitionError(budgetId, budget.status, 'closed');
      }
      const updated: Budget = { ...budget, status: 'closed', currentVersion: budget.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getBudget(organizationId, budgetId) {
      return repository.findById(organizationId, budgetId);
    },

    async listBudgets(organizationId) {
      return repository.findAll(organizationId);
    },

    async getRevisionHistory(organizationId, budgetId) {
      return revisionRepository.findByBudgetId(organizationId, budgetId);
    },

    async computeActualVsBudget(organizationId, budgetId, periodStart, periodEnd) {
      const budget = await requireBudget(organizationId, budgetId);
      const postedEntries = (await journalEntryRepository.findAll(organizationId)).filter(
        (entry) => entry.status === 'posted' && entry.entryDate >= periodStart && entry.entryDate <= periodEnd,
      );

      const lines: BudgetVarianceLine[] = [];
      for (const budgetLine of budget.lines) {
        const account = await accountRepository.findById(organizationId, budgetLine.accountId);
        const normalBalance = account?.normalBalance ?? 'debit';
        const actualAmount = computeAccountNetAmount(postedEntries, budgetLine.accountId, normalBalance);
        const { variance, variancePct } = computeVariance(budgetLine.plannedAmount, actualAmount);
        lines.push({ accountId: budgetLine.accountId, plannedAmount: budgetLine.plannedAmount, actualAmount, variance, variancePct });
      }

      const totalPlanned = sumAmounts(lines.map((line) => line.plannedAmount));
      const totalActual = sumAmounts(lines.map((line) => line.actualAmount));
      return { budgetId, lines, totalPlanned, totalActual, totalVariance: subtractAmounts(totalActual, totalPlanned) };
    },
  };
}
