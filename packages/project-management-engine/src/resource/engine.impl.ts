/**
 * Real Resource Planning engine — deterministic workload, capacity,
 * allocation, and utilization tracking for employee and AI-worker
 * assignments. This module composes with HR Engine (and, through it,
 * AI Workforce) via the Relationship Layer for identity context — it
 * never duplicates workforce logic, only tracks the assignment record
 * and its allocation percentage.
 *
 * @module resource/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import type { ProjectEventBus } from '../events/project-event-bus.js';
import { OverAllocationError, ResourceAssignmentNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ResourceAssignmentId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';
import type { ResourceAssignmentRepository } from './repository.js';
import type { AssigneeType, ResourceAssignment } from './types.js';

/** A single resource is assumed fully available at 100% of capacity unless a different ceiling is supplied. */
export const DEFAULT_CAPACITY_PERCENTAGE = 100;

/** Sums the allocation percentage of every currently-`active` assignment. */
export function computeTotalAllocation(assignments: readonly ResourceAssignment[]): number {
  return assignments.filter((assignment) => assignment.status === 'active').reduce((total, assignment) => total + assignment.allocationPercentage, 0);
}

/** Remaining allocatable capacity, floored at `0`. */
export function computeRemainingCapacity(totalAllocation: number, capacityPercentage: number = DEFAULT_CAPACITY_PERCENTAGE): number {
  return Math.max(0, capacityPercentage - totalAllocation);
}

/** Whether a total allocation exceeds the configured capacity ceiling. */
export function isOverAllocated(totalAllocation: number, capacityPercentage: number = DEFAULT_CAPACITY_PERCENTAGE): boolean {
  return totalAllocation > capacityPercentage;
}

export interface AssignResourceInput {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  readonly assigneeType: AssigneeType;
  readonly assigneeId: string;
  readonly allocationPercentage: number;
  readonly startDate?: ISODate;
  readonly endDate?: ISODate;
  readonly capacityPercentage?: number;
}

export interface ResourcePlanningEngine {
  assign(organizationId: OrganizationId, input: AssignResourceInput): Promise<ResourceAssignment>;
  updateAllocation(organizationId: OrganizationId, assignmentId: ResourceAssignmentId, allocationPercentage: number, capacityPercentage?: number): Promise<ResourceAssignment>;
  complete(organizationId: OrganizationId, assignmentId: ResourceAssignmentId): Promise<ResourceAssignment>;
  cancel(organizationId: OrganizationId, assignmentId: ResourceAssignmentId): Promise<ResourceAssignment>;
  get(organizationId: OrganizationId, assignmentId: ResourceAssignmentId): Promise<ResourceAssignment | null>;
  list(organizationId: OrganizationId): Promise<readonly ResourceAssignment[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ResourceAssignment[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly ResourceAssignment[]>;
  findByAssignee(organizationId: OrganizationId, assigneeId: string): Promise<readonly ResourceAssignment[]>;
  /** Sum of active allocation percentages currently committed by this assignee, across every project. */
  getWorkload(organizationId: OrganizationId, assigneeId: string): Promise<number>;
  /** Remaining allocatable capacity for this assignee, given their current workload. */
  getRemainingCapacity(organizationId: OrganizationId, assigneeId: string, capacityPercentage?: number): Promise<number>;
}

/** Creates a real {@link ResourcePlanningEngine}. */
export function createResourcePlanningEngine(
  repository: ResourceAssignmentRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): ResourcePlanningEngine {
  async function requireAssignment(organizationId: OrganizationId, assignmentId: ResourceAssignmentId): Promise<ResourceAssignment> {
    const assignment = await repository.findById(organizationId, assignmentId);
    if (!assignment) throw new ResourceAssignmentNotFoundError(assignmentId);
    return assignment;
  }

  return {
    async assign(organizationId, input) {
      const existing = await repository.findByAssignee(organizationId, input.assigneeId);
      const currentAllocation = computeTotalAllocation(existing);
      const capacityPercentage = input.capacityPercentage ?? DEFAULT_CAPACITY_PERCENTAGE;
      const projectedAllocation = currentAllocation + input.allocationPercentage;
      if (isOverAllocated(projectedAllocation, capacityPercentage)) {
        throw new OverAllocationError(input.assigneeId, projectedAllocation, computeRemainingCapacity(currentAllocation, capacityPercentage));
      }

      const timestamp = now();
      const assignment: ResourceAssignment = {
        id: generateId('resource-assignment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        taskId: input.taskId,
        assigneeType: input.assigneeType,
        assigneeId: input.assigneeId,
        allocationPercentage: input.allocationPercentage,
        startDate: input.startDate,
        endDate: input.endDate,
        status: 'active',
      };
      await repository.save(assignment);
      eventBus?.publish('resource.assigned', {
        organizationId,
        assignmentId: assignment.id,
        projectId: assignment.projectId,
        assigneeId: assignment.assigneeId,
        assigneeType: assignment.assigneeType,
      });
      return assignment;
    },

    async updateAllocation(organizationId, assignmentId, allocationPercentage, capacityPercentage = DEFAULT_CAPACITY_PERCENTAGE) {
      const assignment = await requireAssignment(organizationId, assignmentId);
      const others = (await repository.findByAssignee(organizationId, assignment.assigneeId)).filter((candidate) => candidate.id !== assignmentId);
      const otherAllocation = computeTotalAllocation(others);
      const projectedAllocation = otherAllocation + allocationPercentage;
      if (isOverAllocated(projectedAllocation, capacityPercentage)) {
        throw new OverAllocationError(assignment.assigneeId, projectedAllocation, computeRemainingCapacity(otherAllocation, capacityPercentage));
      }
      const updated: ResourceAssignment = { ...assignment, allocationPercentage, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async complete(organizationId, assignmentId) {
      const assignment = await requireAssignment(organizationId, assignmentId);
      const updated: ResourceAssignment = { ...assignment, status: 'completed', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async cancel(organizationId, assignmentId) {
      const assignment = await requireAssignment(organizationId, assignmentId);
      const updated: ResourceAssignment = { ...assignment, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, assignmentId) {
      return repository.findById(organizationId, assignmentId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findByTask(organizationId, taskId) {
      return repository.findByTask(organizationId, taskId);
    },

    async findByAssignee(organizationId, assigneeId) {
      return repository.findByAssignee(organizationId, assigneeId);
    },

    async getWorkload(organizationId, assigneeId) {
      const assignments = await repository.findByAssignee(organizationId, assigneeId);
      return computeTotalAllocation(assignments);
    },

    async getRemainingCapacity(organizationId, assigneeId, capacityPercentage = DEFAULT_CAPACITY_PERCENTAGE) {
      const assignments = await repository.findByAssignee(organizationId, assigneeId);
      return computeRemainingCapacity(computeTotalAllocation(assignments), capacityPercentage);
    },
  };
}
