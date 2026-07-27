/** Real, in-memory {@link GapAnalysisRepository} implementation. @module gap-analysis/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { GapAnalysisRepository } from './repository.js';
import type { GapAnalysisResult } from './types.js';

/** Creates a real, in-memory {@link GapAnalysisRepository}. */
export function createGapAnalysisRepository(seed?: readonly GapAnalysisResult[]): GapAnalysisRepository {
  const repo = createInMemoryRepository<GapAnalysisResult>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return repo.list(organizationId).filter((result) => result.frameworkId === frameworkId);
    },
  };
}
