/**
 * Graph query result types.
 *
 * @module queries/types
 */

import type { GraphNode, GraphPath } from '../graph/types.js';
import type {
  CapabilityId,
  CustomerId,
  GraphNodeId,
  MachineId,
  ProductId,
  ProjectId,
} from '../shared/identifiers.js';

/** Entities related to a source node within a bounded hop count. */
export interface RelatedEntitiesResult {
  readonly sourceNodeId: GraphNodeId;
  readonly relatedNodes: readonly GraphNode[];
  readonly depth: number;
}

/** Entities impacted by a change to a source node (downstream dependents). */
export interface ImpactedEntitiesResult {
  readonly sourceNodeId: GraphNodeId;
  readonly impactedNodes: readonly GraphNode[];
}

/** Shortest path query result wrapper. */
export interface ShortestPathResult {
  readonly path: GraphPath;
}

/** Capability nodes reachable from a machine. */
export interface MachineCapabilitiesResult {
  readonly machineId: MachineId;
  readonly capabilities: readonly GraphNode[];
}

/** Product nodes producible or required by a machine. */
export interface MachineProductsResult {
  readonly machineId: MachineId;
  readonly products: readonly GraphNode[];
}

/** Project nodes owned by or linked to a customer. */
export interface CustomerProjectsResult {
  readonly customerId: CustomerId;
  readonly projects: readonly GraphNode[];
}

/** Machine nodes providing a capability. */
export interface CapabilityMachinesResult {
  readonly capabilityId: CapabilityId;
  readonly machines: readonly GraphNode[];
}

/** Customer nodes consuming a capability (via products, services, or projects). */
export interface CapabilityCustomersResult {
  readonly capabilityId: CapabilityId;
  readonly customers: readonly GraphNode[];
}

/** Ancestor nodes in the organizational or dependency hierarchy. */
export interface AncestorsResult {
  readonly nodeId: GraphNodeId;
  readonly ancestors: readonly GraphNode[];
}

/** Descendant nodes in the organizational or dependency hierarchy. */
export interface DescendantsResult {
  readonly nodeId: GraphNodeId;
  readonly descendants: readonly GraphNode[];
}

/** Immediate neighbor nodes. */
export interface NeighborsResult {
  readonly nodeId: GraphNodeId;
  readonly neighbors: readonly GraphNode[];
}
