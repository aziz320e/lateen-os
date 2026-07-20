/**
 * Graph edge definitions and typed edge shapes.
 *
 * @module edges/types
 */

import type { GraphEdge } from '../graph/types.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** Schema-level definition of an allowed edge in the ontology. */
export interface GraphEdgeDefinition {
  readonly relationshipType: RelationshipType;
  readonly sourceNodeType: GraphNodeType;
  readonly targetNodeType: GraphNodeType;
  readonly description: string;
}

/** Typed graph edge with explicit source and target node types. */
export interface TypedGraphEdge<
  TRelationship extends RelationshipType = RelationshipType,
  TSource extends GraphNodeType = GraphNodeType,
  TTarget extends GraphNodeType = GraphNodeType,
> extends GraphEdge {
  readonly relationshipType: TRelationship;
  readonly sourceNodeType: TSource;
  readonly targetNodeType: TTarget;
}
