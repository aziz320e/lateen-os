/**
 * Institutional Memory Runtime — the package's composition root. Wires
 * every real in-memory repository and service together: the Knowledge
 * (Memory) Lifecycle with immutable version history, the Memory Search
 * engine, the Knowledge Relationship service, the Knowledge Validation
 * engine, the Retention Engine, the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link InstitutionalMemoryRuntime} surface.
 *
 * @module runtime
 */
import {
  createKnowledgeEntryRepository,
  createKnowledgeEntryVersionRepository,
  createKnowledgeLifecycle,
  type KnowledgeLifecycle,
} from './knowledge/index.js';
import { createKnowledgeSearchEngine, type KnowledgeSearchEngine } from './knowledge/search.impl.js';
import { createKnowledgeRelationshipService, type KnowledgeRelationshipService } from './knowledge/relationships.impl.js';
import { createKnowledgeValidationEngine, type KnowledgeValidationEngine } from './knowledge/validation.impl.js';
import { createRetentionEngine, type RetentionEngine } from './knowledge/retention.impl.js';
import { createKnowledgeRuntimeQueries, type KnowledgeRuntimeQueries } from './queries/index.js';
import { createInstitutionalMemoryEventBus, type InstitutionalMemoryEventBus } from './events/index.js';
import { nowIso } from './shared/id.js';

export interface InstitutionalMemoryRuntimeDeps {
  readonly eventBus?: InstitutionalMemoryEventBus;
  readonly now?: () => string;
}

export interface InstitutionalMemoryRuntime {
  readonly lifecycle: KnowledgeLifecycle;
  readonly search: KnowledgeSearchEngine;
  readonly relationships: KnowledgeRelationshipService;
  readonly validation: KnowledgeValidationEngine;
  readonly retention: RetentionEngine;
  readonly queries: KnowledgeRuntimeQueries;
  /** Typed event bus — subscribe to knowledge.* lifecycle/version/review/expiration/relationship events. */
  readonly events: InstitutionalMemoryEventBus;
}

/** Creates a real, in-memory {@link InstitutionalMemoryRuntime}. */
export function createInstitutionalMemoryRuntime(deps: InstitutionalMemoryRuntimeDeps = {}): InstitutionalMemoryRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createInstitutionalMemoryEventBus();

  const knowledgeEntryRepository = createKnowledgeEntryRepository();
  const knowledgeEntryVersionRepository = createKnowledgeEntryVersionRepository();

  const lifecycle = createKnowledgeLifecycle(knowledgeEntryRepository, knowledgeEntryVersionRepository, eventBus, now);
  const search = createKnowledgeSearchEngine(knowledgeEntryRepository);
  const relationships = createKnowledgeRelationshipService(knowledgeEntryRepository, eventBus);
  const validation = createKnowledgeValidationEngine(knowledgeEntryRepository, now);
  const retention = createRetentionEngine(knowledgeEntryRepository, lifecycle, eventBus, now);

  const queries = createKnowledgeRuntimeQueries({
    knowledgeEntryRepository,
    relationshipService: relationships,
    retentionEngine: retention,
    searchEngine: search,
  });

  return {
    lifecycle,
    search,
    relationships,
    validation,
    retention,
    queries,
    events: eventBus,
  };
}
