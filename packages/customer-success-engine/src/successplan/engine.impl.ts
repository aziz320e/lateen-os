/**
 * Real Success Plans engine — objectives, milestones, owners, and
 * tasks toward a customer's goals, guarded by simple, deterministic
 * status lifecycles.
 *
 * @module successplan/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import {
  InvalidPlanMilestoneTransitionError,
  InvalidPlanTaskTransitionError,
  InvalidSuccessPlanTransitionError,
  PlanMilestoneNotFoundError,
  PlanObjectiveNotFoundError,
  PlanTaskNotFoundError,
  SuccessPlanNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PlanMilestoneId, PlanObjectiveId, PlanTaskId, SuccessPlanId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { PlanMilestoneRepository, PlanObjectiveRepository, PlanTaskRepository, SuccessPlanRepository } from './repository.js';
import type { PlanMilestone, PlanObjective, PlanTask, SuccessPlan, SuccessPlanStatus } from './types.js';

const SUCCESS_PLAN_TRANSITIONS: Readonly<Record<SuccessPlanStatus, readonly SuccessPlanStatus[]>> = {
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Whether a success plan may transition from one status to another. */
export function canTransitionSuccessPlan(from: SuccessPlanStatus, to: SuccessPlanStatus): boolean {
  return SUCCESS_PLAN_TRANSITIONS[from].includes(to);
}

export interface CreateSuccessPlanInput {
  readonly customerId: string;
  readonly name: string;
  readonly ownerId?: string;
}

export interface CreatePlanObjectiveInput {
  readonly planId: SuccessPlanId;
  readonly title: string;
  readonly description?: string;
}

export interface CreatePlanMilestoneInput {
  readonly planId: SuccessPlanId;
  readonly name: string;
  readonly targetDate: ISODate;
}

export interface CreatePlanTaskInput {
  readonly planId: SuccessPlanId;
  readonly title: string;
  readonly ownerId?: string;
}

