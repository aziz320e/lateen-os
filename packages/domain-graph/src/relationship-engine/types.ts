/** @module relationship-engine/types */
import type { DomainRelationshipType } from '../graph/types.js';
import type { GraphNodeId } from '../shared/identifiers.js';
import type { GraphLabel, GraphProperties } from '../shared/primitives.js';

export interface CreateRelationshipInput {
  readonly relationshipType: DomainRelationshipType;
  readonly sourceNodeId: GraphNodeId;
  readonly targetNodeId: GraphNodeId;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}

export interface UpdateRelationshipInput {
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}
