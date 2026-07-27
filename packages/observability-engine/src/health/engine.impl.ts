/**
 * Real Health Engine — component health, AI Runtime health, and Workflow
 * Engine dependency health. Composes the real, optional AI Runtime query
 * port and Workflow Engine query port (never a repository).
 *
 * @module health/engine.impl
 */
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { HealthCheckId, OrganizationId } from '../shared/identifiers.js';
import type { HealthCheckRepository } from './repository.js';
import type { HealthCheck, HealthStatus } from './types.js';

export interface HealthEngineDeps {
  readonly aiRuntime?: Pick<RuntimeQueries, 'findRuntimeState'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
}

/** Most-recently-recorded health check for a component, favoring the latest insert on a timestamp tie. */
function latestForComponent(checks: readonly HealthCheck[]): HealthCheck | null {
  if (checks.length === 0) return null;
  return [...checks].reverse().sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0]!;
}

export interface HealthEngine {
  checkComponentHealth(organizationId: OrganizationId, component: string, status: HealthStatus, details?: Readonly<Record<string, unknown>>): Promise<HealthCheck>;
  checkRuntimeHealth(organizationId: OrganizationId): Promise<HealthCheck>;
  checkWorkflowDependencyHealth(organizationId: OrganizationId): Promise<HealthCheck>;
  get(organizationId: OrganizationId, healthCheckId: HealthCheckId): Promise<HealthCheck | null>;
  list(organizationId: OrganizationId): Promise<readonly HealthCheck[]>;
  latest(organizationId: OrganizationId, component: string): Promise<HealthCheck | null>;
}

/** Creates a real {@link HealthEngine} over the optional AI Runtime / Workflow Engine collaborators. */
export function createHealthEngine(
  repository: HealthCheckRepository,
  deps: HealthEngineDeps = {},
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): HealthEngine {
  async function record(organizationId: OrganizationId, component: string, status: HealthStatus, details?: Readonly<Record<string, unknown>>): Promise<HealthCheck> {
    const previous = latestForComponent(await repository.findByComponent(organizationId, component));
    const timestamp = now();
    const check: HealthCheck = {
      id: generateId('health-check'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      component,
      status,
      details,
      checkedAt: timestamp,
    };
    await repository.save(check);
    if (previous?.status !== status) {
      eventBus?.publish('health.changed', { organizationId, healthCheckId: check.id, component, status });
    }
    return check;
  }

  return {
    checkComponentHealth: record,

    async checkRuntimeHealth(organizationId) {
      if (!deps.aiRuntime) return record(organizationId, 'ai-runtime', 'healthy');
      const { state, activeSessionCount, queuedTaskCount } = await deps.aiRuntime.findRuntimeState({ organizationId });
      const status: HealthStatus =
        state === 'terminated'
          ? 'unhealthy'
          : queuedTaskCount > 0 && queuedTaskCount > activeSessionCount * 3
            ? 'degraded'
            : 'healthy';
      return record(organizationId, 'ai-runtime', status, { state, activeSessionCount, queuedTaskCount });
    },

    async checkWorkflowDependencyHealth(organizationId) {
      if (!deps.workflow) return record(organizationId, 'workflow-engine', 'healthy');
      const { instances, total } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
      const failed = instances.filter((instance) => instance.status === 'failed').length;
      const failedRatio = total > 0 ? failed / total : 0;
      const status: HealthStatus = failedRatio > 0.5 ? 'unhealthy' : failedRatio > 0.2 ? 'degraded' : 'healthy';
      return record(organizationId, 'workflow-engine', status, { total, failed, failedRatio });
    },

    async get(organizationId, healthCheckId) {
      return repository.findById(organizationId, healthCheckId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async latest(organizationId, component) {
      return latestForComponent(await repository.findByComponent(organizationId, component));
    },
  };
}
