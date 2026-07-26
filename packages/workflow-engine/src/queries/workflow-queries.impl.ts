/**
 * Real {@link WorkflowQueries} implementation — a CQRS read layer composed
 * over the repository ports.
 *
 * @module queries/workflow-queries.impl
 */
import type { AuditTrailRepository, ExecutionHistoryRepository, WorkflowHistoryRepository } from '../history/repository.js';
import type { WorkflowInstanceRepository } from '../instance/repository.js';
import type { AITask, HumanTask, StepInstance } from '../step/types.js';
import type { StepInstanceRepository } from '../step/repository.js';
import type { WorkflowDefinitionRepository, WorkflowVersionRepository } from '../workflow/repository.js';
import type {
  FindHistoryQuery,
  FindHistoryResult,
  FindRunningWorkflowsQuery,
  FindRunningWorkflowsResult,
  FindWaitingTasksQuery,
  FindWaitingTasksResult,
  FindWorkflowQuery,
  FindWorkflowResult,
} from './types.js';
import type { WorkflowQueries } from './workflow-queries.js';

export interface WorkflowQueriesDeps {
  readonly definitionRepository: WorkflowDefinitionRepository;
  readonly versionRepository: WorkflowVersionRepository;
  readonly instanceRepository: WorkflowInstanceRepository;
  readonly stepInstanceRepository: StepInstanceRepository;
  readonly workflowHistoryRepository: WorkflowHistoryRepository;
  readonly executionHistoryRepository: ExecutionHistoryRepository;
  readonly auditTrailRepository: AuditTrailRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

/** Creates a {@link WorkflowQueries} read port over the given repositories. */
export function createWorkflowQueries(deps: WorkflowQueriesDeps): WorkflowQueries {
  return {
    async findWorkflow(query: FindWorkflowQuery): Promise<FindWorkflowResult> {
      const definition = query.definitionId
        ? await deps.definitionRepository.findById(query.organizationId, query.definitionId)
        : query.code
          ? await deps.definitionRepository.findByCode(query.organizationId, query.code)
          : null;
      if (!definition) return { definition: null, version: null, steps: [] };

      const version = await deps.versionRepository.findById(query.organizationId, definition.currentVersionId);
      return { definition, version, steps: version?.steps ?? [] };
    },

    async findRunningWorkflows(query: FindRunningWorkflowsQuery): Promise<FindRunningWorkflowsResult> {
      const all = query.status
        ? await deps.instanceRepository.findByStatus(query.organizationId, query.status)
        : await deps.instanceRepository.findAll(query.organizationId);
      const filtered = query.definitionId ? all.filter((instance) => instance.definitionId === query.definitionId) : all;
      return { instances: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findWaitingTasks(query: FindWaitingTasksQuery): Promise<FindWaitingTasksResult> {
      const waiting = query.instanceId
        ? (await deps.stepInstanceRepository.findByInstanceId(query.organizationId, query.instanceId)).filter(
            (stepInstance) => stepInstance.status === 'waiting',
          )
        : await deps.stepInstanceRepository.findByStatus(query.organizationId, 'waiting');

      const filtered: StepInstance[] = [];
      for (const stepInstance of waiting) {
        if (!query.assigneeEmployeeId && !query.workerId) {
          filtered.push(stepInstance);
          continue;
        }
        const instance = await deps.instanceRepository.findById(query.organizationId, stepInstance.instanceId);
        const version = instance ? await deps.versionRepository.findById(query.organizationId, instance.versionId) : null;
        const step = version?.steps.find((candidate) => candidate.stepId === stepInstance.stepId);
        if (!step) continue;
        if (query.assigneeEmployeeId && step.type === 'human' && (step as HumanTask).assigneeEmployeeId === query.assigneeEmployeeId) {
          filtered.push(stepInstance);
        } else if (query.workerId && step.type === 'ai' && (step as AITask).workerId === query.workerId) {
          filtered.push(stepInstance);
        }
      }

      return { stepInstances: paginate(filtered, query.offset, query.limit), total: filtered.length };
    },

    async findHistory(query: FindHistoryQuery): Promise<FindHistoryResult> {
      const [workflowHistory, executionHistory, auditTrail] = await Promise.all([
        deps.workflowHistoryRepository.findByInstance(query.organizationId, query.instanceId),
        deps.executionHistoryRepository.findByInstance(query.organizationId, query.instanceId),
        deps.auditTrailRepository.findByInstance(query.organizationId, query.instanceId),
      ]);
      const scopedExecutionHistory = query.stepInstanceId
        ? executionHistory.filter((entry) => entry.stepInstanceId === query.stepInstanceId)
        : executionHistory;

      return { workflowHistory, executionHistory: scopedExecutionHistory, auditTrail };
    },
  };
}
