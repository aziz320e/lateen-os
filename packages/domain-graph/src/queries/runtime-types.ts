/** @module queries/runtime-types */
import type { DomainRelationshipType, GraphNode, GraphRelationship } from '../graph/types.js';
import type { EntitySearchMatch, SearchEntitiesQuery } from '../search/types.js';
import type { GraphPathResult, NeighborDirection, RelationshipFilter } from '../store/graph-repository.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';

export interface FindEntityQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
  readonly nodeId: GraphNodeId;
}

export interface FindEntityResult {
  readonly entity: GraphNode | null;
}

export interface SearchEntitiesParams extends SearchEntitiesQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
}

export interface SearchEntitiesResult {
  readonly matches: readonly EntitySearchMatch[];
  readonly total: number;
}

export interface FindRelationshipsQuery extends RelationshipFilter {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
}

export interface FindRelationshipsResult {
  readonly relationships: readonly GraphRelationship[];
  readonly total: number;
}

export interface FindNeighborsQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
  readonly nodeId: GraphNodeId;
  readonly direction?: NeighborDirection;
}

export interface FindNeighborsResult {
  readonly neighbors: readonly GraphNode[];
}

export interface ShortestPathQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
  readonly sourceNodeId: GraphNodeId;
  readonly targetNodeId: GraphNodeId;
}

export interface ShortestPathQueryResult {
  readonly path: GraphPathResult | null;
}

export interface DependencyOrderQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
  readonly relationshipTypes?: readonly DomainRelationshipType[];
}

export interface DependencyOrderResult {
  readonly order: readonly GraphNode[];
}

export interface DetectCyclesQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
  readonly relationshipTypes?: readonly DomainRelationshipType[];
}

export interface DetectCyclesResult {
  readonly cycles: readonly (readonly GraphNodeId[])[];
}

export interface GraphStatisticsQuery {
  readonly organizationId: OrganizationId;
  readonly graphId: DomainGraphId;
}

export interface GraphStatisticsResult {
  readonly entityCount: number;
  readonly relationshipCount: number;
  readonly entityCountsByType: Readonly<Record<string, number>>;
  readonly relationshipCountsByType: Readonly<Record<string, number>>;
  readonly componentCount: number;
}
