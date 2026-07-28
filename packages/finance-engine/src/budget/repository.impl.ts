/** Real, in-memory Budget repositories. @module budget/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BudgetRepository, BudgetRevisionRepository } from './repository.js';
import type { Budget, BudgetRevision } from './types.js';

/** Creates a real, in-memory {@link BudgetRepository}. */
export function createBudgetRepository(seed?: readonly Budget[]): BudgetRepository {
  const repo = createInMemoryRepository<Budget>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByScope(organizationId, scope) {
      return repo.list(organizationId).filter((budget) => budget.scope === scope);
    },
    async findByFiscalYear(organizationId, fiscalYearId) {
      return repo.list(organizationId).filter((budget) => budget.fiscalYearId === fiscalYearId);
    },
  };
}

/** Creates a real, in-memory {@link BudgetRevisionRepository}. */
export function createBudgetRevisionRepository(seed?: readonly BudgetRevision[]): BudgetRevisionRepository {
  const repo = createInMemoryRepository<BudgetRevision>({ seed });
  return {
    ...repo,
    async findByBudgetId(organizationId, budgetId) {
      return repo.list(organizationId)
        .filter((revision) => revision.budgetId === budgetId)
        .sort((a, b) => a.version - b.version);
    },
  };
}
