import { describe, expect, it } from 'vitest';
import { createProjectEventBus } from '../src/events/index.js';
import { computeCostVariance, computeRemainingBudget, createBudgetTrackingEngine } from '../src/budget/engine.impl.js';
import { createProjectBudgetRepository } from '../src/budget/repository.impl.js';
import { ProjectBudgetNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const PROJECT = 'project-1';

function setup() {
  const eventBus = createProjectEventBus();
  const engine = createBudgetTrackingEngine(createProjectBudgetRepository(), eventBus);
  return { engine, eventBus };
}

describe('computeRemainingBudget / computeCostVariance (pure)', () => {
  it('computeRemainingBudget subtracts actual cost from planned budget', () => {
    expect(computeRemainingBudget('10000.00', '4000.00')).toBe('6000.00');
  });

  it('computeCostVariance is negative when over budget', () => {
    expect(computeCostVariance('10000.00', '12000.00')).toBe('-2000.00');
  });
});

describe('BudgetTrackingEngine', () => {
  it('createBudget() starts at active status with zero actual cost', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    expect(budget.status).toBe('active');
    expect(budget.actualCost).toBe('0.00');
  });

  it('publishes budget.updated on create with the initial remaining budget', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('budget.updated', (payload) => (seen = payload));
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    expect(seen).toEqual({ organizationId: ORG, budgetId: budget.id, projectId: PROJECT, remainingBudget: '10000.00' });
  });

  it('recordCost() accumulates actual cost and publishes budget.updated', async () => {
    const { engine, eventBus } = setup();
    const seen: unknown[] = [];
    eventBus.subscribe('budget.updated', (payload) => seen.push(payload));
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    const updated = await engine.recordCost(ORG, budget.id, '2500.00');
    expect(updated.actualCost).toBe('2500.00');
    const afterSecond = await engine.recordCost(ORG, budget.id, '1500.00');
    expect(afterSecond.actualCost).toBe('4000.00');
    expect(seen).toHaveLength(3);
  });

  it('reviseBudget() changes the planned amount', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    const revised = await engine.reviseBudget(ORG, budget.id, '12000.00');
    expect(revised.plannedBudget).toBe('12000.00');
  });

  it('close() marks the budget closed', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    const closed = await engine.close(ORG, budget.id);
    expect(closed.status).toBe('closed');
  });

  it('getRemainingBudget() and getCostVariance() reflect recorded costs', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    await engine.recordCost(ORG, budget.id, '3000.00');
    expect(await engine.getRemainingBudget(ORG, budget.id)).toBe('7000.00');
    expect(await engine.getCostVariance(ORG, budget.id)).toBe('7000.00');
  });

  it('getCostVariance() is negative when spend exceeds the plan', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '1000.00' });
    await engine.recordCost(ORG, budget.id, '1500.00');
    expect(await engine.getCostVariance(ORG, budget.id)).toBe('-500.00');
  });

  it('recordCost() throws for an unknown budget', async () => {
    const { engine } = setup();
    await expect(engine.recordCost(ORG, 'missing', '100.00')).rejects.toBeInstanceOf(ProjectBudgetNotFoundError);
  });

  it('findByProject filters correctly, get()/list() work as expected', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    await engine.createBudget(ORG, { projectId: 'other-project', currency: 'USD', plannedBudget: '5000.00' });

    expect(await engine.findByProject(ORG, PROJECT)).toEqual([budget]);
    expect(await engine.get(ORG, budget.id)).toEqual(budget);
    expect(await engine.list(ORG)).toHaveLength(2);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('close()/reviseBudget() throw ProjectBudgetNotFoundError for an unknown budget', async () => {
    const { engine } = setup();
    await expect(engine.close(ORG, 'missing')).rejects.toBeInstanceOf(ProjectBudgetNotFoundError);
    await expect(engine.reviseBudget(ORG, 'missing', '1.00')).rejects.toBeInstanceOf(ProjectBudgetNotFoundError);
  });

  it('budgets are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '1000.00' });
    await engine.createBudget('org-2', { projectId: PROJECT, currency: 'USD', plannedBudget: '1000.00' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('createBudget() truncates a malformed plannedBudget input to a valid decimal string', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: 'not-a-number' });
    expect(budget.plannedBudget).toBe('0.00');
  });

  it('recordCost() can accumulate multiple costs from different sources', async () => {
    const { engine } = setup();
    const budget = await engine.createBudget(ORG, { projectId: PROJECT, currency: 'USD', plannedBudget: '10000.00' });
    await engine.recordCost(ORG, budget.id, '1000.00');
    await engine.recordCost(ORG, budget.id, '2500.50');
    const final = await engine.recordCost(ORG, budget.id, '99.50');
    expect(final.actualCost).toBe('3600.00');
  });
});
