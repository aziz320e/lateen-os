/**
 * Real Performance Engine — execution time, queue latency, workflow
 * duration, message throughput, and runtime utilization. Composes the
 * real, optional AI Runtime, Workflow Engine, and Communication Hub
 * query ports (never a repository).
 *
 * Execution time is the mean `completedAt - createdAt` across real AI
 * Runtime execution results. Queue latency is the mean `updatedAt -
 * createdAt` across real, assigned (dequeued) AI Runtime tasks — AI
 * Runtime's task queue sets `updatedAt` at the moment a task is
 * dequeued, so this is a genuine, real signal rather than a synthetic
 * one.
 *
 * `findExecutionHistory()` — like Workflow Engine's `findHistory()` —
 * only returns results when scoped to a specific `planId` or `taskId`;
 * there is no real "every execution result in the organization" query.
 * `recordExecutionTime()` therefore accepts an optional scope mirroring
 * that real constraint, rather than pretending an org-wide query exists.
 *
 * @module performance/engine.impl
 */
import type { ExecutionPlanId, RuntimeQueries, TaskId } from '@lateen-os/ai-runtime';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PerformanceSampleId } from '../shared/identifiers.js';
import type { PerformanceSampleRepository } from './repository.js';
import type { PerformanceMetric, PerformanceSample } from './types.js';

export interface ExecutionTimeScope {
  readonly planId?: ExecutionPlanId;
  readonly taskId?: TaskId;
}

export interface PerformanceEngineDeps {
  readonly aiRuntime?: Pick<RuntimeQueries, 'findExecutionHistory' | 'findTasks' | 'findRuntimeState'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
}

function averageDurationMs(pairs: readonly (readonly [string, string])[]): number {
  if (pairs.length === 0) return 0;
  const total = pairs.reduce((sum, [start, end]) => sum + (new Date(end).getTime() - new Date(start).getTime()), 0);
  return total / pairs.length;
}

export interface PerformanceEngine {
  recordExecutionTime(organizationId: OrganizationId, scope?: ExecutionTimeScope): Promise<PerformanceSample>;
  recordQueueLatency(organizationId: OrganizationId): Promise<PerformanceSample>;
  recordWorkflowDuration(organizationId: OrganizationId): Promise<PerformanceSample>;
  recordMessageThroughput(organizationId: OrganizationId, periodMinutes: number): Promise<PerformanceSample>;
  recordRuntimeUtilization(organizationId: OrganizationId): Promise<PerformanceSample>;
  get(organizationId: OrganizationId, performanceSampleId: PerformanceSampleId): Promise<PerformanceSample | null>;
  list(organizationId: OrganizationId): Promise<readonly PerformanceSample[]>;
  findByMetric(organizationId: OrganizationId, metric: PerformanceMetric): Promise<readonly PerformanceSample[]>;
}

/** Creates a real {@link PerformanceEngine} over the optional AI Runtime / Workflow Engine / Communication Hub collaborators. */
export function createPerformanceEngine(
  repository: PerformanceSampleRepository,
  deps: PerformanceEngineDeps = {},
  now: () => string = nowIso,
): PerformanceEngine {
  async function record(organizationId: OrganizationId, metric: PerformanceMetric, value: number, unit: PerformanceSample['unit'], context?: Readonly<Record<string, unknown>>): Promise<PerformanceSample> {
    const timestamp = now();
    const sample: PerformanceSample = {
      id: generateId('performance-sample'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      metric,
      value,
      unit,
      context,
      recordedAt: timestamp,
    };
    await repository.save(sample);
    return sample;
  }

  return {
    async recordExecutionTime(organizationId, scope = {}) {
      if (!deps.aiRuntime) return record(organizationId, 'execution_time', 0, 'ms');
      const { results } = await deps.aiRuntime.findExecutionHistory({ organizationId, planId: scope.planId, taskId: scope.taskId });
      const value = averageDurationMs(results.map((result) => [result.createdAt, result.completedAt] as const));
      return record(organizationId, 'execution_time', value, 'ms', { sampleCount: results.length });
    },

    async recordQueueLatency(organizationId) {
      if (!deps.aiRuntime) return record(organizationId, 'queue_latency', 0, 'ms');
      const { tasks } = await deps.aiRuntime.findTasks({ organizationId, status: 'assigned' });
      const value = averageDurationMs(tasks.map((task) => [task.createdAt, task.updatedAt] as const));
      return record(organizationId, 'queue_latency', value, 'ms', { sampleCount: tasks.length });
    },

    async recordWorkflowDuration(organizationId) {
      if (!deps.workflow) return record(organizationId, 'workflow_duration', 0, 'ms');
      const { instances } = await deps.workflow.queries.findRunningWorkflows({ organizationId, status: 'completed' });
      const pairs: Array<readonly [string, string]> = [];
      for (const instance of instances) {
        if (instance.completedAt) pairs.push([instance.startedAt, instance.completedAt]);
      }
      const value = averageDurationMs(pairs);
      return record(organizationId, 'workflow_duration', value, 'ms', { sampleCount: pairs.length });
    },

    async recordMessageThroughput(organizationId, periodMinutes) {
      if (!deps.communicationHub) return record(organizationId, 'message_throughput', 0, 'per_minute', { periodMinutes });
      const { total } = await deps.communicationHub.queries.findMessages({ organizationId });
      const value = periodMinutes > 0 ? total / periodMinutes : 0;
      return record(organizationId, 'message_throughput', value, 'per_minute', { total, periodMinutes });
    },

    async recordRuntimeUtilization(organizationId) {
      if (!deps.aiRuntime) return record(organizationId, 'runtime_utilization', 0, 'percentage');
      const { activeSessionCount, queuedTaskCount } = await deps.aiRuntime.findRuntimeState({ organizationId });
      const denominator = activeSessionCount + queuedTaskCount;
      const value = denominator > 0 ? (activeSessionCount / denominator) * 100 : 0;
      return record(organizationId, 'runtime_utilization', value, 'percentage', { activeSessionCount, queuedTaskCount });
    },

    async get(organizationId, performanceSampleId) {
      return repository.findById(organizationId, performanceSampleId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByMetric(organizationId, metric) {
      return repository.findByMetric(organizationId, metric);
    },
  };
}
