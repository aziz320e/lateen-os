/**
 * Knowledge entry aggregate.
 *
 * @module knowledge
 */
export * from './types.js';
export * from './value-objects.js';
export * from './events.js';
export * from './repository.js';
export { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from './repository.impl.js';
export {
  createKnowledgeLifecycle,
  canTransitionKnowledge,
  type KnowledgeLifecycle,
  type CreateKnowledgeEntryInput,
  type UpdateKnowledgeEntryInput,
} from './lifecycle.impl.js';
export {
  createKnowledgeSearchEngine,
  type KnowledgeSearchEngine,
  type SearchKnowledgeQuery,
  type KnowledgeSearchMatch,
} from './search.impl.js';
export {
  createKnowledgeRelationshipService,
  type KnowledgeRelationshipService,
  type DependencyGraph,
} from './relationships.impl.js';
export {
  createKnowledgeValidationEngine,
  type KnowledgeValidationEngine,
  type DuplicateCandidate,
  type DuplicateReason,
} from './validation.impl.js';
export {
  createRetentionEngine,
  type RetentionEngine,
  type CleanupRecommendation,
  type RetentionRunResult,
} from './retention.impl.js';
