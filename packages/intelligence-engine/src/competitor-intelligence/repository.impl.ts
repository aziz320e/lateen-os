/** Real in-memory {@link CompetitorRepository} implementation. @module competitor-intelligence/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CompetitorId } from '../shared/identifiers.js';
import type { Competitor } from './types.js';
import type { CompetitorRepository } from './repository.js';

export function createCompetitorRepository(seed?: readonly Competitor[]): CompetitorRepository {
  const repo = createInMemoryRepository<Competitor, CompetitorId>({ seed });
  return {
    ...repo,
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((competitor) => competitor.status === status);
    },
  };
}
