/**
 * Relationship resolver port — resolve semantic meaning of edges.
 *
 * @module reasoning/relationship-resolver
 */

import type { GraphEdge } from '../graph/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OntologyTriple } from '../ontology/types.js';

/** Result of resolving an edge against the canonical ontology. */
export interface ResolvedRelationship {
  readonly edge: GraphEdge;
  readonly ontologyTriple: OntologyTriple | null;
  readonly valid: boolean;
}

/** Port for validating and resolving graph edges against the ontology. */
export interface RelationshipResolver {
  resolve(edge: GraphEdge): Promise<ResolvedRelationship>;

  isAllowed(triple: OntologyTriple): boolean;

  findAllowedRelationships(
    organizationId: OrganizationId,
    sourceNodeType: OntologyTriple['source'],
    targetNodeType: OntologyTriple['target'],
  ): Promise<readonly OntologyTriple[]>;
}