export interface SuccessPlanEngine {
  createPlan(organizationId: OrganizationId, input: CreateSuccessPlanInput): Promise<SuccessPlan>;
  completePlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<SuccessPlan>;
  cancelPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<SuccessPlan>;
  get(organizationId: OrganizationId, planId: SuccessPlanId): Promise<SuccessPlan | null>;
  list(organizationId: OrganizationId): Promise<readonly SuccessPlan[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly SuccessPlan[]>;

  addObjective(organizationId: OrganizationId, input: CreatePlanObjectiveInput): Promise<PlanObjective>;
  achieveObjective(organizationId: OrganizationId, objectiveId: PlanObjectiveId): Promise<PlanObjective>;
  findObjectivesForPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanObjective[]>;

  addMilestone(organizationId: OrganizationId, input: CreatePlanMilestoneInput): Promise<PlanMilestone>;
  reachMilestone(organizationId: OrganizationId, milestoneId: PlanMilestoneId, actualDate: ISODate): Promise<PlanMilestone>;
  missMilestone(organizationId: OrganizationId, milestoneId: PlanMilestoneId): Promise<PlanMilestone>;
  findMilestonesForPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanMilestone[]>;

  addTask(organizationId: OrganizationId, input: CreatePlanTaskInput): Promise<PlanTask>;
  startTask(organizationId: OrganizationId, taskId: PlanTaskId): Promise<PlanTask>;
  completeTask(organizationId: OrganizationId, taskId: PlanTaskId): Promise<PlanTask>;
  findTasksForPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanTask[]>;
}

/** Creates a real {@link SuccessPlanEngine}. */
export function createSuccessPlanEngine(
  planRepository: SuccessPlanRepository,
  objectiveRepository: PlanObjectiveRepository,
  milestoneRepository: PlanMilestoneRepository,
  taskRepository: PlanTaskRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): SuccessPlanEngine {
  async function requirePlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<SuccessPlan> {
    const plan = await planRepository.findById(organizationId, planId);
    if (!plan) throw new SuccessPlanNotFoundError(planId);
    return plan;
  }

  async function requireObjective(organizationId: OrganizationId, objectiveId: PlanObjectiveId): Promise<PlanObjective> {
    const objective = await objectiveRepository.findById(organizationId, objectiveId);
    if (!objective) throw new PlanObjectiveNotFoundError(objectiveId);
    return objective;
  }

  async function requireMilestone(organizationId: OrganizationId, milestoneId: PlanMilestoneId): Promise<PlanMilestone> {
    const milestone = await milestoneRepository.findById(organizationId, milestoneId);
    if (!milestone) throw new PlanMilestoneNotFoundError(milestoneId);
    return milestone;
  }

  async function requireTask(organizationId: OrganizationId, taskId: PlanTaskId): Promise<PlanTask> {
    const task = await taskRepository.findById(organizationId, taskId);
    if (!task) throw new PlanTaskNotFoundError(taskId);
    return task;
  }

  async function transitionPlan(organizationId: OrganizationId, planId: SuccessPlanId, to: SuccessPlanStatus): Promise<SuccessPlan> {
    const plan = await requirePlan(organizationId, planId);
    if (!canTransitionSuccessPlan(plan.status, to)) {
      throw new InvalidSuccessPlanTransitionError(planId, plan.status, to);
    }
    const updated: SuccessPlan = { ...plan, status: to, currentVersion: plan.currentVersion + 1, updatedAt: now() };
    await planRepository.save(updated);
    return updated;
  }

  return {
    async createPlan(organizationId, input) {
      const timestamp = now();
      const plan: SuccessPlan = {
        id: generateId('success-plan'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        name: input.name,
        ownerId: input.ownerId,
        status: 'active',
        currentVersion: 1,
      };
      await planRepository.save(plan);
      return plan;
    },

    async completePlan(organizationId, planId) {
      const updated = await transitionPlan(organizationId, planId, 'completed');
      eventBus?.publish('successplan.completed', { organizationId, planId, customerId: updated.customerId });
      return updated;
    },

    async cancelPlan(organizationId, planId) {
      return transitionPlan(organizationId, planId, 'cancelled');
    },

    async get(organizationId, planId) {
      return planRepository.findById(organizationId, planId);
    },

    async list(organizationId) {
      return planRepository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return planRepository.findByCustomer(organizationId, customerId);
    },

    async addObjective(organizationId, input) {
      await requirePlan(organizationId, input.planId);
      const timestamp = now();
      const objective: PlanObjective = {
        id: generateId('plan-objective'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        planId: input.planId,
        title: input.title,
        description: input.description,
        status: 'pending',
      };
      await objectiveRepository.save(objective);
      return objective;
    },

    async achieveObjective(organizationId, objectiveId) {
      const objective = await requireObjective(organizationId, objectiveId);
      const updated: PlanObjective = { ...objective, status: 'achieved', updatedAt: now() };
      await objectiveRepository.save(updated);
      return updated;
    },

    async findObjectivesForPlan(organizationId, planId) {
      return objectiveRepository.findByPlan(organizationId, planId);
    },

    async addMilestone(organizationId, input) {
      await requirePlan(organizationId, input.planId);
      const timestamp = now();
      const milestone: PlanMilestone = {
        id: generateId('plan-milestone'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        planId: input.planId,
        name: input.name,
        targetDate: input.targetDate,
        status: 'pending',
      };
      await milestoneRepository.save(milestone);
      return milestone;
    },

    async reachMilestone(organizationId, milestoneId, actualDate) {
      const milestone = await requireMilestone(organizationId, milestoneId);
      if (milestone.status !== 'pending') {
        throw new InvalidPlanMilestoneTransitionError(milestoneId, milestone.status, 'reached');
      }
      const updated: PlanMilestone = { ...milestone, status: 'reached', actualDate, updatedAt: now() };
      await milestoneRepository.save(updated);
      return updated;
    },

    async missMilestone(organizationId, milestoneId) {
      const milestone = await requireMilestone(organizationId, milestoneId);
      if (milestone.status !== 'pending') {
        throw new InvalidPlanMilestoneTransitionError(milestoneId, milestone.status, 'missed');
      }
      const updated: PlanMilestone = { ...milestone, status: 'missed', updatedAt: now() };
      await milestoneRepository.save(updated);
      return updated;
    },

    async findMilestonesForPlan(organizationId, planId) {
      return milestoneRepository.findByPlan(organizationId, planId);
    },

    async addTask(organizationId, input) {
      await requirePlan(organizationId, input.planId);
      const timestamp = now();
      const task: PlanTask = {
        id: generateId('plan-task'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        planId: input.planId,
        title: input.title,
        ownerId: input.ownerId,
        status: 'pending',
      };
      await taskRepository.save(task);
      return task;
    },

    async startTask(organizationId, taskId) {
      const task = await requireTask(organizationId, taskId);
      if (task.status !== 'pending') {
        throw new InvalidPlanTaskTransitionError(taskId, task.status, 'in_progress');
      }
      const updated: PlanTask = { ...task, status: 'in_progress', updatedAt: now() };
      await taskRepository.save(updated);
      return updated;
    },

    async completeTask(organizationId, taskId) {
      const task = await requireTask(organizationId, taskId);
      if (task.status !== 'in_progress') {
        throw new InvalidPlanTaskTransitionError(taskId, task.status, 'completed');
      }
      const updated: PlanTask = { ...task, status: 'completed', updatedAt: now() };
      await taskRepository.save(updated);
      return updated;
    },

    async findTasksForPlan(organizationId, planId) {
      return taskRepository.findByPlan(organizationId, planId);
    },
  };
}
