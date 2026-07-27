/**
 * Real Relationship Layer — the Communication Hub's only integration
 * point with CRM Engine, Sales Engine, Marketing Engine, Business DNA,
 * Institutional Memory, Workflow Engine, and AI Workforce, each
 * exclusively through its public API (never a repository, never a
 * mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Communication Hub remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { AIWorker, WorkerId } from '@lateen-os/ai-workforce';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Customer, CustomerId } from '@lateen-os/crm-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { Campaign, CampaignId } from '@lateen-os/marketing-engine';
import type { SalesOpportunity, SalesOpportunityId } from '@lateen-os/sales-engine';
import type { WorkflowInstance, WorkflowInstanceId } from '@lateen-os/workflow-engine';
import type { Conversation } from '../conversation/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RelationshipManagement {
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;
  /** Real Sales Engine opportunity, fetched by id. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity | null>;
  /** Real Marketing Engine campaign, fetched by id. `null` if Marketing Engine is not injected or the campaign is unknown. */
  getCampaignContext(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a conversation as a real Institutional Memory `'observation'` knowledge entry. `null` if Institutional Memory is not injected. */
  logConversationToMemory(organizationId: OrganizationId, conversation: Conversation): Promise<KnowledgeEntry | null>;
  /** Real Workflow Engine instance, fetched by id via the public query API. `null` if Workflow Engine is not injected or the instance is unknown. */
  getWorkflowInstanceContext(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<WorkflowInstance | null>;
  /** Real AI Workforce worker, fetched by id. `null` if AI Workforce is not injected or the worker is unknown. */
  getAiWorkerContext(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected CRM / Sales / Marketing / Business DNA / Institutional Memory / Workflow Engine / AI Workforce collaborators. */
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

    async getCampaignContext(organizationId, campaignId) {
      if (!deps.marketing) return null;
      return deps.marketing.campaigns.get(organizationId, campaignId);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logConversationToMemory(organizationId, conversation) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: conversation.subject ?? `Conversation ${conversation.id}`,
        content: `Conversation "${conversation.subject ?? conversation.id}" (${conversation.conversationType})`,
        knowledgeType: 'observation',
        category: 'operational',
        source: 'communication-hub',
        tags: ['communication', conversation.conversationType],
      });
    },

    async getWorkflowInstanceContext(organizationId, instanceId) {
      if (!deps.workflow) return null;
      const { instances } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
      return instances.find((instance) => instance.id === instanceId) ?? null;
    },

    async getAiWorkerContext(organizationId, workerId) {
      if (!deps.aiWorkforce) return null;
      return deps.aiWorkforce.lifecycle.get(organizationId, workerId);
    },
  };
}
