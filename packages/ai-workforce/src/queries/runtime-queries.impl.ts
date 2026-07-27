/**
 * Real {@link WorkforceRuntimeQueries} implementation — a CQRS read layer
 * composed over the repository ports and engines. Repositories are taken
 * as constructor dependencies but never returned to callers.
 *
 * @module queries/runtime-queries.impl
 */
import type { CapacityEngine } from '../availability/capacity-engine.impl.js';
import type { TaskAssignmentRepository } from '../collaboration/repository.js';
import type { PerformanceEngine } from '../performance/performance-engine.impl.js';
import type { PerformanceMetricsRepository } from '../performance/repository.js';
import type { SkillDefinitionRepository } from '../skills/repository.js';
import type { WorkerRepository } from '../worker/repository.js';
import type { WorkforceRuntimeQueries } from './runtime-queries.js';
import type {
  FindAvailableWorkersQuery,
  FindAvailableWorkersResult,
  FindCapabilitiesQuery,
  FindCapabilitiesResult,
  FindCapacityQuery,
  FindCapacityResult,
} from './runtime-types.js';
import type {
  FindAssignmentsQuery,
  FindAssignmentsResult,
  FindPerformanceQuery,
  FindPerformanceResult,
  FindWorkersQuery,
  FindWorkersResult,
} from './types.js';

export interface WorkforceRuntimeQueriesDeps {
  readonly workerRepository: WorkerRepository;
  readonly assignmentRepository: TaskAssignmentRepository;
  readonly skillDefinitionRepository: SkillDefinitionRepository;
  readonly performanceMetricsRepository: PerformanceMetricsRepository;
  readonly capacityEngine: CapacityEngine;
  readonly performanceEngine: PerformanceEngine;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

/** Creates a real {@link WorkforceRuntimeQueries} read port over the given repositories and engines. */
export function createWorkforceRuntimeQueries(deps: WorkforceRuntimeQueriesDeps): WorkforceRuntimeQueries {
  return {
    async findWorkers(query: FindWorkersQuery): Promise<FindWorkersResult> {
      const all = await deps.workerRepository.findAll(query.organizationId);
      const filtered = all
        .filter((worker) => (query.status ? worker.status === query.status : true))
        .filter((worker) => (query.workforceType ? worker.profile.workforceType === query.workforceType : true))
        .filter((worker) => (query.departmentId ? worker.profile.departmentId === query.departmentId : true));
      return { workers: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findAvailableWorkers(query: FindAvailableWorkersQuery): Promise<FindAvailableWorkersResult> {
      const all = await deps.workerRepository.findAll(query.organizationId);
      const available = all
        .filter((worker) => (query.roleCode ? worker.roles.some((role) => role.code === query.roleCode) : true))
        .filter((worker) => {
          const snapshot = deps.capacityEngine.calculateAvailability(worker);
          return snapshot.state === 'available' && snapshot.availableCapacity > 0;
        });
      return { workers: paginate(available, query.offset, query.limit), total: available.length };
    },

    async findAssignments(query: FindAssignmentsQuery): Promise<FindAssignmentsResult> {
      const scoped = query.workerId
        ? await deps.assignmentRepository.findByWorker(query.organizationId, query.workerId)
        : await deps.assignmentRepository.findAll(query.organizationId);
      const filtered = scoped
        .filter((assignment) => (query.taskId ? assignment.taskId === query.taskId : true))
        .filter((assignment) => (query.status ? assignment.status === query.status : true));
      return { assignments: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findCapabilities(query: FindCapabilitiesQuery): Promise<FindCapabilitiesResult> {
      const skills = await deps.skillDefinitionRepository.findAll(query.organizationId);
      return { skills: paginate(skills, query.offset, query.limit), total: skills.length };
    },

    async findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult> {
      const metrics = (await deps.performanceMetricsRepository.findByWorker(query.organizationId, query.workerId)).filter(
        (metric) => (query.period ? metric.period === query.period : true),
      );
      return {
        metrics,
        score: deps.performanceEngine.getScore(query.organizationId, query.workerId),
        taskStatistics: deps.performanceEngine.getStatistics(query.organizationId, query.workerId),
      };
    },

    async findCapacity(query: FindCapacityQuery): Promise<FindCapacityResult> {
      const workers = query.workerId
        ? [await deps.workerRepository.findById(query.organizationId, query.workerId)].filter((worker) => worker !== null)
        : await deps.workerRepository.findAll(query.organizationId);
      return { snapshots: workers.map((worker) => deps.capacityEngine.calculateAvailability(worker)) };
    },
  };
}
