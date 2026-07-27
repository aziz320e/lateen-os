/**
 * Real Relationship Layer — the Marketing Engine's only integration
 * point with CRM Engine, Sales Engine, Business DNA, Institutional
 * Memory, and Domain Graph, each exclusively through its public API
 * (never a repository, never a mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Marketing Engine remains fully
 * usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Customer, Lead } from '@lateen-os/crm-engine';
import type { DomainGraphId, GraphNode } from '@lateen-os/domain-graph';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { SalesOpportunity, SalesOpportunityId } from '@lateen-os/sales-engine';
import type { Campaign } from '../campaign/types.js';
import type { MarketingLead } from '../lead-generation/types.js';
import type { CustomerId, OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

async function upsertCampaignEntity(
  domainGraph: NonNullable<RelationshipManagementDeps['domainGraph']>,
  organizationId: OrganizationId,
  graphId: DomainGraphId,
  campaign: Campaign,
): Promise<GraphNode> {
  const existingNodes = await domainGraph.entities.list(organizationId, graphId);
  const existing = existingNodes.find((node) => node.nodeType === 'campaign' && node.entityId === campaign.id);
  if (existing) {
    return domainGraph.entities.update(organizationId, graphId, existing.nodeId, { label: campaign.name });
  }
  return domainGraph.entities.register(organizationId, graphId, { nodeType: 'campaign', entityId: campaign.id, label: campaign.name });
}

export interface RelationshipManagement {
  /** Creates a real CRM Engine lead from a generated marketing lead. `null` if CRM Engine is not injected. */
  syncLeadToCrm(organizationId: OrganizationId, lead: MarketingLead): Promise<Lead | null>;
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;
  /** Real Sales Engine opportunity, fetched by id. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a campaign as a real Institutional Memory `'observation'` knowledge entry. `null` if Institutional Memory is not injected. */
  logCampaignToMemory(organizationId: OrganizationId, campaign: Campaign): Promise<KnowledgeEntry | null>;
  /** Registers or updates a Domain Graph `'campaign'` entity. `null` if Domain Graph is not injected. */
  syncCampaignToGraph(organizationId: OrganizationId, graphId: DomainGraphId, campaign: Campaign): Promise<GraphNode | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected CRM / Sales / Business DNA / Institutional Memory / Domain Graph collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async syncLeadToCrm(organizationId, lead) {
      if (!deps.crm) return null;
      return deps.crm.leads.create(organizationId, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        source: lead.source,
        tags: lead.tags,
      });
    },

    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getOpportunityContext(organizationId, opportunityId) {
      if (!deps.sales) return null;
      return deps.sales.opportunities.get(organizationId, opportunityId);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logCampaignToMemory(organizationId, campaign) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: campaign.name,
        content: `Campaign "${campaign.name}" (${campaign.campaignType})`,
        knowledgeType: 'observation',
        category: 'commercial',
        source: 'marketing-engine',
        tags: ['marketing', campaign.campaignType],
      });
    },

    async syncCampaignToGraph(organizationId, graphId, campaign) {
      if (!deps.domainGraph) return null;
      return upsertCampaignEntity(deps.domainGraph, organizationId, graphId, campaign);
    },
  };
}
