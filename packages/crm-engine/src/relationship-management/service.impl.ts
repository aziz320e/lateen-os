/**
 * Real Relationship Management — the CRM Engine's only integration point
 * with Business DNA, Institutional Memory, and Domain Graph, each
 * exclusively through its public API (never a repository, never a mock).
 *
 * Business DNA integration is structural: `OrganizationId`/`CustomerId`
 * are reused directly (see `shared/identifiers.ts`) rather than
 * redefined. Domain Graph and Institutional Memory integration is
 * behavioral: this service calls their real, injected runtimes.
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the CRM Engine remains fully usable
 * offline without either package.
 *
 * @module relationship-management/service.impl
 */
import type { DomainGraphId, DomainRelationshipType, GraphNode, GraphNodeId, GraphRelationship } from '@lateen-os/domain-graph';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { Activity } from '../activity/types.js';
import type { Contact } from '../contact/types.js';
import type { Customer } from '../customer/types.js';
import type { Lead } from '../lead/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

async function upsertEntity(
  domainGraph: NonNullable<RelationshipManagementDeps['domainGraph']>,
  organizationId: OrganizationId,
  graphId: DomainGraphId,
  nodeType: 'customer' | 'lead' | 'contact',
  entityId: string,
  label: string,
): Promise<GraphNode> {
  const existingNodes = await domainGraph.entities.list(organizationId, graphId);
  const existing = existingNodes.find((node) => node.nodeType === nodeType && node.entityId === entityId);
  if (existing) {
    return domainGraph.entities.update(organizationId, graphId, existing.nodeId, { label });
  }
  return domainGraph.entities.register(organizationId, graphId, { nodeType, entityId, label });
}

export interface RelationshipManagement {
  /** Registers or updates a Domain Graph `'customer'` entity for this customer. `null` if Domain Graph is not injected. */
  syncCustomerToGraph(organizationId: OrganizationId, graphId: DomainGraphId, customer: Customer): Promise<GraphNode | null>;
  /** Registers or updates a Domain Graph `'lead'` entity for this lead. `null` if Domain Graph is not injected. */
  syncLeadToGraph(organizationId: OrganizationId, graphId: DomainGraphId, lead: Lead): Promise<GraphNode | null>;
  /** Registers or updates a Domain Graph `'contact'` entity for this contact. `null` if Domain Graph is not injected. */
  syncContactToGraph(organizationId: OrganizationId, graphId: DomainGraphId, contact: Contact): Promise<GraphNode | null>;
  /** Creates a real Domain Graph relationship between two already-synced entities. `null` if Domain Graph is not injected. */
  linkEntities(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
    relationshipType: DomainRelationshipType,
  ): Promise<GraphRelationship | null>;
  /** Logs a significant activity as an Institutional Memory `'observation'` knowledge entry. `null` if Institutional Memory is not injected. */
  logActivityToMemory(organizationId: OrganizationId, activity: Activity): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected Domain Graph / Institutional Memory collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  return {
    async syncCustomerToGraph(organizationId, graphId, customer) {
      if (!deps.domainGraph) return null;
      return upsertEntity(deps.domainGraph, organizationId, graphId, 'customer', customer.id, customer.name);
    },

    async syncLeadToGraph(organizationId, graphId, lead) {
      if (!deps.domainGraph) return null;
      return upsertEntity(deps.domainGraph, organizationId, graphId, 'lead', lead.id, lead.name);
    },

    async syncContactToGraph(organizationId, graphId, contact) {
      if (!deps.domainGraph) return null;
      return upsertEntity(deps.domainGraph, organizationId, graphId, 'contact', contact.id, `${contact.firstName} ${contact.lastName}`.trim());
    },

    async linkEntities(organizationId, graphId, sourceNodeId, targetNodeId, relationshipType) {
      if (!deps.domainGraph) return null;
      return deps.domainGraph.relationships.create(organizationId, graphId, { relationshipType, sourceNodeId, targetNodeId });
    },

    async logActivityToMemory(organizationId, activity) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: activity.subject,
        content: activity.notes ?? activity.subject,
        knowledgeType: 'observation',
        category: 'customer',
        source: 'crm-engine',
        tags: [activity.activityType, activity.relatedTo.entityType],
      });
    },
  };
}
