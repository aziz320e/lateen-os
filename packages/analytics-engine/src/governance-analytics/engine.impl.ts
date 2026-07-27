/**
 * Real Governance Analytics engine — active policies, pending
 * approvals, governance violations, and risk distribution. Composes
 * the real, optional AI Governance Engine query port (never a
 * repository). "Governance violations" is a proxy over rejected
 * governance decisions (`findGovernanceEvents({ outcome: 'rejected' })`)
 * — AI Governance Engine does not persist a separate violations feed,
 * only publishes `governance.violation.detected` at evaluation time.
 *
 * @module governance-analytics/engine.impl
 */
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { GovernanceAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { GovernanceAnalyticsRepository } from './repository.js';
import type { GovernanceAnalyticsSnapshot } from './types.js';

export interface GovernanceAnalyticsDeps {
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
}

export interface GovernanceAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<GovernanceAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: GovernanceAnalyticsId): Promise<GovernanceAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly GovernanceAnalyticsSnapshot[]>;
}

/** Creates a real {@link GovernanceAnalyticsEngine} over the optional AI Governance Engine collaborator. */
export function createGovernanceAnalyticsEngine(
  repository: GovernanceAnalyticsRepository,
  deps: GovernanceAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): GovernanceAnalyticsEngine {
  return {
    async computeSnapshot(organizationId) {
      let activePolicies = 0;
      let pendingApprovals = 0;
      let governanceViolations = 0;
      const riskDistribution: Record<string, number> = {};

      if (deps.aiGovernance) {
        activePolicies = (await deps.aiGovernance.queries.findPolicies({ organizationId, status: 'active' })).total;
        pendingApprovals = (await deps.aiGovernance.queries.findApprovals({ organizationId, status: 'pending' })).total;
        governanceViolations = (await deps.aiGovernance.queries.findGovernanceEvents({ organizationId, outcome: 'rejected' })).total;

        const { risks } = await deps.aiGovernance.queries.findRisks({ organizationId });
        for (const risk of risks) {
          riskDistribution[risk.riskLevel] = (riskDistribution[risk.riskLevel] ?? 0) + 1;
        }
      }

      const timestamp = now();
      const snapshot: GovernanceAnalyticsSnapshot = {
        id: generateId('governance-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        activePolicies,
        pendingApprovals,
        governanceViolations,
        riskDistribution,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'governance' });
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
