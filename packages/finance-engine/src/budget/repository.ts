/** @module budget/repository */
import type { Repository } from '../shared/repository.js';
import type { BudgetId, BudgetRevisionId, FiscalYearId, OrganizationId } from '../shared/identifiers.js';
import type { Budget, BudgetRevision, BudgetScope } from './types.js';

export interface BudgetRepository extends Repository<Budget, BudgetId> {
  findAll(organizationId: OrganizationId): Promise<readonly Budget[]>;
  findByScope(organizationId: OrganizationId, scope: BudgetScope): Promise<readonly Budget[]>;
  findByFiscalYear(organizationId: OrganizationId, fiscalYearId: FiscalYearId): Promise<readonly Budget[]>;
}

export interface BudgetRevisionRepository extends Repository<BudgetRevision, BudgetRevisionId> {
  findByBudgetId(organizationId: OrganizationId, budgetId: BudgetId): Promise<readonly BudgetRevision[]>;
}
