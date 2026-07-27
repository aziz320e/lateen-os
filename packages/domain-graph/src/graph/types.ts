/**
 * Core graph structures — nodes, edges, paths, metadata, and snapshots.
 *
 * @module graph/types
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DomainGraphId, GraphEdgeId, GraphNodeId, GraphSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { GraphLabel, GraphProperties, GraphTenantScoped } from '../shared/primitives.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** Lifecycle status of a graph entity registered by the real Entity Registry. */
export type GraphNodeStatus = 'active' | 'archived';

/** A vertex in the Lateen OS domain graph representing a Business DNA entity. */
export interface GraphNode<TNodeType extends GraphNodeType = GraphNodeType>
  extends GraphTenantScoped {
  readonly nodeId: GraphNodeId;
  readonly nodeType: TNodeType;
  readonly entityId: Identifier;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
  /** Present on entities registered by the real Entity Registry; absent on ontology-only node projections. */
  readonly status?: GraphNodeStatus;
  /** Present on entities registered by the real Entity Registry — the owning {@link DomainGraph}. */
  readonly graphId?: DomainGraphId;
  readonly createdAt?: Timestamp;
  readonly updatedAt?: Timestamp;
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

/**
 * Typed relationship vocabulary for the real Relationship Engine —
 * intentionally distinct from the ontology-driven, upper-snake-case
 * {@link RelationshipType} above (which governs `CANONICAL_ONTOLOGY`
 * triples). Lowercase, snake_case, and a different (smaller) vocabulary.
 */
export type DomainRelationshipType =
  | 'owns'
  | 'belongs_to'
  | 'manages'
  | 'depends_on'
  | 'references'
  | 'related_to'
  | 'competitor_of'
  | 'customer_of'
  | 'supplier_of'
  | 'member_of'
  | 'executes'
  | 'created_by'
  | 'assigned_to'
  | 'blocked_by';

/** Runtime-constant list of all real Relationship Engine types. */
export const DOMAIN_RELATIONSHIP_TYPES: readonly DomainRelationshipType[] = [
  'owns',
  'belongs_to',
  'manages',
  'depends_on',
  'references',
  'related_to',
  'competitor_of',
  'customer_of',
  'supplier_of',
  'member_of',
  'executes',
  'created_by',
  'assigned_to',
  'blocked_by',
] as const;

/**
 * A real, persisted relationship between two registered graph entities,
 * scoped to one {@link DomainGraph}. Distinct from the ontology-only
 * {@link GraphEdge} above (which has no `graphId` and is typed with the
 * canonical `RelationshipType`).
 */
export interface GraphRelationship extends GraphTenantScoped {
  readonly relationshipId: GraphEdgeId;
  readonly graphId: DomainGraphId;
  readonly relationshipType: DomainRelationshipType;
  readonly sourceNodeId: GraphNodeId;
  readonly targetNodeId: GraphNodeId;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type DomainGraphStatus = 'active' | 'archived';

/**
 * Real, lifecycle-managed graph container. Entities and relationships
 * registered by the Entity Registry / Relationship Engine are scoped to
 * one `(organizationId, id)` graph — distinct from the immutable
 * {@link GraphSnapshot} view type above.
 */
export interface DomainGraph extends TenantAuditableEntity<DomainGraphId> {
  readonly name: string;
  readonly description?: string;
  readonly status: DomainGraphStatus;
  readonly schemaVersion: string;
}
