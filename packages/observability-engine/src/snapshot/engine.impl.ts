/**
 * Real Snapshot Engine — deterministic snapshots for runtime, workflows,
 * communications, analytics, and security. Composes the real, optional
 * AI Runtime, Workflow Engine, Communication Hub, Analytics Engine, and
 * AI Security Engine query ports (never a repository).
 *
 * @module snapshot/engine.impl
 */
import type { RuntimeQueries } from '@lateen-os/ai-runtime';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { AnalyticsQueries } from '@lateen-os/analytics-engine';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { ObservabilityEventBus } from '../events/observability-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ObservabilitySnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { ObservabilitySnapshotRepository } from './repository.js';
import type { ObservabilitySnapshot, ObservabilitySnapshotCategory } from './types.js';

export interface SnapshotEngineDeps {
  readonly aiRuntime?: Pick<RuntimeQueries, 'findRuntimeState'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
  readonly analyticsEngine?: Pick<AnalyticsQueries, 'findKPIs'>;
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
}

export interface SnapshotEngine {
  computeSnapshot(organizationId: OrganizationId, category: ObservabilitySnapshotCategory): Promise<ObservabilitySnapshot>;
  get(organizationId: OrganizationId, snapshotId: ObservabilitySnapshotId): Promise<ObservabilitySnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly ObservabilitySnapshot[]>;
  findByCategory(organizationId: OrganizationId, category: ObservabilitySnapshotCategory): Promise<readonly ObservabilitySnapshot[]>;
}

/** Creates a real {@link SnapshotEngine} over the optional AI Runtime/Workflow/Communication/Analytics/Security collaborators. */
export function createSnapshotEngine(
  repository: ObservabilitySnapshotRepository,
  deps: SnapshotEngineDeps = {},
  eventBus?: ObservabilityEventBus,
  now: () => string = nowIso,
): SnapshotEngine {
  async function computeData(organizationId: OrganizationId, category: ObservabilitySnapshotCategory): Promise<Record<string, unknown>> {
    switch (category) {
      case 'runtime': {
        if (!deps.aiRuntime) return {};
        const { state, activeSessionCount, queuedTaskCount } = await deps.aiRuntime.findRuntimeState({ organizationId });
        return { state, activeSessionCount, queuedTaskCount };
      }
      case 'workflows': {
        if (!deps.workflow) return {};
        const { instances, total } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
        return {
          total,
          active: instances.filter((i) => i.status === 'pending' || i.status === 'running' || i.status === 'waiting' || i.status === 'suspended').length,
          completed: instances.filter((i) => i.status === 'completed').length,
          failed: instances.filter((i) => i.status === 'failed').length,
        };
      }
      case 'communications': {
        if (!deps.communicationHub) return {};
        const { total: messageTotal } = await deps.communicationHub.queries.findMessages({ organizationId });
        const { total: timelineTotal } = await deps.communicationHub.queries.findTimeline({ organizationId });
        return { messageCount: messageTotal, timelineEntryCount: timelineTotal };
      }
      case 'analytics': {
        if (!deps.analyticsEngine) return {};
        const { total } = await deps.analyticsEngine.findKPIs({ organizationId });
        return { kpiSnapshotCount: total };
      }
      case 'security': {
        if (!deps.aiSecurity) return {};
        const { total: violationTotal } = await deps.aiSecurity.queries.findViolations({ organizationId });
        const { total: threatTotal } = await deps.aiSecurity.queries.findThreats({ organizationId });
        return { violationCount: violationTotal, threatCount: threatTotal };
      }
    }
  }

  return {
    async computeSnapshot(organizationId, category) {
      const data = await computeData(organizationId, category);
      const timestamp = now();
      const snapshot: ObservabilitySnapshot = {
        id: generateId('observability-snapshot'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        category,
        data,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('snapshot.created', { organizationId, snapshotId: snapshot.id, category });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCategory(organizationId, category) {
      return repository.findByCategory(organizationId, category);
    },
  };
}
