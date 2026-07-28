/** @module budget/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { ProjectBudgetId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';

export type { ProjectBudgetId };

export type ProjectBudgetStatus = 'active' | 'closed';

/**
 * The project's own deterministic view of planned vs. actual spend.
 * This module never posts a ledger entry itself — only the
 * Relationship Layer's `recordProjectCostEntry()` ever touches Finance
 * Engine's real General Ledger, and only when a caller opts in.
 */
export interface ProjectBudget extends TenantAuditableEntity<ProjectBudgetId> {
  readonly projectId: ProjectId;
  readonly currency: CurrencyCode;
  readonly plannedBudget: string;
  readonly actualCost: string;
  readonly status: ProjectBudgetStatus;
}
