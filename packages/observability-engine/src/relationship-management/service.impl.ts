/**
 * Real Relationship Layer — integrates AI Runtime, Workflow Engine,
 * Communication Hub, AI Security Engine, AI Governance Engine, AI
 * Compliance Engine, and Analytics Engine, each exclusively through its
 * public query API (never a repository, never a mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Observability Platform remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RelationshipManagement {
  /** Real AI Runtime agent count for the organization. `null` if AI Runtime is not injected. */
  getAiRuntimeContext(organizationId: OrganizationId): Promise<{ readonly agentCount: number } | null>;
  /** Real Workflow Engine waiting-task count. `null` if Workflow Engine is not injected. */
  getWorkflowContext(organizationId: OrganizationId): Promise<{ readonly waitingTaskCount: number } | null>;
  /** Real Communication Hub notification count. `null` if Communication Hub is not injected. */
  getCommunicationContext(organizationId: OrganizationId): Promise<{ readonly notificationCount: number } | null>;
  /** Real AI Security Engine policy count. `null` if AI Security Engine is not injected. */
  getSecurityContext(organizationId: OrganizationId): Promise<{ readonly policyCount: number } | null>;
  /** Real AI Governance Engine pending-approval count. `null` if AI Governance Engine is not injected. */
  getGovernanceContext(organizationId: OrganizationId): Promise<{ readonly pendingApprovalCount: number } | null>;
  /** Real AI Compliance Engine active-framework count. `null` if AI Compliance Engine is not injected. */
  getComplianceContext(organizationId: OrganizationId): Promise<{ readonly activeFrameworkCount: number } | null>;
  /** Real Analytics Engine dashboard count. `null` if Analytics Engine is not injected. */
  getAnalyticsContext(organizationId: OrganizationId): Promise<{ readonly dashboardCount: number } | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async getAiRuntimeContext(organizationId) {
      if (!deps.aiRuntime) return null;
      const { agents } = await deps.aiRuntime.findAgent({ organizationId });
      return { agentCount: agents.length };
    },

    async getWorkflowContext(organizationId) {
      if (!deps.workflow) return null;
      const { total } = await deps.workflow.queries.findWaitingTasks({ organizationId });
      return { waitingTaskCount: total };
    },

    async getCommunicationContext(organizationId) {
      if (!deps.communicationHub) return null;
      const { total } = await deps.communicationHub.queries.findNotifications({ organizationId });
      return { notificationCount: total };
    },

    async getSecurityContext(organizationId) {
      if (!deps.aiSecurity) return null;
      const { total } = await deps.aiSecurity.queries.findPolicies({ organizationId });
      return { policyCount: total };
    },

    async getGovernanceContext(organizationId) {
      if (!deps.aiGovernance) return null;
      const { total } = await deps.aiGovernance.queries.findApprovals({ organizationId, status: 'pending' });
      return { pendingApprovalCount: total };
    },

    async getComplianceContext(organizationId) {
      if (!deps.aiCompliance) return null;
      const { total } = await deps.aiCompliance.queries.findFrameworks({ organizationId, status: 'active' });
      return { activeFrameworkCount: total };
    },

    async getAnalyticsContext(organizationId) {
      if (!deps.analyticsEngine) return null;
      const { total } = await deps.analyticsEngine.findDashboards({ organizationId });
      return { dashboardCount: total };
    },
  };
}
