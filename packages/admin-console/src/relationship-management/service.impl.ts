/**
 * Real Relationship Layer — the Admin Console's only integration
 * point with all 9 required sibling packages, each exclusively
 * through its public API (never a repository, never a mock). Exactly
 * one method per collaborator, mirroring the convention used by every
 * other Relationship Layer in this monorepo.
 *
 * Every method degrades to a documented no-op (`null`/`[]`) when its
 * collaborator was not injected, so the Admin Console remains fully
 * usable — and fully tested — completely offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { Api } from '@lateen-os/api-gateway';
import type { ComplianceFramework } from '@lateen-os/ai-compliance-engine';
import type { GovernancePolicy } from '@lateen-os/ai-governance-engine';
import type { Policy as SecurityPolicy } from '@lateen-os/ai-security-engine';
import type { KpiSnapshot } from '@lateen-os/analytics-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { HealthCheck } from '@lateen-os/observability-engine';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface LogAdminDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface NotifyAdminEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RelationshipManagement {
  /** Every real API Gateway registered API. `[]` if API Gateway is not injected. */
  getApiGatewayContext(organizationId: OrganizationId): Promise<readonly Api[]>;
  /** Every real Observability Engine health check. `[]` if Observability Engine is not injected. */
  getObservabilityHealthContext(organizationId: OrganizationId): Promise<readonly HealthCheck[]>;
  /** Every real Analytics Engine KPI snapshot. `[]` if Analytics Engine is not injected. */
  getAnalyticsSnapshotContext(organizationId: OrganizationId): Promise<readonly KpiSnapshot[]>;
  /** Every real AI Security Engine policy. `[]` if AI Security Engine is not injected. */
  getSecurityPolicyContext(organizationId: OrganizationId): Promise<readonly SecurityPolicy[]>;
  /** Every real AI Governance Engine policy. `[]` if AI Governance Engine is not injected. */
  getGovernancePolicyContext(organizationId: OrganizationId): Promise<readonly GovernancePolicy[]>;
  /** Every real AI Compliance Engine framework. `[]` if AI Compliance Engine is not injected. */
  getComplianceFrameworkContext(organizationId: OrganizationId): Promise<readonly ComplianceFramework[]>;
  /** Real Business DNA business profile. `null` if Business DNA is not injected or no profile exists. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a real Institutional Memory decision entry. `null` if Institutional Memory is not injected. */
  logAdminDecisionToMemory(organizationId: OrganizationId, input: LogAdminDecisionInput): Promise<KnowledgeEntry | null>;
  /** Sends a real Communication Hub notification for an admin event. `null` if Communication Hub is not injected. */
  notifyAdminEvent(organizationId: OrganizationId, input: NotifyAdminEventInput): Promise<Notification | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async getApiGatewayContext(organizationId) {
      if (!deps.apiGateway) return [];
      const { apis } = await deps.apiGateway.queries.findApis({ organizationId });
      return apis;
    },

    async getObservabilityHealthContext(organizationId) {
      if (!deps.observability) return [];
      const { checks } = await deps.observability.queries.findHealth({ organizationId });
      return checks;
    },

    async getAnalyticsSnapshotContext(organizationId) {
      if (!deps.analytics) return [];
      const { kpis } = await deps.analytics.queries.findKPIs({ organizationId });
      return kpis;
    },

    async getSecurityPolicyContext(organizationId) {
      if (!deps.aiSecurity) return [];
      const { policies } = await deps.aiSecurity.queries.findPolicies({ organizationId });
      return policies;
    },

    async getGovernancePolicyContext(organizationId) {
      if (!deps.aiGovernance) return [];
      const { policies } = await deps.aiGovernance.queries.findPolicies({ organizationId });
      return policies;
    },

    async getComplianceFrameworkContext(organizationId) {
      if (!deps.aiCompliance) return [];
      const { frameworks } = await deps.aiCompliance.queries.findFrameworks({ organizationId });
      return frameworks;
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logAdminDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'operational',
        source: 'admin-console',
      });
    },

    async notifyAdminEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },
  };
}
