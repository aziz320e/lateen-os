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
export * as store from './store/index.js';
export * as entities from './entities/index.js';
export * as relationshipEngine from './relationship-engine/index.js';
export * as validation from './validation/index.js';
export * as search from './search/index.js';
export * as events from './events/index.js';

export {
  createDomainGraphRuntime,
  type DomainGraphRuntime,
  type DomainGraphRuntimeDeps,
} from './runtime.js';

/** Core graph structures. */
export type {
  GraphNode,
  GraphNodeStatus,
  GraphEdge,
  GraphPath,
  GraphMetadata,
  GraphSnapshot,
  DomainGraph,
  DomainGraphStatus,
  DomainRelationshipType,
  GraphRelationship,
} from './graph/types.js';
export { DOMAIN_RELATIONSHIP_TYPES } from './graph/types.js';
export type { DomainGraphRepository } from './graph/repository.js';
export type { GraphLifecycle, CreateDomainGraphInput, UpdateDomainGraphInput } from './graph/lifecycle.impl.js';

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
  DomainGraphId,
} from './shared/identifiers.js';

/** Real Entity Registry. */
export type { EntityRegistry } from './entities/registry.impl.js';
export type { RegisterEntityInput, UpdateEntityInput } from './entities/types.js';

/** Real Relationship Engine. */
export type { RelationshipEngine } from './relationship-engine/engine.impl.js';
export type { CreateRelationshipInput, UpdateRelationshipInput } from './relationship-engine/types.js';

/** Real Traversal Engine. */
export type { TraversalEngine, TraversalRunOptions, DependencyOrderOptions } from './traversal/engine.impl.js';

/** Real Validation engine. */
export type { GraphValidationEngine } from './validation/engine.impl.js';
export type { GraphValidationReport, DuplicateEntityGroup, DanglingRelationshipReport } from './validation/types.js';

/** Real Search engine. */
export type { GraphSearchEngine } from './search/engine.impl.js';
export type { SearchEntitiesQuery, EntitySearchMatch } from './search/types.js';

/** Real Graph Repository facade types (internal — repositories are never exposed by the runtime). */
export type { EntityFilter, RelationshipFilter, NeighborDirection, GraphPathResult } from './store/graph-repository.js';

/** Real query layer. */
export type { DomainGraphQueries } from './queries/domain-graph-queries.js';

/** Typed event bus. */
export type { DomainGraphDomainEvent } from './events/domain-graph-events.js';
export { DOMAIN_GRAPH_EVENT_NAMES } from './events/domain-graph-events.js';
