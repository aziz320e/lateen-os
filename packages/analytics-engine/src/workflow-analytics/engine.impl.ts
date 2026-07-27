/**
 * Real Workflow Analytics engine — active/completed/failed workflow
 * counts, average execution time, and bottlenecks (steps with the
 * most waiting tasks). Composes the real, optional Workflow Engine
 * query port (never a repository).
 *
 * @module workflow-analytics/engine.impl
 */
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, WorkflowAnalyticsId } from '../shared/identifiers.js';
import type { WorkflowAnalyticsRepository } from './repository.js';
import type { WorkflowAnalyticsSnapshot } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const ACTIVE_STATUSES = new Set(['pending', 'running', 'waiting', 'suspended']);

/** Pure: average minutes between `startedAt` and `completedAt` across a set of completed instances. */
export function computeAverageExecutionTimeMinutes(instances: readonly { readonly startedAt: string; readonly completedAt?: string }[]): number {
  const durations = instances
    .filter((instance): instance is { startedAt: string; completedAt: string } => instance.completedAt !== undefined)
    .map((instance) => (new Date(instance.completedAt).getTime() - new Date(instance.startedAt).getTime()) / 60_000);
  if (durations.length === 0) return 0;
  return round2(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

export interface WorkflowAnalyticsDeps {
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
}

export interface WorkflowAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<WorkflowAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: WorkflowAnalyticsId): Promise<WorkflowAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly WorkflowAnalyticsSnapshot[]>;
}

/** Creates a real {@link WorkflowAnalyticsEngine} over the optional Workflow Engine collaborator. */
export function createWorkflowAnalyticsEngine(
  repository: WorkflowAnalyticsRepository,
  deps: WorkflowAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): WorkflowAnalyticsEngine {
  return {
    async computeSnapshot(organizationId) {
      let activeWorkflows = 0;
      let completedWorkflows = 0;
      let failedWorkflows = 0;
      let averageExecutionTimeMinutes = 0;
      const bottlenecks: Record<string, number> = {};

      if (deps.workflow) {
        const { instances } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
        activeWorkflows = instances.filter((instance) => ACTIVE_STATUSES.has(instance.status)).length;
        completedWorkflows = instances.filter((instance) => instance.status === 'completed').length;
        failedWorkflows = instances.filter((instance) => instance.status === 'failed').length;
        averageExecutionTimeMinutes = computeAverageExecutionTimeMinutes(instances.filter((instance) => instance.status === 'completed'));

        const { stepInstances } = await deps.workflow.queries.findWaitingTasks({ organizationId });
        for (const stepInstance of stepInstances) {
          bottlenecks[stepInstance.stepId] = (bottlenecks[stepInstance.stepId] ?? 0) + 1;
        }
      }

      const timestamp = now();
      const snapshot: WorkflowAnalyticsSnapshot = {
        id: generateId('workflow-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        activeWorkflows,
        completedWorkflows,
        failedWorkflows,
        averageExecutionTimeMinutes,
        bottlenecks,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'workflow' });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
