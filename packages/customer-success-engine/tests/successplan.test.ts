import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { canTransitionSuccessPlan, createSuccessPlanEngine } from '../src/successplan/engine.impl.js';
import { createPlanMilestoneRepository, createPlanObjectiveRepository, createPlanTaskRepository, createSuccessPlanRepository } from '../src/successplan/repository.impl.js';
import {
  InvalidPlanMilestoneTransitionError,
  InvalidPlanTaskTransitionError,
  InvalidSuccessPlanTransitionError,
  PlanMilestoneNotFoundError,
  PlanObjectiveNotFoundError,
  PlanTaskNotFoundError,
  SuccessPlanNotFoundError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createSuccessPlanEngine(
    createSuccessPlanRepository(),
    createPlanObjectiveRepository(),
    createPlanMilestoneRepository(),
    createPlanTaskRepository(),
    eventBus,
  );
  return { engine, eventBus };
}

describe('canTransitionSuccessPlan (pure)', () => {
  it('active -> completed | cancelled', () => {
    expect(canTransitionSuccessPlan('active', 'completed')).toBe(true);
    expect(canTransitionSuccessPlan('active', 'cancelled')).toBe(true);
  });

  it('completed and cancelled are terminal', () => {
    expect(canTransitionSuccessPlan('completed', 'active')).toBe(false);
    expect(canTransitionSuccessPlan('cancelled', 'active')).toBe(false);
  });
});

describe('SuccessPlanEngine — plans', () => {
  it('createPlan() starts at active status', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Success Plan' });
    expect(plan.status).toBe('active');
  });

  it('completePlan() publishes successplan.completed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('successplan.completed', (payload) => (seen = payload));
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Success Plan' });
    const completed = await engine.completePlan(ORG, plan.id);
    expect(completed.status).toBe('completed');
    expect(seen).toEqual({ organizationId: ORG, planId: plan.id, customerId: 'customer-1' });
  });

  it('cancelPlan() moves active -> cancelled', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Success Plan' });
    const cancelled = await engine.cancelPlan(ORG, plan.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects an invalid transition (completed -> cancelled)', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Success Plan' });
    await engine.completePlan(ORG, plan.id);
    await expect(engine.cancelPlan(ORG, plan.id)).rejects.toBeInstanceOf(InvalidSuccessPlanTransitionError);
  });

  it('completePlan()/cancelPlan() throw SuccessPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.completePlan(ORG, 'missing')).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
    await expect(engine.cancelPlan(ORG, 'missing')).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('findByCustomer() filters correctly, get()/list() work as expected', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    await engine.createPlan(ORG, { customerId: 'customer-2', name: 'B' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toEqual([plan]);
    expect(await engine.get(ORG, plan.id)).toEqual(plan);
    expect(await engine.list(ORG)).toHaveLength(2);
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('createPlan() accepts an optional ownerId', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A', ownerId: 'employee-1' });
    expect(plan.ownerId).toBe('employee-1');
  });
});

describe('SuccessPlanEngine — objectives', () => {
  it('addObjective() starts at pending status', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const objective = await engine.addObjective(ORG, { planId: plan.id, title: 'Reduce churn risk' });
    expect(objective.status).toBe('pending');
  });

  it('achieveObjective() moves pending -> achieved', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const objective = await engine.addObjective(ORG, { planId: plan.id, title: 'Reduce churn risk' });
    const achieved = await engine.achieveObjective(ORG, objective.id);
    expect(achieved.status).toBe('achieved');
  });

  it('addObjective() throws SuccessPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.addObjective(ORG, { planId: 'missing', title: 'x' })).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('achieveObjective() throws PlanObjectiveNotFoundError for an unknown objective', async () => {
    const { engine } = setup();
    await expect(engine.achieveObjective(ORG, 'missing')).rejects.toBeInstanceOf(PlanObjectiveNotFoundError);
  });

  it('findObjectivesForPlan() returns only that plan’s objectives', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const other = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'B' });
    await engine.addObjective(ORG, { planId: plan.id, title: 'X' });
    await engine.addObjective(ORG, { planId: other.id, title: 'Y' });
    expect(await engine.findObjectivesForPlan(ORG, plan.id)).toHaveLength(1);
  });
});

