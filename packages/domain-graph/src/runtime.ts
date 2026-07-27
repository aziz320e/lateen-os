/**
 * Domain Graph Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Graph Lifecycle, the
 * Entity Registry, the Relationship Engine, the Traversal Engine, the
 * Validation engine, the Search engine, the query layer, and the typed
 * event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link DomainGraphRuntime} surface.
 *
 * @module runtime
 */
import { createDomainGraphRepository, createGraphLifecycle, type GraphLifecycle } from './graph/index.js';
import { createEntityRegistry, type EntityRegistry } from './entities/index.js';
import { createRelationshipEngine, type RelationshipEngine } from './relationship-engine/index.js';
import { createEntityRepository, createGraphRepository, createRelationshipRepository } from './store/index.js';
import { createTraversalEngine, type TraversalEngine } from './traversal/index.js';
import { createGraphValidationEngine, type GraphValidationEngine } from './validation/index.js';
import { createGraphSearchEngine, type GraphSearchEngine } from './search/index.js';
import { createDomainGraphQueries, type DomainGraphQueries } from './queries/index.js';
import { createDomainGraphEventBus, type DomainGraphEventBus } from './events/index.js';
import { nowIso } from './shared/id.js';

export interface DomainGraphRuntimeDeps {
  readonly eventBus?: DomainGraphEventBus;
  readonly now?: () => string;
}

export interface DomainGraphRuntime {
  readonly graphs: GraphLifecycle;
  readonly entities: EntityRegistry;
  readonly relationships: RelationshipEngine;
  readonly traversal: TraversalEngine;
  readonly validation: GraphValidationEngine;
  readonly search: GraphSearchEngine;
  readonly queries: DomainGraphQueries;
  /** Typed event bus — subscribe to entity/relationship/graph events. */
  readonly events: DomainGraphEventBus;
}

/** Creates a real, in-memory {@link DomainGraphRuntime}. */
export function createDomainGraphRuntime(deps: DomainGraphRuntimeDeps = {}): DomainGraphRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createDomainGraphEventBus();

  const domainGraphRepository = createDomainGraphRepository();
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();

  const graphs = createGraphLifecycle(domainGraphRepository, eventBus, now);
  const entities = createEntityRegistry(entityRepository, eventBus, now);
  const relationships = createRelationshipEngine(entityRepository, relationshipRepository, eventBus, now);

  const graphRepository = createGraphRepository(entityRepository, relationshipRepository);
  const traversal = createTraversalEngine(graphRepository);
  const validation = createGraphValidationEngine(graphRepository, eventBus);
  const search = createGraphSearchEngine(graphRepository);

  const queries = createDomainGraphQueries({ graphRepository, searchEngine: search, traversalEngine: traversal });

  return {
    graphs,
    entities,
    relationships,
    traversal,
    validation,
    search,
    queries,
    events: eventBus,
  };
}
