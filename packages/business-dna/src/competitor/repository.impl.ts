/** Real, in-memory {@link CompetitorRepository} implementation. @module competitor/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Competitor } from './types.js';
import type { CompetitorRepository } from './repository.js';

/** Creates a real, in-memory {@link CompetitorRepository}. */
export function createCompetitorRepository(seed?: readonly Competitor[]): CompetitorRepository {
  const repo = createInMemoryRepository<Competitor>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((competitor) => competitor.status === status);
    },
    async findByName(organizationId, name) {
      return repo.list(organizationId).find((competitor) => competitor.name === name) ?? null;
    },
  };
}
