/**
 * @lateen-os/domain-graph — Domain Graph
 *
 * Defines the canonical semantic relationships between all Business DNA entities.
 * Types, ontology, traversal ports, query ports, and reasoning ports only —
 * no data storage, graph database, or business logic.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as graph from './graph/index.js';
export * as nodes from './nodes/index.js';
export * as edges from './edges/index.js';
export * as relationships from './relationships/index.js';
export * as ontology from './ontology/index.js';
export * as traversal from './traversal/index.js';
export * as queries from './queries/index.js';
export * as reasoning from './reasoning/index.js';

/** Core graph structures. */
export type {
  GraphNode,
  GraphEdge,
  GraphPath,
  GraphMetadata,
  GraphSnapshot,
} from './graph/types.js';

/** Node types and registry. */
export type { GraphNodeType } from './nodes/node-type.js';
export { GRAPH_NODE_TYPES, GRAPH_NODE_DEFINITIONS } from './nodes/index.js';

/** Relationship types and registry. */
export type { RelationshipType } from './relationships/relationship-type.js';
export { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_DEFINITIONS } from './relationships/index.js';

/** Ontology. */
export type { OntologyTriple, OntologySemanticAlias } from './ontology/types.js';
export {
  CANONICAL_ONTOLOGY,
  ONTOLOGY_SEMANTIC_ALIASES,
  ONTOLOGY_VERSION,
} from './ontology/index.js';

/** Traversal ports. */
export type {
  GraphTraversal,
  TraversalOptions,
} from './traversal/graph-traversal.js';
export type {
  GraphNavigator,
  NavigationOptions,
  TraversalDirection,
} from './traversal/graph-navigator.js';
export type { GraphExplorer, GraphExploreFilter } from './traversal/graph-explorer.js';
export type { GraphPathFinder, PathFindOptions } from './traversal/graph-path-finder.js';

/** Query port. */
export type { GraphQueries, GraphQueryScope } from './queries/graph-queries.js';

/** Reasoning ports. */
export type {
  RelationshipResolver,
  ResolvedRelationship,
} from './reasoning/relationship-resolver.js';
export type {
  ImpactAnalyzer,
  ImpactScenario,
  ImpactSummary,
} from './reasoning/impact-analyzer.js';
export type {
  DependencyAnalyzer,
  DependencyAnalysisResult,
  DependencyChain,
} from './reasoning/dependency-analyzer.js';
export type {
  ContextResolver,
  ContextResolveOptions,
  EntityContext,
} from './reasoning/context-resolver.js';

/** Graph identifiers. */
export type {
  GraphNodeId,
  GraphEdgeId,
  GraphSnapshotId,
} from './shared/identifiers.js';
