/**
 * Domain graph query port — read-side semantic queries over the graph.
 *
 * Implementations live outside this package. No query logic is provided here.
 *
 * @module queries/graph-queries
 */

import type { GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type {
  CapabilityId,
  CustomerId,
  MachineId,
} from '../shared/identifiers.js';
import type { RelationshipType } from '../relationships/relationship-type.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type {
  AncestorsResult,
  CapabilityCustomersResult,
  CapabilityMachinesResult,
  CustomerProjectsResult,
  DescendantsResult,
  ImpactedEntitiesResult,
  MachineCapabilitiesResult,
  MachineProductsResult,
  NeighborsResult,
  RelatedEntitiesResult,
  ShortestPathResult,
} from './types.js';

/** Common query scope for graph reads. */
export interface GraphQueryScope {
  readonly organizationId: OrganizationId;
  readonly relationshipTypes?: readonly RelationshipType[];
  readonly nodeTypes?: readonly GraphNodeType[];
  readonly maxDepth?: number;
}

/** Read-side query port for the Lateen OS domain graph. */
export interface GraphQueries {
  /** Immediate adjacent nodes connected by any allowed edge. */
  findNeighbors(nodeId: GraphNodeId, scope: GraphQueryScope): Promise<NeighborsResult>;

  /** Ancestor nodes when traversing incoming BELONGS_TO, REPORTS_TO, DEPENDS_ON edges. */
  findAncestors(nodeId: GraphNodeId, scope: GraphQueryScope): Promise<AncestorsResult>;

  /** Descendant nodes when traversing outgoing hierarchy and dependency edges. */
  findDescendants(nodeId: GraphNodeId, scope: GraphQueryScope): Promise<DescendantsResult>;

  /** Shortest path between two nodes within optional relationship constraints. */
  findShortestPath(
    sourceNodeId: GraphNodeId,
    targetNodeId: GraphNodeId,
    scope: GraphQueryScope,
  ): Promise<ShortestPathResult | null>;

  /** Semantically related entities within bounded graph distance. */
  findRelatedEntities(
    nodeId: GraphNodeId,
    scope: GraphQueryScope,
  ): Promise<RelatedEntitiesResult>;

  /** Downstream entities affected if the source node changes or is removed. */
  findImpactedEntities(
    nodeId: GraphNodeId,
    scope: GraphQueryScope,
  ): Promise<ImpactedEntitiesResult>;

  /** Capabilities provided by a machine (Machine → PROVIDES → Capability). */
  findCapabilitiesForMachine(
    organizationId: OrganizationId,
    machineId: MachineId,
  ): Promise<MachineCapabilitiesResult>;

  /** Products linked to a machine (Machine → PRODUCES → Product). */
  findProductsForMachine(
    organizationId: OrganizationId,
    machineId: MachineId,
  ): Promise<MachineProductsResult>;

  /** Projects owned by or linked to a customer. */
  findProjectsForCustomer(
    organizationId: OrganizationId,
    customerId: CustomerId,
  ): Promise<CustomerProjectsResult>;

  /** Machines that provide a capability. */
  findMachinesForCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<CapabilityMachinesResult>;

  /** Customers using a capability through products, services, or projects. */
  findCustomersUsingCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<CapabilityCustomersResult>;
}
