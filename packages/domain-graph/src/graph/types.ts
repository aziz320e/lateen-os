/**
 * Core graph structures — nodes, edges, paths, metadata, and snapshots.
 *
 * @module graph/types
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { GraphEdgeId, GraphNodeId, GraphSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { GraphLabel, GraphProperties, GraphTenantScoped } from '../shared/primitives.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** A vertex in the Lateen OS domain graph representing a Business DNA entity. */
export interface GraphNode<TNodeType extends GraphNodeType = GraphNodeType>
  extends GraphTenantScoped {
  readonly nodeId: GraphNodeId;
  readonly nodeType: TNodeType;
  readonly entityId: Identifier;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}

/** A directed semantic relationship between two graph nodes. */
export interface GraphEdge extends GraphTenantScoped {
  readonly edgeId: GraphEdgeId;
  readonly relationshipType: RelationshipType;
  readonly sourceNodeId: GraphNodeId;
  readonly targetNodeId: GraphNodeId;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}

/** An ordered walk through nodes and edges in the domain graph. */
export interface GraphPath {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly length: number;
}

/** Descriptive metadata about a graph view or export. */
export interface GraphMetadata {
  readonly organizationId: OrganizationId;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly generatedAt: Timestamp;
  readonly schemaVersion: string;
  readonly description?: string;
}

/** Immutable point-in-time view of the domain graph (types only — no storage). */
export interface GraphSnapshot {
  readonly snapshotId: GraphSnapshotId;
  readonly metadata: GraphMetadata;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}
