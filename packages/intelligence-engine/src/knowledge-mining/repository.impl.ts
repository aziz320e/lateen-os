/** Real in-memory {@link KnowledgeFindingRepository} implementation. @module knowledge-mining/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { KnowledgeFindingId } from '../shared/identifiers.js';
import type { KnowledgeFinding } from './types.js';
import type { KnowledgeFindingRepository } from './repository.js';

export function createKnowledgeFindingRepository(seed?: readonly KnowledgeFinding[]): KnowledgeFindingRepository {
  return createInMemoryRepository<KnowledgeFinding, KnowledgeFindingId>({ seed });
}
