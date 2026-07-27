/**
 * Real Relationship Layer — integrates Institutional Memory, Domain
 * Graph, Decision Engine, Intelligence Engine, AI Workforce, and
 * Business DNA, each exclusively through its public API (never a
 * repository, never a mock). The 8 category analytics modules
 * (revenue, sales, marketing, communication, workflow, security,
 * governance, compliance) own their own, more specific integrations
 * directly — see each module's `engine.impl.ts`.
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Analytics Platform remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface WorkforceUtilizationContext {
  readonly busyCount: number;
  readonly activeCount: number;
  readonly utilizationPercentage: number;
}

type FindKnowledgeResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['institutionalMemory']>['findKnowledge']>>;
type GraphStatisticsResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['domainGraph']>['graphStatistics']>>;
type PendingApprovalsResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['decisionEngine']>['findPendingApprovals']>>;
type BusinessOpportunitiesResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['intelligenceEngine']>['findBusinessOpportunities']>>;

export interface RelationshipManagement {
  /** Real Institutional Memory knowledge entries for the organization. `null` if Institutional Memory is not injected. */
  getInstitutionalMemoryContext(organizationId: OrganizationId): Promise<FindKnowledgeResult | null>;
  /** Real Domain Graph statistics for the organization's graph. `null` if Domain Graph is not injected. */
  getDomainGraphContext(organizationId: OrganizationId, graphId: string): Promise<GraphStatisticsResult | null>;
  /** Real Decision Engine pending approvals. `null` if Decision Engine is not injected. */
  getDecisionContext(organizationId: OrganizationId): Promise<PendingApprovalsResult | null>;
  /** Real Intelligence Engine business opportunities. `null` if Intelligence Engine is not injected. */
  getIntelligenceContext(organizationId: OrganizationId): Promise<BusinessOpportunitiesResult | null>;
  /** Real AI Workforce utilization, computed from real worker statuses. `null` if AI Workforce is not injected. */
  getWorkforceUtilizationContext(organizationId: OrganizationId): Promise<WorkforceUtilizationContext | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
}

const ACTIVE_WORKER_STATUSES = new Set(['active', 'busy']);

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async getInstitutionalMemoryContext(organizationId) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.findKnowledge({ organizationId });
    },

    async getDomainGraphContext(organizationId, graphId) {
      if (!deps.domainGraph) return null;
      return deps.domainGraph.graphStatistics({ organizationId, graphId });
    },

    async getDecisionContext(organizationId) {
      if (!deps.decisionEngine) return null;
      return deps.decisionEngine.findPendingApprovals({ organizationId });
    },

    async getIntelligenceContext(organizationId) {
      if (!deps.intelligenceEngine) return null;
      return deps.intelligenceEngine.findBusinessOpportunities({ organizationId });
    },

    async getWorkforceUtilizationContext(organizationId) {
      if (!deps.aiWorkforce) return null;
      const { workers } = await deps.aiWorkforce.findWorkers({ organizationId });
      const activeCount = workers.filter((worker) => ACTIVE_WORKER_STATUSES.has(worker.status)).length;
      const busyCount = workers.filter((worker) => worker.status === 'busy').length;
      return {
        busyCount,
        activeCount,
        utilizationPercentage: activeCount === 0 ? 0 : Math.round((busyCount / activeCount) * 10000) / 100,
      };
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },
  };
}