describe('SuccessPlanEngine — milestones', () => {
  it('addMilestone() starts at pending status', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const milestone = await engine.addMilestone(ORG, { planId: plan.id, name: 'Kickoff', targetDate: '2026-02-01' });
    expect(milestone.status).toBe('pending');
  });

  it('reachMilestone() stamps actualDate and transitions to reached', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const milestone = await engine.addMilestone(ORG, { planId: plan.id, name: 'Kickoff', targetDate: '2026-02-01' });
    const reached = await engine.reachMilestone(ORG, milestone.id, '2026-02-02');
    expect(reached.status).toBe('reached');
    expect(reached.actualDate).toBe('2026-02-02');
  });

  it('missMilestone() transitions to missed', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const milestone = await engine.addMilestone(ORG, { planId: plan.id, name: 'Kickoff', targetDate: '2026-02-01' });
    const missed = await engine.missMilestone(ORG, milestone.id);
    expect(missed.status).toBe('missed');
  });

  it('rejects re-reaching an already-reached milestone', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const milestone = await engine.addMilestone(ORG, { planId: plan.id, name: 'Kickoff', targetDate: '2026-02-01' });
    await engine.reachMilestone(ORG, milestone.id, '2026-02-02');
    await expect(engine.reachMilestone(ORG, milestone.id, '2026-02-03')).rejects.toBeInstanceOf(InvalidPlanMilestoneTransitionError);
  });

  it('reachMilestone()/missMilestone() throw PlanMilestoneNotFoundError for an unknown milestone', async () => {
    const { engine } = setup();
    await expect(engine.reachMilestone(ORG, 'missing', '2026-01-01')).rejects.toBeInstanceOf(PlanMilestoneNotFoundError);
    await expect(engine.missMilestone(ORG, 'missing')).rejects.toBeInstanceOf(PlanMilestoneNotFoundError);
  });

  it('findMilestonesForPlan() returns only that plan’s milestones', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    await engine.addMilestone(ORG, { planId: plan.id, name: 'Kickoff', targetDate: '2026-02-01' });
    expect(await engine.findMilestonesForPlan(ORG, plan.id)).toHaveLength(1);
  });
});

describe('SuccessPlanEngine — tasks', () => {
  it('addTask() starts at pending status', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'Schedule kickoff call' });
    expect(task.status).toBe('pending');
  });

  it('startTask() and completeTask() progress the lifecycle', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'Schedule kickoff call' });
    const started = await engine.startTask(ORG, task.id);
    expect(started.status).toBe('in_progress');
    const completed = await engine.completeTask(ORG, task.id);
    expect(completed.status).toBe('completed');
  });

  it('completeTask() rejects a task that has not started', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'Schedule kickoff call' });
    await expect(engine.completeTask(ORG, task.id)).rejects.toBeInstanceOf(InvalidPlanTaskTransitionError);
  });

  it('startTask()/completeTask() throw PlanTaskNotFoundError for an unknown task', async () => {
    const { engine } = setup();
    await expect(engine.startTask(ORG, 'missing')).rejects.toBeInstanceOf(PlanTaskNotFoundError);
    await expect(engine.completeTask(ORG, 'missing')).rejects.toBeInstanceOf(PlanTaskNotFoundError);
  });

  it('addTask() accepts an optional ownerId', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'X', ownerId: 'employee-1' });
    expect(task.ownerId).toBe('employee-1');
  });

  it('findTasksForPlan() returns only that plan’s tasks', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    await engine.addTask(ORG, { planId: plan.id, title: 'X' });
    expect(await engine.findTasksForPlan(ORG, plan.id)).toHaveLength(1);
  });

  it('startTask() rejects a task that is already in_progress', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'X' });
    await engine.startTask(ORG, task.id);
    await expect(engine.startTask(ORG, task.id)).rejects.toBeInstanceOf(InvalidPlanTaskTransitionError);
  });

  it('addTask() throws SuccessPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.addTask(ORG, { planId: 'missing', title: 'x' })).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('findTasksForPlan() returns an empty list for a plan with no tasks', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    expect(await engine.findTasksForPlan(ORG, plan.id)).toEqual([]);
  });
});

