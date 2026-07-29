/**
 * Real Relationship Layer — the Marketplace's only integration point
 * with all 8 required sibling packages, each exclusively through its
 * public API (never a repository, never a mock). Exactly one method
 * per collaborator, mirroring the convention used by every other
 * Relationship Layer in this monorepo.
 *
 * Every method degrades to a documented no-op (`null`/`[]`) when its
 * collaborator was not injected, so the Marketplace remains fully
 * usable — and fully tested — completely offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { Organization } from '@lateen-os/admin-console';
import type { Agent } from '@lateen-os/ai-runtime';
import type { KpiSnapshot } from '@lateen-os/analytics-engine';
import type { Api } from '@lateen-os/api-gateway';
import type { Notification } from '@lateen-os/communication-hub';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { HealthCheck } from '@lateen-os/observability-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseExtensionApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedMarketplaceWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyMarketplaceEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface LogMarketplaceDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RelationshipManagement {
  /** Every real API Gateway registered API. `[]` if API Gateway is not injected. */
  getApiGatewayContext(organizationId: OrganizationId): Promise<readonly Api[]>;
  /** Real Admin Console organization record. `null` if Admin Console is not injected or the organization is unregistered. */
  getAdminOrganizationContext(organizationId: OrganizationId): Promise<Organization | null>;
  /** Real AI Runtime agent, fetched by id. `null` if AI Runtime is not injected or no agent matches. */
  getAgentContext(organizationId: OrganizationId, runtimeAgentId?: string): Promise<Agent | null>;
  /** Starts a real Workflow Engine extension-approval workflow. `null` if Workflow Engine is not injected. */
  raiseExtensionApprovalWorkflow(organizationId: OrganizationId, input: RaiseExtensionApprovalWorkflowInput): Promise<RaisedMarketplaceWorkflow | null>;
  /** Every real Analytics Engine KPI snapshot. `[]` if Analytics Engine is not injected. */
  getAnalyticsSnapshotContext(organizationId: OrganizationId): Promise<readonly KpiSnapshot[]>;
  /** Every real Observability Engine health check. `[]` if Observability Engine is not injected. */
  getObservabilityHealthContext(organizationId: OrganizationId): Promise<readonly HealthCheck[]>;
  /** Sends a real Communication Hub notification for a marketplace event. `null` if Communication Hub is not injected. */
  notifyMarketplaceEvent(organizationId: OrganizationId, input: NotifyMarketplaceEventInput): Promise<Notification | null>;
  /** Logs a real Institutional Memory decision entry. `null` if Institutional Memory is not injected. */
  logMarketplaceDecisionToMemory(organizationId: OrganizationId, input: LogMarketplaceDecisionInput): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getApiGatewayContext(organizationId) {
      if (!deps.apiGateway) return [];
      const { apis } = await deps.apiGateway.queries.findApis({ organizationId });
      return apis;
    },

    async getAdminOrganizationContext(organizationId) {
      if (!deps.adminConsole) return null;
      return deps.adminConsole.organizations.getOrganization(organizationId);
    },

    async getAgentContext(organizationId, runtimeAgentId) {
      if (!deps.aiRuntime) return null;
      const { agents } = await deps.aiRuntime.findAgent({ organizationId, runtimeAgentId });
      return agents[0] ?? null;
    },

    async raiseExtensionApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `marketplace.${input.requestType}`,
          name: `Marketplace Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `marketplace.${input.requestType}`,
          name: `Marketplace Approval — ${input.requestType}`,
          metadata: { category: 'custom' },
          version: '1.0.0',
          steps: [step],
          transitions: [],
        });
        workflowDefinitionId = definition.id;
        definitionCache.set(cacheKey, workflowDefinitionId);
      }

      const instance = await deps.workflow.startWorkflow({
        organizationId,
        definitionId: workflowDefinitionId,
        variables: { notes: input.notes },
      });

      return { workflowDefinitionId, workflowInstanceId: instance.id };
    },

    async getAnalyticsSnapshotContext(organizationId) {
      if (!deps.analytics) return [];
      const { kpis } = await deps.analytics.queries.findKPIs({ organizationId });
      return kpis;
    },

    async getObservabilityHealthContext(organizationId) {
      if (!deps.observability) return [];
      const { checks } = await deps.observability.queries.findHealth({ organizationId });
      return checks;
    },

    async notifyMarketplaceEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async logMarketplaceDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'operational',
        source: 'marketplace',
      });
    },
  };
}
