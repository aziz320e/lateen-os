/**
 * Real Compliance Analytics engine — compliance score, passed/failed
 * controls, remediation progress, and framework coverage. Composes the
 * real, optional AI Compliance Engine query port (never a repository).
 *
 * @module compliance-analytics/engine.impl
 */
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceAnalyticsId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceAnalyticsRepository } from './repository.js';
import type { ComplianceAnalyticsSnapshot, RemediationProgressSummary } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface ComplianceAnalyticsDeps {
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
}

export interface ComplianceAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId): Promise<ComplianceAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: ComplianceAnalyticsId): Promise<ComplianceAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly ComplianceAnalyticsSnapshot[]>;
}

/** Creates a real {@link ComplianceAnalyticsEngine} over the optional AI Compliance Engine collaborator. */
export function createComplianceAnalyticsEngine(
  repository: ComplianceAnalyticsRepository,
  deps: ComplianceAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): ComplianceAnalyticsEngine {
  return {
    async computeSnapshot(organizationId) {
      let complianceScore = 0;
      let passedControls = 0;
      let failedControls = 0;
      let remediationProgress: RemediationProgressSummary = { total: 0, completed: 0, percentComplete: 0 };
      let frameworkCoverage = 0;

      if (deps.aiCompliance) {
        const { statuses } = await deps.aiCompliance.queries.findComplianceStatus({ organizationId });
        complianceScore = statuses.length === 0 ? 0 : round2(statuses.reduce((sum, s) => sum + s.score, 0) / statuses.length);

        const { assessments } = await deps.aiCompliance.queries.findAssessments({ organizationId });
        passedControls = assessments.reduce((sum, assessment) => sum + assessment.passedControlIds.length, 0);
        failedControls = assessments.reduce((sum, assessment) => sum + assessment.failedControlIds.length, 0);

        const { remediations } = await deps.aiCompliance.queries.findRemediations({ organizationId });
        const completed = remediations.filter((r) => r.status === 'completed').length;
        remediationProgress = {
          total: remediations.length,
          completed,
          percentComplete: remediations.length === 0 ? 0 : round2((completed / remediations.length) * 100),
        };

        const { frameworks } = await deps.aiCompliance.queries.findFrameworks({ organizationId });
        const activeFrameworks = frameworks.filter((f) => f.status === 'active').length;
        frameworkCoverage = frameworks.length === 0 ? 0 : round2((activeFrameworks / frameworks.length) * 100);
      }

      const timestamp = now();
      const snapshot: ComplianceAnalyticsSnapshot = {
        id: generateId('compliance-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        complianceScore,
        passedControls,
        failedControls,
        remediationProgress,
        frameworkCoverage,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'compliance' });
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
