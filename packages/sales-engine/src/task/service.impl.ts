/**
 * Real Sales Tasks service — generates deterministic workflow requests
 * for proposal approval, contract review, and follow-up reminders by
 * composing the Workflow Engine's public runtime API (`defineWorkflow` +
 * `startWorkflow`) only. Never touches a Workflow Engine repository.
 *
 * The Workflow Engine collaborator is optional: with it injected, every
 * generated task is backed by a real workflow instance; without it, the
 * task is still recorded, just with no workflow linkage, keeping the
 * Sales Engine fully usable offline.
 *
 * @module task/service.impl
 */
import type { HumanTask, WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { SalesEventBus } from '../events/sales-event-bus.js';
import { InvalidSalesTaskTransitionError, SalesTaskNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SalesOpportunityId, SalesTaskId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { SalesTaskRepository } from './repository.js';
import type { SalesTask, SalesTaskType } from './types.js';

/** Real, optionally-injected Workflow Engine collaborator — only the two composition-root operations this module needs. */
export interface SalesTasksDeps {
  readonly workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>;
}

/** Matches Workflow Engine's `WorkflowCategory` union members used by Sales Tasks. */
type SalesTaskWorkflowCategory = 'approval' | 'operational';

interface TaskWorkflowConfig {
  readonly code: string;
  readonly name: string;
  readonly category: SalesTaskWorkflowCategory;
}

const TASK_WORKFLOW_CONFIG: Readonly<Record<SalesTaskType, TaskWorkflowConfig>> = {
  proposal_approval: { code: 'sales.proposal-approval', name: 'Proposal Approval', category: 'approval' },
  contract_review: { code: 'sales.contract-review', name: 'Contract Review', category: 'approval' },
  follow_up_reminder: { code: 'sales.follow-up-reminder', name: 'Follow-up Reminder', category: 'operational' },
};

export interface GenerateSalesTaskInput {
  readonly taskType: SalesTaskType;
  readonly opportunityId: SalesOpportunityId;
  readonly notes?: string;
  readonly dueAt?: ISODateTime;
}

export interface CompleteSalesTaskOutcome {
  /** Only meaningful for `taskType === 'proposal_approval'`. */
  readonly approved?: boolean;
}

export interface SalesTasksService {
  /** Records a task and, if a Workflow Engine collaborator was injected, starts a real backing workflow instance for it. */
  generateTask(organizationId: OrganizationId, input: GenerateSalesTaskInput): Promise<SalesTask>;
  completeTask(organizationId: OrganizationId, taskId: SalesTaskId, outcome?: CompleteSalesTaskOutcome): Promise<SalesTask>;
  cancelTask(organizationId: OrganizationId, taskId: SalesTaskId): Promise<SalesTask>;
  get(organizationId: OrganizationId, taskId: SalesTaskId): Promise<SalesTask | null>;
  listByOpportunity(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<readonly SalesTask[]>;
}

/** Creates a real {@link SalesTasksService} backed by a {@link SalesTaskRepository} and an optional Workflow Engine collaborator. */
export function createSalesTasksService(
  repository: SalesTaskRepository,
  deps: SalesTasksDeps = {},
  eventBus?: SalesEventBus,
  now: () => string = nowIso,
): SalesTasksService {
  /** Idempotent per (organization, task type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  async function ensureWorkflowDefinitionId(organizationId: OrganizationId, taskType: SalesTaskType): Promise<string | undefined> {
    if (!deps.workflow) return undefined;
    const cacheKey = `${organizationId}::${taskType}`;
    const cached = definitionCache.get(cacheKey);
    if (cached) return cached;

    const config = TASK_WORKFLOW_CONFIG[taskType];
    const step: HumanTask = {
      stepId: generateId('workflow-step'),
      code: config.code,
      name: config.name,
      type: 'human',
      optional: false,
    };
    const { definition } = await deps.workflow.defineWorkflow({
      organizationId,
      code: config.code,
      name: config.name,
      metadata: { category: config.category },
      version: '1.0.0',
      steps: [step],
      transitions: [],
    });
    definitionCache.set(cacheKey, definition.id);
    return definition.id;
  }

  async function requireTask(organizationId: OrganizationId, taskId: SalesTaskId): Promise<SalesTask> {
    const task = await repository.findById(organizationId, taskId);
    if (!task) throw new SalesTaskNotFoundError(taskId);
    return task;
  }

  return {
    async generateTask(organizationId, input) {
      const timestamp = now();
      const workflowDefinitionId = await ensureWorkflowDefinitionId(organizationId, input.taskType);

      let workflowInstanceId: string | undefined;
      if (deps.workflow && workflowDefinitionId) {
        const instance = await deps.workflow.startWorkflow({
          organizationId,
          definitionId: workflowDefinitionId,
          variables: { opportunityId: input.opportunityId, notes: input.notes, dueAt: input.dueAt },
        });
        workflowInstanceId = instance.id;
      }

      const task: SalesTask = {
        id: generateId('sales-task'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        taskType: input.taskType,
        opportunityId: input.opportunityId,
        status: 'pending',
        notes: input.notes,
        dueAt: input.dueAt,
        workflowDefinitionId,
        workflowInstanceId,
      };
      await repository.save(task);
      return task;
    },

    async completeTask(organizationId, taskId, outcome) {
      const task = await requireTask(organizationId, taskId);
      if (task.status !== 'pending') {
        throw new InvalidSalesTaskTransitionError(taskId, task.status, 'completed');
      }
      const updated: SalesTask = {
        ...task,
        status: 'completed',
        approved: outcome?.approved,
        completedAt: now(),
        updatedAt: now(),
      };
      await repository.save(updated);
      if (task.taskType === 'proposal_approval' && outcome?.approved) {
        eventBus?.publish('proposal.approved', { opportunityId: task.opportunityId, organizationId, taskId });
      }
      return updated;
    },

    async cancelTask(organizationId, taskId) {
      const task = await requireTask(organizationId, taskId);
      if (task.status !== 'pending') {
        throw new InvalidSalesTaskTransitionError(taskId, task.status, 'cancelled');
      }
      const updated: SalesTask = { ...task, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, taskId) {
      return repository.findById(organizationId, taskId);
    },

    async listByOpportunity(organizationId, opportunityId) {
      return repository.findByOpportunity(organizationId, opportunityId);
    },
  };
}
