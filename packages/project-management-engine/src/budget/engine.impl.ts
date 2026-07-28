/**
 * Real Budget Tracking engine — planned budget, actual cost,
 * remaining budget, and cost variance, all deterministic decimal-
 * string arithmetic over this package's own project spend data.
 *
 * **Never implements accounting.** The only place this package
 * touches a general ledger is the Relationship Layer's opt-in
 * `recordProjectCostEntry()`, which composes Finance Engine's own
 * public API — this engine only tracks numbers, it never posts them.
 *
 * @module budget/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import { addAmounts, subtractAmounts, toMoney } from '../shared/decimal.js';
import { ProjectBudgetNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ProjectBudgetId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';
import type { ProjectEventBus } from '../events/project-event-bus.js';
import type { ProjectBudgetRepository } from './repository.js';
import type { ProjectBudget } from './types.js';

/** `plannedBudget - actualCost` — how much spend capacity remains. */
export function computeRemainingBudget(plannedBudget: string, actualCost: string): string {
  return subtractAmounts(plannedBudget, actualCost);
}

/** `plannedBudget - actualCost` — positive means under budget, negative means over budget. */
export function computeCostVariance(plannedBudget: string, actualCost: string): string {
  return subtractAmounts(plannedBudget, actualCost);
}

export interface CreateProjectBudgetInput {
  readonly projectId: ProjectId;
  readonly currency: CurrencyCode;
  readonly plannedBudget: string;
}

export interface BudgetTrackingEngine {
  createBudget(organizationId: OrganizationId, input: CreateProjectBudgetInput): Promise<ProjectBudget>;
  recordCost(organizationId: OrganizationId, budgetId: ProjectBudgetId, amount: string): Promise<ProjectBudget>;
  reviseBudget(organizationId: OrganizationId, budgetId: ProjectBudgetId, plannedBudget: string): Promise<ProjectBudget>;
  close(organizationId: OrganizationId, budgetId: ProjectBudgetId): Promise<ProjectBudget>;
  get(organizationId: OrganizationId, budgetId: ProjectBudgetId): Promise<ProjectBudget | null>;
  list(organizationId: OrganizationId): Promise<readonly ProjectBudget[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectBudget[]>;
  getRemainingBudget(organizationId: OrganizationId, budgetId: ProjectBudgetId): Promise<string>;
  getCostVariance(organizationId: OrganizationId, budgetId: ProjectBudgetId): Promise<string>;
}

/** Creates a real {@link BudgetTrackingEngine}. */
export function createBudgetTrackingEngine(
  repository: ProjectBudgetRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): BudgetTrackingEngine {
  async function requireBudget(organizationId: OrganizationId, budgetId: ProjectBudgetId): Promise<ProjectBudget> {
    const budget = await repository.findById(organizationId, budgetId);
    if (!budget) throw new ProjectBudgetNotFoundError(budgetId);
    return budget;
  }

  function publishUpdate(organizationId: OrganizationId, budget: ProjectBudget): void {
    eventBus?.publish('budget.updated', {
      organizationId,
      budgetId: budget.id,
      projectId: budget.projectId,
      remainingBudget: computeRemainingBudget(budget.plannedBudget, budget.actualCost),
    });
  }

  return {
    async createBudget(organizationId, input) {
      const timestamp = now();
      const budget: ProjectBudget = {
        id: generateId('project-budget'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        currency: input.currency,
        plannedBudget: toMoney(Number.parseFloat(input.plannedBudget) || 0),
        actualCost: '0.00',
        status: 'active',
      };
      await repository.save(budget);
      publishUpdate(organizationId, budget);
      return budget;
    },

    async recordCost(organizationId, budgetId, amount) {
      const budget = await requireBudget(organizationId, budgetId);
      const updated: ProjectBudget = { ...budget, actualCost: addAmounts(budget.actualCost, amount), updatedAt: now() };
      await repository.save(updated);
      publishUpdate(organizationId, updated);
      return updated;
    },

    async reviseBudget(organizationId, budgetId, plannedBudget) {
      const budget = await requireBudget(organizationId, budgetId);
      const updated: ProjectBudget = { ...budget, plannedBudget: toMoney(Number.parseFloat(plannedBudget) || 0), updatedAt: now() };
      await repository.save(updated);
      publishUpdate(organizationId, updated);
      return updated;
    },

    async close(organizationId, budgetId) {
      const budget = await requireBudget(organizationId, budgetId);
      const updated: ProjectBudget = { ...budget, status: 'closed', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, budgetId) {
      return repository.findById(organizationId, budgetId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async getRemainingBudget(organizationId, budgetId) {
      const budget = await requireBudget(organizationId, budgetId);
      return computeRemainingBudget(budget.plannedBudget, budget.actualCost);
    },

    async getCostVariance(organizationId, budgetId) {
      const budget = await requireBudget(organizationId, budgetId);
      return computeCostVariance(budget.plannedBudget, budget.actualCost);
    },
  };
}
