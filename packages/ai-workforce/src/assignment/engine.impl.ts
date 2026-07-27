/**
 * Real Assignment Engine — deterministic worker selection and task
 * assignment lifecycle. Selection is a pure function of role, capability
 * match, skills, availability, capacity, and priority — no AI/LLM
 * involvement anywhere in the decision path.
 *
 * @module assignment/engine.impl
 */
import type { CapacityEngine } from '../availability/capacity-engine.impl.js';
import type { CapabilityEngine } from '../skills/capability-engine.impl.js';
import type { TaskAssignmentRepository } from '../collaboration/repository.js';
import type { TaskAssignment } from '../collaboration/types.js';
import type { WorkforceEventBus } from '../events/workforce-event-bus.js';
import { AssignmentNotFoundError, InvalidAssignmentTransitionError, NoSuitableWorkerError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, TaskAssignmentId } from '../shared/identifiers.js';
import type { WorkerRepository } from '../worker/repository.js';
import type { AIWorker } from '../worker/types.js';
import type { AssignmentCriteria } from './types.js';

const ACTIVE_ASSIGNMENT_STATUSES = ['proposed', 'accepted', 'in_progress', 'blocked'] as const;

/** Records mission outcomes against a worker's performance history. Satisfied structurally by the Performance Engine. */
export interface AssignmentPerformanceRecorder {
  recordSuccess(
    organizationId: OrganizationId,
    workerId: string,
    durationMinutes: number,
    qualityScore?: string,
    taskId?: string,
  ): Promise<unknown>;
  recordFailure(organizationId: OrganizationId, workerId: string, durationMinutes: number, taskId?: string): Promise<unknown>;
}

export interface AssignmentEngineDeps {
  readonly workerRepository: WorkerRepository;
  readonly assignmentRepository: TaskAssignmentRepository;
  readonly capacityEngine: CapacityEngine;
  readonly capabilityEngine: CapabilityEngine;
  readonly performanceRecorder?: AssignmentPerformanceRecorder;
  readonly eventBus?: WorkforceEventBus;
  readonly now?: () => string;
}

export interface AssignmentEngine {
  /** Pure, deterministic candidate ranking — exposed for inspection/testing; does not reserve capacity. */
  selectWorker(candidates: readonly AIWorker[], criteria: AssignmentCriteria): AIWorker | null;
  createAssignment(organizationId: OrganizationId, criteria: AssignmentCriteria): Promise<TaskAssignment>;
  completeAssignment(organizationId: OrganizationId, assignmentId: TaskAssignmentId, qualityScore?: string): Promise<TaskAssignment>;
  failAssignment(organizationId: OrganizationId, assignmentId: TaskAssignmentId, reason: string): Promise<TaskAssignment>;
  get(organizationId: OrganizationId, assignmentId: TaskAssignmentId): Promise<TaskAssignment | null>;
}

function minutesBetween(from: string, to: string): number {
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / 60_000;
  return Number.isFinite(diff) && diff >= 0 ? Math.round(diff) : 0;
}

