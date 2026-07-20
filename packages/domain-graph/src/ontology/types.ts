/**
 * Canonical ontology — allowed node–relationship–node triples in Lateen OS.
 *
 * This is the semantic contract for the domain graph. Implementations must
 * not persist edges that violate these rules.
 *
 * @module ontology/types
 */

import type { GraphNodeType } from '../nodes/node-type.js';
import type { RelationshipType } from '../relationships/relationship-type.js';

/** A single allowed relationship in the canonical ontology. */
export interface OntologyTriple {
  readonly source: GraphNodeType;
  readonly relationship: RelationshipType;
  readonly target: GraphNodeType;
  readonly description: string;
}

/** Semantic alias documenting intuitive phrasing (e.g. "Capability ENABLES Product"). */
export interface OntologySemanticAlias {
  readonly naturalLanguage: string;
  readonly triple: OntologyTriple;
}