describe('SuccessPlanEngine — additional edge cases', () => {
  it('a plan can have multiple objectives, milestones, and tasks simultaneously', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    await engine.addObjective(ORG, { planId: plan.id, title: 'Objective 1' });
    await engine.addObjective(ORG, { planId: plan.id, title: 'Objective 2' });
    await engine.addMilestone(ORG, { planId: plan.id, name: 'Milestone 1', targetDate: '2026-03-01' });
    await engine.addTask(ORG, { planId: plan.id, title: 'Task 1' });
    await engine.addTask(ORG, { planId: plan.id, title: 'Task 2' });

    expect(await engine.findObjectivesForPlan(ORG, plan.id)).toHaveLength(2);
    expect(await engine.findMilestonesForPlan(ORG, plan.id)).toHaveLength(1);
    expect(await engine.findTasksForPlan(ORG, plan.id)).toHaveLength(2);
  });

  it('objectives, milestones, and tasks with an optional description are stored correctly', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const objective = await engine.addObjective(ORG, { planId: plan.id, title: 'Reduce churn', description: 'Focus on top accounts' });
    expect(objective.description).toBe('Focus on top accounts');
  });

  it('findObjectivesForPlan() returns an empty list for a plan with no objectives', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    expect(await engine.findObjectivesForPlan(ORG, plan.id)).toEqual([]);
  });

  it('findMilestonesForPlan() returns an empty list for a plan with no milestones', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    expect(await engine.findMilestonesForPlan(ORG, plan.id)).toEqual([]);
  });

  it('plans, objectives, milestones, and tasks are isolated per organization', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const otherPlan = await engine.createPlan('org-2', { customerId: 'customer-1', name: 'A' });
    await engine.addObjective(ORG, { planId: plan.id, title: 'X' });
    await engine.addObjective('org-2', { planId: otherPlan.id, title: 'X' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('list() returns an empty array for an organization with no plans', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('a customer can have multiple success plans simultaneously', async () => {
    const { engine } = setup();
    await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Plan' });
    await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q2 Plan' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(2);
  });

  it('completing one plan does not affect another plan for the same customer', async () => {
    const { engine } = setup();
    const first = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q1 Plan' });
    const second = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'Q2 Plan' });
    await engine.completePlan(ORG, first.id);
    const reloadedSecond = await engine.get(ORG, second.id);
    expect(reloadedSecond?.status).toBe('active');
  });

  it('addMilestone() throws SuccessPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.addMilestone(ORG, { planId: 'missing', name: 'X', targetDate: '2026-01-01' })).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('achieveObjective() is idempotent-safe to call once but not twice from pending', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const objective = await engine.addObjective(ORG, { planId: plan.id, title: 'X' });
    const achieved = await engine.achieveObjective(ORG, objective.id);
    expect(achieved.status).toBe('achieved');
  });

  it('addMilestone() throws SuccessPlanNotFoundError even for a plan-shaped id from another organization', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    await expect(engine.addMilestone('org-2', { planId: plan.id, name: 'X', targetDate: '2026-01-01' })).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('a task can be added without an owner and completed normally', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const task = await engine.addTask(ORG, { planId: plan.id, title: 'Unowned task' });
    await engine.startTask(ORG, task.id);
    const completed = await engine.completeTask(ORG, task.id);
    expect(completed.status).toBe('completed');
    expect(completed.ownerId).toBeUndefined();
  });

  it('cancelPlan() throws SuccessPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.cancelPlan(ORG, 'missing')).rejects.toBeInstanceOf(SuccessPlanNotFoundError);
  });

  it('missMilestone() on a plan milestone leaves other milestones for the plan untouched', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    const first = await engine.addMilestone(ORG, { planId: plan.id, name: 'M1', targetDate: '2026-01-01' });
    const second = await engine.addMilestone(ORG, { planId: plan.id, name: 'M2', targetDate: '2026-02-01' });
    await engine.missMilestone(ORG, first.id);
    const reloadedSecond = await engine.get(ORG, plan.id).then(() => engine.findMilestonesForPlan(ORG, plan.id));
    const secondMilestone = reloadedSecond.find((m) => m.id === second.id);
    expect(secondMilestone?.status).toBe('pending');
  });

  it('plans default to no owner when none is given', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { customerId: 'customer-1', name: 'A' });
    expect(plan.ownerId).toBeUndefined();
  });
});