/** Creates a real {@link AssignmentEngine}. */
export function createAssignmentEngine(deps: AssignmentEngineDeps): AssignmentEngine {
  const now = deps.now ?? nowIso;

  function isEligible(worker: AIWorker, criteria: AssignmentCriteria): boolean {
    if (!['active', 'busy', 'away'].includes(worker.status)) return false;
    if (criteria.roleCode && !worker.roles.some((role) => role.code === criteria.roleCode)) return false;
    if (deps.capacityEngine.remainingCapacity(worker) <= 0) return false;
    const availability = deps.capacityEngine.calculateAvailability(worker);
    if (availability.state !== 'available' && availability.state !== 'limited') return false;
    if (criteria.requirement) {
      const validation = deps.capabilityEngine.validate(worker, criteria.requirement);
      if (!validation.ok) return false;
    }
    return true;
  }

  function selectWorker(candidates: readonly AIWorker[], criteria: AssignmentCriteria): AIWorker | null {
    const eligible = candidates.filter((worker) => isEligible(worker, criteria));
    if (eligible.length === 0) return null;

    const ranked = [...eligible].sort((a, b) => {
      const scoreA = Number.parseFloat(deps.capabilityEngine.matchScore(a, criteria.requirement ?? {}));
      const scoreB = Number.parseFloat(deps.capabilityEngine.matchScore(b, criteria.requirement ?? {}));
      if (scoreB !== scoreA) return scoreB - scoreA;

      const capacityA = deps.capacityEngine.remainingCapacity(a);
      const capacityB = deps.capacityEngine.remainingCapacity(b);
      if (capacityB !== capacityA) return capacityB - capacityA;

      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    return ranked[0] ?? null;
  }

  async function requireAssignment(organizationId: OrganizationId, assignmentId: TaskAssignmentId): Promise<TaskAssignment> {
    const assignment = await deps.assignmentRepository.findById(organizationId, assignmentId);
    if (!assignment) throw new AssignmentNotFoundError(assignmentId);
    return assignment;
  }

  return {
    selectWorker,

    async createAssignment(organizationId, criteria) {
      const candidates = await deps.workerRepository.findAll(organizationId);
      const selected = selectWorker(candidates, criteria);
      if (!selected) throw new NoSuitableWorkerError(criteria.roleCode ?? 'any');

      await deps.capacityEngine.reserve(organizationId, selected.id);

      const timestamp = now();
      const assignment: TaskAssignment = {
        id: generateId('assignment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        taskId: criteria.taskId,
        workerId: selected.id,
        status: 'accepted',
        priority: criteria.priority,
        assignedAt: timestamp,
        dueAt: criteria.dueAt,
      };
      await deps.assignmentRepository.save(assignment);
      deps.eventBus?.publish('assignment.created', {
        assignmentId: assignment.id,
        workerId: assignment.workerId,
        taskId: assignment.taskId,
        priority: assignment.priority,
      });
      return assignment;
    },

    async completeAssignment(organizationId, assignmentId, qualityScore) {
      const assignment = await requireAssignment(organizationId, assignmentId);
      if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status as (typeof ACTIVE_ASSIGNMENT_STATUSES)[number])) {
        throw new InvalidAssignmentTransitionError(assignmentId, assignment.status, 'completed');
      }
      const timestamp = now();
      const updated: TaskAssignment = { ...assignment, status: 'completed', completedAt: timestamp, updatedAt: timestamp };
      await deps.assignmentRepository.save(updated);
      await deps.capacityEngine.release(organizationId, assignment.workerId);
      await deps.performanceRecorder?.recordSuccess(
        organizationId,
        assignment.workerId,
        minutesBetween(assignment.assignedAt, timestamp),
        qualityScore,
        assignment.taskId,
      );
      deps.eventBus?.publish('assignment.completed', {
        assignmentId: updated.id,
        workerId: updated.workerId,
        taskId: updated.taskId,
      });
      return updated;
    },

    async failAssignment(organizationId, assignmentId, reason) {
      const assignment = await requireAssignment(organizationId, assignmentId);
      if (!ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status as (typeof ACTIVE_ASSIGNMENT_STATUSES)[number])) {
        throw new InvalidAssignmentTransitionError(assignmentId, assignment.status, 'failed');
      }
      const timestamp = now();
      const updated: TaskAssignment = { ...assignment, status: 'failed', completedAt: timestamp, updatedAt: timestamp };
      await deps.assignmentRepository.save(updated);
      await deps.capacityEngine.release(organizationId, assignment.workerId);
      await deps.performanceRecorder?.recordFailure(
        organizationId,
        assignment.workerId,
        minutesBetween(assignment.assignedAt, timestamp),
        assignment.taskId,
      );
      deps.eventBus?.publish('assignment.failed', {
        assignmentId: updated.id,
        workerId: updated.workerId,
        taskId: updated.taskId,
        reason,
      });
      return updated;
    },

    async get(organizationId, assignmentId) {
      return deps.assignmentRepository.findById(organizationId, assignmentId);
    },
  };
}
