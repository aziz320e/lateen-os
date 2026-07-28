/**
 * Real Relationship Layer — the Customer Success Engine's only
 * integration point with CRM Engine, Sales Engine, Project Management
 * Engine, Communication Hub, Analytics Engine, Business DNA, and
 * Institutional Memory, each exclusively through its public API
 * (never a repository, never a mock).
 *
 * Every method degrades to a documented no-op (`null`/`[]`) when its
 * collaborator was not injected, so the Customer Success Engine
 * remains fully usable — and fully tested — completely offline
 * without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { MetricSnapshot } from '@lateen-os/analytics-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { Customer } from '@lateen-os/crm-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { Project } from '@lateen-os/project-management-engine';
import type { SalesOpportunity } from '@lateen-os/sales-engine';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface NotifyCustomerSuccessEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordCustomerSuccessMetricInput {
  readonly metricName: string;
  readonly value: number;
}

export interface LogCustomerSuccessDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RelationshipManagement {
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: string): Promise<Customer | null>;
  /** Real Sales Engine opportunity, fetched by id. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: string): Promise<SalesOpportunity | null>;
  /** Every real Project Management Engine project linked to this customer. `[]` if Project Management Engine is not injected. */
  getCustomerProjectsContext(organizationId: OrganizationId, customerId: string): Promise<readonly Project[]>;
  /** Sends a real Communication Hub notification for a customer success event. `null` if Communication Hub is not injected. */
  notifyCustomerSuccessEvent(organizationId: OrganizationId, input: NotifyCustomerSuccessEventInput): Promise<Notification | null>;
  /** Records a real Analytics Engine gauge metric snapshot. `null` if Analytics Engine is not injected. */
  recordCustomerSuccessMetric(organizationId: OrganizationId, input: RecordCustomerSuccessMetricInput): Promise<MetricSnapshot | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a significant customer success decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logCustomerSuccessDecisionToMemory(organizationId: OrganizationId, input: LogCustomerSuccessDecisionInput): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getOpportunityContext(organizationId, opportunityId) {
      if (!deps.sales) return null;
      return deps.sales.opportunities.get(organizationId, opportunityId);
    },

    async getCustomerProjectsContext(organizationId, customerId) {
      if (!deps.projects) return [];
      const { projects } = await deps.projects.queries.findProjects({ organizationId });
      return projects.filter((project) => project.customerId === customerId);
    },

    async notifyCustomerSuccessEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async recordCustomerSuccessMetric(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.metrics.recordGauge(organizationId, input.metricName, input.value);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logCustomerSuccessDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'customer',
        source: 'customer-success-engine',
        tags: ['customer-success'],
      });
    },
  };
}
