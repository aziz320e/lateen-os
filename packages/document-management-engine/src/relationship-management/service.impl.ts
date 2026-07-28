/**
 * Real Relationship Layer — the Document Management Engine's only
 * integration point with Business DNA, Institutional Memory,
 * Communication Hub, Project Management Engine, CRM Engine, Customer
 * Success Engine, Workflow Engine, and Analytics Engine, each
 * exclusively through its public API (never a repository, never a
 * mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Document Management Engine
 * remains fully usable — and fully tested — completely offline
 * without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { MetricSnapshot } from '@lateen-os/analytics-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { Customer } from '@lateen-os/crm-engine';
import type { CustomerSuccessRecord } from '@lateen-os/customer-success-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { Project } from '@lateen-os/project-management-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseDocumentApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedDocumentWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyDocumentEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordDocumentMetricInput {
  readonly metricName: string;
  readonly value: number;
}

export interface LogDocumentDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RelationshipManagement {
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a significant document decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logDocumentDecisionToMemory(organizationId: OrganizationId, input: LogDocumentDecisionInput): Promise<KnowledgeEntry | null>;
  /** Sends a real Communication Hub notification for a document event. `null` if Communication Hub is not injected. */
  notifyDocumentEvent(organizationId: OrganizationId, input: NotifyDocumentEventInput): Promise<Notification | null>;
  /** Real Project Management Engine project, fetched by id. `null` if Project Management Engine is not injected or the project is unknown. */
  getProjectContext(organizationId: OrganizationId, projectId: string): Promise<Project | null>;
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: string): Promise<Customer | null>;
  /** Real Customer Success Engine record for a customer. `null` if Customer Success Engine is not injected or no record exists for that customer. */
  getCustomerSuccessContext(organizationId: OrganizationId, customerId: string): Promise<CustomerSuccessRecord | null>;
  /** Starts a real Workflow Engine document-approval workflow. `null` if Workflow Engine is not injected. */
  raiseDocumentApprovalWorkflow(organizationId: OrganizationId, input: RaiseDocumentApprovalWorkflowInput): Promise<RaisedDocumentWorkflow | null>;
  /** Records a real Analytics Engine gauge metric snapshot. `null` if Analytics Engine is not injected. */
  recordDocumentMetric(organizationId: OrganizationId, input: RecordDocumentMetricInput): Promise<MetricSnapshot | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logDocumentDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'compliance',
        source: 'document-management-engine',
        tags: ['document'],
      });
    },

    async notifyDocumentEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async getProjectContext(organizationId, projectId) {
      if (!deps.projects) return null;
      return deps.projects.projects.get(organizationId, projectId);
    },

    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getCustomerSuccessContext(organizationId, customerId) {
      if (!deps.customerSuccess) return null;
      return deps.customerSuccess.customers.findByCustomer(organizationId, customerId);
    },

    async raiseDocumentApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `document.${input.requestType}`,
          name: `Document Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `document.${input.requestType}`,
          name: `Document Approval — ${input.requestType}`,
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

    async recordDocumentMetric(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.metrics.recordGauge(organizationId, input.metricName, input.value);
    },
  };
}
